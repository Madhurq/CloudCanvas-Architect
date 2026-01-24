import { create } from 'zustand';
import { awsServices, getConnectionDefault } from '../data/awsServices';

let nodeId = 0;
const getId = () => `node_${nodeId++}`;

// History management for undo/redo
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 50;

const pushToHistory = (state) => {
    // Remove any redo history if we make a new change
    history = history.slice(0, historyIndex + 1);
    
    // Add new state to history
    history.push({
        nodes: JSON.parse(JSON.stringify(state.nodes)),
        edges: JSON.parse(JSON.stringify(state.edges))
    });
    
    // Limit history size
    if (history.length > MAX_HISTORY) {
        history.shift();
    } else {
        historyIndex++;
    }
};

const undo = (state) => {
    if (historyIndex > 0) {
        historyIndex--;
        const prevState = history[historyIndex];
        return {
            nodes: JSON.parse(JSON.stringify(prevState.nodes)),
            edges: JSON.parse(JSON.stringify(prevState.edges))
        };
    }
    return null;
};

const redo = (state) => {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        const nextState = history[historyIndex];
        return {
            nodes: JSON.parse(JSON.stringify(nextState.nodes)),
            edges: JSON.parse(JSON.stringify(nextState.edges))
        };
    }
    return null;
};

// Load persisted state from localStorage
const loadPersistedState = () => {
    try {
        const region = localStorage.getItem('aws-calc-region') || 'us-east-1';
        const pricingModel = localStorage.getItem('aws-calc-pricing-model') || 'on-demand';
        const theme = localStorage.getItem('aws-calc-theme') || 'dark';
        return { region, pricingModel, theme };
    } catch {
        return { region: 'us-east-1', pricingModel: 'on-demand', theme: 'dark' };
    }
};

const persisted = loadPersistedState();

const useStore = create((set, get) => ({
    // React Flow state
    nodes: [],
    edges: [],

    // UI state
    selectedNode: null,
    selectedEdge: null,
    showConfigModal: false,

    // Region and Pricing state
    region: persisted.region,
    pricingModel: persisted.pricingModel,

    // Theme state
    theme: persisted.theme,

    // Set nodes (used by React Flow) - handles both direct values and callbacks
    setNodes: (nodesOrUpdater) => {
        if (typeof nodesOrUpdater === 'function') {
            set((state) => ({ nodes: nodesOrUpdater(state.nodes) }));
        } else {
            set({ nodes: nodesOrUpdater });
        }
    },

    // Set edges (used by React Flow) - handles both direct values and callbacks
    setEdges: (edgesOrUpdater) => {
        if (typeof edgesOrUpdater === 'function') {
            set((state) => ({ edges: edgesOrUpdater(state.edges) }));
        } else {
            set({ edges: edgesOrUpdater });
        }
    },

    // Handle node changes from React Flow
    onNodesChange: (changes) => {
        set((state) => {
            const newNodes = [...state.nodes];
            changes.forEach((change) => {
                if (change.type === 'position' && change.position) {
                    const nodeIndex = newNodes.findIndex((n) => n.id === change.id);
                    if (nodeIndex !== -1) {
                        newNodes[nodeIndex] = {
                            ...newNodes[nodeIndex],
                            position: change.position,
                        };
                    }
                }
                if (change.type === 'remove') {
                    const idx = newNodes.findIndex((n) => n.id === change.id);
                    if (idx !== -1) newNodes.splice(idx, 1);
                }
                if (change.type === 'select') {
                    const nodeIndex = newNodes.findIndex((n) => n.id === change.id);
                    if (nodeIndex !== -1) {
                        newNodes[nodeIndex] = {
                            ...newNodes[nodeIndex],
                            selected: change.selected,
                        };
                    }
                }
            });
            return { nodes: newNodes };
        });
    },

    // Handle edge changes from React Flow
    onEdgesChange: (changes) => {
        set((state) => {
            const newEdges = [...state.edges];
            changes.forEach((change) => {
                if (change.type === 'remove') {
                    const idx = newEdges.findIndex((e) => e.id === change.id);
                    if (idx !== -1) newEdges.splice(idx, 1);
                }
                if (change.type === 'select') {
                    const edgeIndex = newEdges.findIndex((e) => e.id === change.id);
                    if (edgeIndex !== -1) {
                        newEdges[edgeIndex] = {
                            ...newEdges[edgeIndex],
                            selected: change.selected,
                        };
                    }
                }
            });
            return { edges: newEdges };
        });
    },

    // Add new node when service is dropped
    addNode: (serviceType, position) => {
        const service = awsServices[serviceType];
        if (!service) return;

        const newNode = {
            id: getId(),
            type: 'awsService',
            position,
            data: {
                label: service.name,
                serviceType: service.id,
                icon: service.icon,
                color: service.color,
                config: { ...service.defaultConfig },
            },
        };

        set((state) => ({
            nodes: [...state.nodes, newNode],
        }));

        return newNode.id;
    },

    // Add edge between nodes
    addEdge: (connection) => {
        const sourceNode = get().nodes.find(n => n.id === connection.source);
        const targetNode = get().nodes.find(n => n.id === connection.target);

        if (!sourceNode || !targetNode) return;

        // Get smart defaults based on service types
        const defaults = getConnectionDefault(
            sourceNode.data.serviceType,
            targetNode.data.serviceType
        );

        const newEdge = {
            id: `edge_${connection.source}_${connection.target}`,
            source: connection.source,
            target: connection.target,
            type: 'labeled',
            animated: true,
            data: {
                port: defaults.port,
                protocol: defaults.protocol,
                sourceType: sourceNode.data.serviceType,
                targetType: targetNode.data.serviceType,
            },
        };

        set((state) => ({
            edges: [...state.edges, newEdge],
        }));
    },

    // Update node configuration
    updateNodeConfig: (nodeId, config) => {
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, config: { ...node.data.config, ...config } } }
                    : node
            ),
        }));
    },

    // Update edge data
    updateEdgeData: (edgeId, data) => {
        set((state) => ({
            edges: state.edges.map((edge) =>
                edge.id === edgeId
                    ? { ...edge, data: { ...edge.data, ...data } }
                    : edge
            ),
        }));
    },

    // Select node for configuration
    selectNode: (nodeId) => {
        set({ selectedNode: nodeId, showConfigModal: nodeId !== null });
    },

    // Select edge for configuration
    selectEdge: (edgeId) => {
        set({ selectedEdge: edgeId });
    },

    // Close config modal
    closeConfigModal: () => {
        set({ selectedNode: null, showConfigModal: false });
    },

    // Delete selected nodes/edges
    deleteSelected: () => {
        set((state) => ({
            nodes: state.nodes.filter((n) => !n.selected),
            edges: state.edges.filter((e) => !e.selected),
        }));
    },

    // Clear canvas
    clearCanvas: () => {
        set({ nodes: [], edges: [], selectedNode: null, selectedEdge: null });
        nodeId = 0;
    },

    // Set region
    setRegion: (region) => {
        set({ region });
        localStorage.setItem('aws-calc-region', region);
    },

    // Set pricing model
    setPricingModel: (pricingModel) => {
        set({ pricingModel });
        localStorage.setItem('aws-calc-pricing-model', pricingModel);
    },

    // Export architecture
    exportArchitecture: () => {
        const state = get();
        const architecture = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            region: state.region,
            pricingModel: state.pricingModel,
            nodes: state.nodes,
            edges: state.edges,
        };
        return architecture;
    },

    // Import architecture
    importArchitecture: (architecture) => {
        if (!architecture || architecture.version !== '1.0') {
            throw new Error('Invalid or incompatible architecture file');
        }
        
        set({
            nodes: architecture.nodes || [],
            edges: architecture.edges || [],
            region: architecture.region || 'us-east-1',
            pricingModel: architecture.pricingModel || 'on-demand',
            selectedNode: null,
            selectedEdge: null,
        });

        // Update nodeId counter to prevent ID conflicts
        const maxNodeId = (architecture.nodes || []).reduce((max, node) => {
            const match = node.id.match(/node_(\d+)/);
            return match ? Math.max(max, parseInt(match[1], 10)) : max;
        }, -1);
        nodeId = maxNodeId + 1;

        // Persist to localStorage
        localStorage.setItem('aws-calc-region', architecture.region || 'us-east-1');
        localStorage.setItem('aws-calc-pricing-model', architecture.pricingModel || 'on-demand');
    },

    // Load template (similar to import but doesn't require version check)
    loadTemplate: (nodes, edges) => {
        // Reset nodeId for clean slate
        nodeId = 0;
        
        set({
            nodes: nodes ? nodes.map(node => ({ ...node })) : [],
            edges: edges ? edges.map(edge => ({ ...edge })) : [],
            selectedNode: null,
            selectedEdge: null,
        });

        // Update nodeId counter
        const maxNodeId = (nodes || []).reduce((max, node) => {
            const match = node.id.match(/node_(\d+)/);
            return match ? Math.max(max, parseInt(match[1], 10)) : max;
        }, -1);
        nodeId = maxNodeId + 1;
        
        // Push initial state to history
        pushToHistory({ nodes: nodes || [], edges: edges || [] });
    },

    // Undo last action
    undo: () => {
        const state = get();
        const prevState = undo(state);
        if (prevState) {
            set(prevState);
        }
    },

    // Redo last undone action
    redo: () => {
        const state = get();
        const nextState = redo(state);
        if (nextState) {
            set(nextState);
        }
    },

    // Track changes for history
    recordHistory: () => {
        pushToHistory(get());
    },

    // Toggle theme
    toggleTheme: () => {
        set((state) => {
            const newTheme = state.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('aws-calc-theme', newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
            return { theme: newTheme };
        });
    },

    // Set theme
    setTheme: (theme) => {
        localStorage.setItem('aws-calc-theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
    },
}));

export default useStore;
