import { useCallback, useState } from 'react';
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

// Services that don't require VPC (networking services themselves)
const VPC_INDEPENDENT_SERVICES = ['vpc', 'security_group', 'subnet_public', 'subnet_private'];

// Services that require VPC to be created first
const VPC_REQUIRED_SERVICES = [
    'ec2', 'ecs', 'eks', 'lambda', 'rds', 'elasticache', 'alb', 'nlb', 
    'aurora', 'redshift', 'opensearch', 'mq', 'msk', 'batch', 'lightsail',
    'apprunner', 'nat_gateway', 'efs'
];

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
        region,
    } = useStore();

    const { screenToFlowPosition, getNodes } = useReactFlow();
    const [showVPCWarning, setShowVPCWarning] = useState(false);
    const [pendingService, setPendingService] = useState(null);

    // Check if VPC exists in the canvas
    const hasVPC = useCallback(() => {
        return nodes.some(node => node.data?.serviceType === 'vpc');
    }, [nodes]);

    // Check if Security Group exists in the canvas
    const hasSecurityGroup = useCallback(() => {
        return nodes.some(node => node.data?.serviceType === 'security_group');
    }, [nodes]);

    // Get VPC node for reference
    const getVPCNode = useCallback(() => {
        return nodes.find(node => node.data?.serviceType === 'vpc');
    }, [nodes]);

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

        // Check if VPC is required for this service
        const requiresVPC = VPC_REQUIRED_SERVICES.includes(serviceType);
        const isVPCIndependent = VPC_INDEPENDENT_SERVICES.includes(serviceType);

        // If service requires VPC and no VPC exists, show warning
        if (requiresVPC && !hasVPC()) {
            setShowVPCWarning(true);
            setPendingService(serviceType);
            return;
        }

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

        // For VPC-required services not dropped in a container, auto-assign to VPC if exists
        if (requiresVPC && !parentNode && hasVPC()) {
            const vpcNode = getVPCNode();
            if (vpcNode) {
                // Position inside the VPC
                const vpcX = vpcNode.position.x;
                const vpcY = vpcNode.position.y;
                const headerHeight = 50;
                
                // Calculate position relative to VPC
                let relativeX = position.x - vpcX - 100;
                let relativeY = position.y - vpcY - 50;
                
                // Ensure within VPC bounds
                relativeX = Math.max(10, Math.min(relativeX, (vpcNode.style?.width || 500) - 220));
                relativeY = Math.max(headerHeight + 10, Math.min(relativeY, (vpcNode.style?.height || 350) - 120));
                
                addNode(serviceType, { x: relativeX, y: relativeY }, vpcNode.id);
                return;
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
    }, [addNode, screenToFlowPosition, getNodes, hasVPC, getVPCNode]);

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
            </ReactFlow>

            {/* VPC Required Warning Modal */}
            {showVPCWarning && (
                <div className="vpc-warning-overlay" onClick={() => setShowVPCWarning(false)}>
                    <div className="vpc-warning-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="vpc-warning-header">
                            <h3>🔒 VPC Required</h3>
                            <button className="close-btn" onClick={() => setShowVPCWarning(false)}>✕</button>
                        </div>
                        <div className="vpc-warning-body">
                            <p>
                                Before adding <strong>{pendingService?.toUpperCase()}</strong> or other AWS services, 
                                you need to create a <strong>VPC (Virtual Private Cloud)</strong> first.
                            </p>
                            <div className="vpc-steps">
                                <h4>Getting Started:</h4>
                                <ol>
                                    <li>
                                        <strong>Create a VPC</strong> - Drag the VPC container from the 
                                        <span className="highlight"> Networking</span> category onto the canvas
                                    </li>
                                    <li>
                                        <strong>Configure the VPC</strong> - Double-click to set region, CIDR block, and name
                                    </li>
                                    <li>
                                        <strong>Add Security Groups</strong> - Create security groups to define firewall rules
                                    </li>
                                    <li>
                                        <strong>Add Services</strong> - Now you can add EC2, RDS, Lambda, and other services inside the VPC
                                    </li>
                                </ol>
                            </div>
                            <p className="vpc-tip">
                                💡 <strong>Tip:</strong> All resources will be deployed in the region you configure for the VPC.
                            </p>
                        </div>
                        <div className="vpc-warning-footer">
                            <button className="btn btn-primary" onClick={() => setShowVPCWarning(false)}>
                                Got it! I'll create a VPC first
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Canvas hint when empty */}
            {nodes.length === 0 && (
                <div className="canvas-empty-hint">
                    <div className="empty-hint-content">
                        <h3>🏗️ Start by Creating a VPC</h3>
                        <p>Drag a <strong>VPC</strong> from the Networking category to begin designing your AWS architecture.</p>
                        <p className="hint-steps">
                            <span>1. Create VPC → </span>
                            <span>2. Add Security Group → </span>
                            <span>3. Add Services</span>
                        </p>
                    </div>
                </div>
            )}
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

