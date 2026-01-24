import { useCallback } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    MiniMap,
    addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import useStore from '../store/useStore';
import AWSServiceNode from './AWSServiceNode';
import LabeledEdge from './LabeledEdge';
import { getConnectionDefault } from '../data/awsServices';
import { validateConnection } from '../utils/connectionValidator';

const nodeTypes = {
    awsService: AWSServiceNode,
};

const edgeTypes = {
    labeled: LabeledEdge,
};

const DesignCanvas = () => {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        addNode,
        setEdges,
        selectNode,
    } = useStore();

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

        const reactFlowBounds = event.currentTarget.getBoundingClientRect();
        const position = {
            x: event.clientX - reactFlowBounds.left - 100,
            y: event.clientY - reactFlowBounds.top - 50,
        };

        addNode(serviceType, position);
    }, [addNode]);

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
                <MiniMap
                    className="flow-minimap"
                    nodeColor={(node) => node.data?.color || '#666'}
                    maskColor="rgba(0, 0, 0, 0.8)"
                />
            </ReactFlow>

            <div className="canvas-hint">
                <p>Drop services here • Connect by dragging handles • Double-click to configure • Invalid connections blocked</p>
            </div>
        </div>
    );
};

export default DesignCanvas;
