import { create } from 'zustand';
import { awsServices } from '../data/awsServices';

let nodeId = 0;
const getId = () => `node_${nodeId++}`;

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

    // Set nodes (used by React Flow)
    setNodes: (nodesOrUpdater) => {
        if (typeof nodesOrUpdater === 'function') {
            set((state) => ({ nodes: nodesOrUpdater(state.nodes) }));
        } else {
            set({ nodes: nodesOrUpdater });
        }
    },

    // Set edges (used by React Flow)
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

        const newEdge = {
            id: `edge_${connection.source}_${connection.target}`,
            source: connection.source,
            target: connection.target,
            type: 'default',
            animated: true,
            data: {
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

    // Select node for configuration
    selectNode: (nodeId) => {
        set({ selectedNode: nodeId, showConfigModal: nodeId !== null });
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

    // Toggle theme
    toggleTheme: () => {
        set((state) => {
            const newTheme = state.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('aws-calc-theme', newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
            return { theme: newTheme };
        });
    },

    // Export architecture
    exportArchitecture: () => {
        const state = get();
        return {
            version: '1.0',
            timestamp: new Date().toISOString(),
            region: state.region,
            pricingModel: state.pricingModel,
            nodes: state.nodes,
            edges: state.edges,
        };
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

        // Update nodeId counter
        const maxNodeId = (architecture.nodes || []).reduce((max, node) => {
            const match = node.id.match(/node_(\d+)/);
            return match ? Math.max(max, parseInt(match[1], 10)) : max;
        }, -1);
        nodeId = maxNodeId + 1;
    },
}));

export default useStore;
