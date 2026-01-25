import { useCallback } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    Controls,
    Background,
    MiniMap,
    addEdge,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import useStore from '../store/useStore';
import AWSServiceNode from './AWSServiceNode';
import GroupNode from './GroupNode';
import LabeledEdge from './LabeledEdge';
import { getConnectionDefault, isContainerType, containerTypes } from '../data/awsServices';
import { validateConnection } from '../utils/connectionValidator';

const nodeTypes = {
    awsService: AWSServiceNode,
    groupNode: GroupNode,
};

const edgeTypes = {
    labeled: LabeledEdge,
};

const DesignCanvasInner = () => {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        addNode,
        setEdges,
        selectNode,
    } = useStore();

    const { screenToFlowPosition, getNodes } = useReactFlow();

    const onConnect = useCallback((connection) => {
        const sourceNode = nodes.find(n => n.id === connection.source);
        const targetNode = nodes.find(n => n.id === connection.target);

        // Validate connection
        const validation = validateConnection(
            sourceNode?.data?.serviceType,
            targetNode?.data?.serviceType
        );

        if (!validation.valid) {
            alert(`❌ Invalid Connection: ${validation.error}\n\nAllowed connections for ${sourceNode?.data?.label} are:\n${sourceNode?.data?.allowedConnections?.join(', ') || 'None'}`);
            return;
        }

        const defaults = getConnectionDefault(
            sourceNode?.data?.serviceType,
            targetNode?.data?.serviceType
        );

        const newEdge = {
            ...connection,
            type: 'labeled',
            animated: true,
            data: {
                ...defaults,
                sourceType: sourceNode?.data?.serviceType,
                targetType: targetNode?.data?.serviceType,
                isValid: validation.valid,
            },
        };

        setEdges((eds) => addEdge(newEdge, eds));
    }, [nodes, setEdges]);

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((event) => {
        event.preventDefault();

        const serviceType = event.dataTransfer.getData('application/reactflow');
        if (!serviceType) return;

        // Convert screen position to flow position (accounts for zoom/pan)
        const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        // Check if drop is inside a container node (VPC, Subnet, etc.)
        const allNodes = getNodes();
        let parentNode = null;

        // Find container nodes that contain the drop position
        // Sort by z-index (nodes added later are on top) and check from top to bottom
        const containerNodes = allNodes
            .filter(node => node.type === 'groupNode' && node.data?.isContainer)
            .reverse(); // Check topmost containers first

        for (const node of containerNodes) {
            const nodeX = node.position.x;
            const nodeY = node.position.y;
            // Get dimensions from style, measuredWidth/measuredHeight, or defaults
            const nodeWidth = node.measuredWidth || node.width ||
                (typeof node.style?.width === 'number' ? node.style.width :
                    (node.data?.minWidth || 500));
            const nodeHeight = node.measuredHeight || node.height ||
                (typeof node.style?.height === 'number' ? node.style.height :
                    (node.data?.minHeight || 350));

            // Check if drop position is within container bounds
            if (
                position.x >= nodeX &&
                position.x <= nodeX + nodeWidth &&
                position.y >= nodeY &&
                position.y <= nodeY + nodeHeight
            ) {
                parentNode = node;
                break; // Use the first matching container (topmost)
            }
        }

        // Calculate final position
        let finalPosition = {
            x: position.x - 100,
            y: position.y - 50,
        };

        // If dropping inside a container, adjust position relative to parent
        if (parentNode) {
            const parentX = parentNode.position.x;
            const parentY = parentNode.position.y;
            const headerHeight = 50; // Approximate header height for VPC/container nodes
            // Position relative to parent (account for header height)
            // Ensure node is positioned within parent bounds
            finalPosition = {
                x: Math.max(10, position.x - parentX - 100), // Leave some padding from left edge
                y: Math.max(headerHeight + 10, position.y - parentY - 50), // Below header with padding
            };
        }

        addNode(serviceType, finalPosition, parentNode?.id || null);
    }, [addNode, screenToFlowPosition, getNodes]);

    const onNodeDoubleClick = useCallback((event, node) => {
        selectNode(node.id);
    }, [selectNode]);

    return (
        <div className="design-canvas">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeDoubleClick={onNodeDoubleClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                snapToGrid
                snapGrid={[15, 15]}
                defaultEdgeOptions={{
                    type: 'labeled',
                    animated: true,
                }}
            >
                <Background variant="dots" gap={20} size={1} color="#374151" />
                <Controls className="flow-controls" />
                {/* <MiniMap
                    className="flow-minimap"
                    nodeColor={(node) => node.data?.color || '#666'}
                    maskColor="rgba(0, 0, 0, 0.8)"
                /> */}
            </ReactFlow>

            {/* <div className="canvas-hint">
                <p>Drop services here • Connect by dragging handles • Double-click to configure • Invalid connections blocked</p>
            </div> */}
        </div>
    );
};

// Wrapper component to provide ReactFlow context

const DesignCanvas = () => (
    <ReactFlowProvider>
        <DesignCanvasInner />
    </ReactFlowProvider>
);

export default DesignCanvas;

