import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const AWSServiceNode = ({ data, selected }) => {
    const regionShortName = data.region ? data.region.split('-')[0] : 'us';
    
    return (
        <div
            className={`aws-node ${selected ? 'selected' : ''}`}
            style={{
                borderColor: data.color,
                '--node-color': data.color,
            }}
        >
            <Handle type="target" position={Position.Left} className="handle" />

            <div className="node-header" style={{ backgroundColor: data.color }}>
                <span className="node-icon">{data.icon}</span>
                <span className="node-label">{data.label}</span>
                {data.region && (
                    <span 
                        className="node-region-badge" 
                        data-region={data.region}
                        title={`Region: ${data.region}`}
                    >
                        {regionShortName}
                    </span>
                )}
            </div>

            <div className="node-body">
                {data.config && (
                    <div className="node-config-preview">
                        {Object.entries(data.config).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="config-item">
                                <span className="config-key">{formatKey(key)}:</span>
                                <span className="config-value">{formatValue(value)}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div className="node-hint">Double-click to configure</div>
            </div>

            <Handle type="source" position={Position.Right} className="handle" />
        </div>
    );
};

const formatKey = (key) => {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
};

const formatValue = (value) => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
};

export default memo(AWSServiceNode);
