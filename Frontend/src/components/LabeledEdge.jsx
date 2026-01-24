import { memo, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import useStore from '../store/useStore';
import { getConnectionStatus } from '../utils/connectionValidator';

const LabeledEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
}) => {
    const [showInfo, setShowInfo] = useState(false);
    const updateEdgeData = useStore((state) => state.updateEdgeData);

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const handleLabelClick = (e) => {
        e.stopPropagation();
        const newPort = prompt('Enter port number:', data?.port || 443);
        if (newPort) {
            updateEdgeData(id, { port: parseInt(newPort, 10) || 443 });
        }
    };

    // Get connection validation status
    const connectionStatus = data?.sourceType && data?.targetType 
        ? getConnectionStatus(data.sourceType, data.targetType)
        : null;

    // Determine edge color based on validation
    let edgeColor = '#666666';
    let edgeStroke = 2;
    let strokeDasharray = '0';

    if (connectionStatus && !connectionStatus.valid) {
        edgeColor = '#FF0000';
        edgeStroke = 3;
        strokeDasharray = '5,5';
    } else if (connectionStatus?.antiPatterns?.length > 0) {
        const hasError = connectionStatus.antiPatterns.some(ap => ap.severity === 'error');
        const hasWarning = connectionStatus.antiPatterns.some(ap => ap.severity === 'warning');
        
        if (hasError) {
            edgeColor = '#FF6B6B';
            edgeStroke = 2.5;
            strokeDasharray = '3,3';
        } else if (hasWarning) {
            edgeColor = '#FFD700';
            edgeStroke = 2;
        }
    }

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                className={`labeled-edge ${selected ? 'selected' : ''}`}
                style={{
                    stroke: edgeColor,
                    strokeWidth: edgeStroke,
                    strokeDasharray,
                }}
            />
            <EdgeLabelRenderer>
                <div
                    className="edge-label-container"
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}
                    onMouseEnter={() => setShowInfo(true)}
                    onMouseLeave={() => setShowInfo(false)}
                >
                    <div
                        className="edge-label"
                        onClick={handleLabelClick}
                        title="Click to edit port"
                        style={{
                            backgroundColor: edgeColor,
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {connectionStatus?.valid === false && '❌ '}
                        {connectionStatus?.antiPatterns?.length > 0 && '⚠️ '}
                        {data?.protocol || 'HTTPS'}:{data?.port || 443}
                    </div>

                    {showInfo && connectionStatus && (
                        <div
                            className="edge-info-tooltip"
                            style={{
                                position: 'absolute',
                                bottom: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: '#1F2937',
                                color: '#fff',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                whiteSpace: 'normal',
                                maxWidth: '250px',
                                marginBottom: '8px',
                                zIndex: 1000,
                                border: `2px solid ${edgeColor}`,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            }}
                        >
                            {connectionStatus.antiPatterns?.length > 0 && (
                                <div>
                                    {connectionStatus.antiPatterns.map((ap, idx) => (
                                        <div key={idx} style={{ marginBottom: '4px' }}>
                                            <strong>{ap.severity === 'error' ? '❌' : '⚠️'} {ap.message}</strong>
                                            <p style={{ marginTop: '2px', fontSize: '10px', opacity: 0.9 }}>
                                                💡 {ap.suggestion}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {connectionStatus.bestPractices?.length > 0 && (
                                <div style={{ marginTop: '8px', borderTop: '1px solid #666', paddingTop: '8px' }}>
                                    <strong>💡 Best Practices:</strong>
                                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', fontSize: '10px' }}>
                                        {connectionStatus.bestPractices.slice(0, 2).map((bp, idx) => (
                                            <li key={idx}>{bp}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
};

export default memo(LabeledEdge);
