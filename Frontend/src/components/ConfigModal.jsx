import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { awsServices, containerTypes } from '../data/awsServices';

const AWS_REGIONS = [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-east-2', label: 'US East (Ohio)' },
    { value: 'us-west-1', label: 'US West (N. California)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'eu-west-1', label: 'Europe (Ireland)' },
    { value: 'eu-west-2', label: 'Europe (London)' },
    { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
    { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
    { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
    { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
];

const ConfigModal = () => {
    const { nodes, selectedNode, closeConfigModal, updateNodeConfig, updateNodeRegion, updateContainerRegion, region } = useStore();
    const [localConfig, setLocalConfig] = useState({});
    const [localRegion, setLocalRegion] = useState('us-east-1');

    const node = nodes.find((n) => n.id === selectedNode);
    const serviceType = node?.data?.serviceType;
    
    // Check if it's a container type (VPC, subnet, security group) or regular service
    const isContainer = containerTypes && containerTypes[serviceType];
    const service = isContainer ? containerTypes[serviceType] : awsServices[serviceType];
    
    // Check if this is a VPC node
    const isVPC = serviceType === 'vpc';
    
    // Find the nearest parent VPC by walking up the parent chain
    const findRegionForNode = (currentNode) => {
        if (!currentNode) return region;
        if (currentNode.data?.serviceType === 'vpc') {
            return currentNode.data.region || region;
        }
        if (currentNode.parentNode) {
            const parent = nodes.find(n => n.id === currentNode.parentNode);
            return findRegionForNode(parent);
        }
        return region;
    };
    
    const inheritedRegion = findRegionForNode(node);

    useEffect(() => {
        if (node?.data?.config) {
            setLocalConfig({ ...node.data.config });
        }
        if (node?.data?.region) {
            setLocalRegion(node.data.region);
        } else {
            setLocalRegion(inheritedRegion);
        }
    }, [node, inheritedRegion]);

    if (!node || !service) return null;

    const handleChange = (key, value, type) => {
        let parsedValue = value;
        if (type === 'number') {
            parsedValue = parseFloat(value) || 0;
        } else if (type === 'boolean') {
            parsedValue = value === 'true' || value === true;
        } else {
            // text and other fields stay as-is
            parsedValue = value;
        }
        setLocalConfig((prev) => ({ ...prev, [key]: parsedValue }));
    };

    const handleSave = () => {
        updateNodeConfig(selectedNode, localConfig);
        
        // If this is a VPC, update it and all its children
        if (isVPC) {
            updateContainerRegion(selectedNode, localRegion);
        } else {
            updateNodeRegion(selectedNode, localRegion);
        }
        
        closeConfigModal();
    };

    const handleCancel = () => {
        closeConfigModal();
    };

    return (
        <div className="modal-overlay" onClick={handleCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header" style={{ backgroundColor: service.color }}>
                    <span className="modal-icon">{service.icon}</span>
                    <h2>{service.name} Configuration</h2>
                    <button className="modal-close" onClick={handleCancel}>×</button>
                </div>

                <div className="modal-body">
                    {/* Region Selector - Only editable for VPC */}
                    {isVPC ? (
                        <div className="config-field region-selector vpc-region">
                            <label htmlFor="node-region">🌍 Deployment Region</label>
                            <select
                                id="node-region"
                                value={localRegion}
                                onChange={(e) => setLocalRegion(e.target.value)}
                                className="region-select"
                            >
                                {AWS_REGIONS.map((r) => (
                                    <option key={r.value} value={r.value}>
                                        {r.label}
                                    </option>
                                ))}
                            </select>
                            <p className="hint hint-important">
                                🔒 This sets the region for this VPC and all resources inside it
                            </p>
                        </div>
                    ) : (
                        <div className="config-field region-display">
                            <label>🌍 Region</label>
                            <div className="inherited-region">
                                <span className="region-value">
                                    {AWS_REGIONS.find(r => r.value === localRegion)?.label || localRegion}
                                </span>
                                <span className="inherited-badge">Inherited from nearest parent VPC</span>
                            </div>
                            <p className="hint">Region is set by the nearest parent VPC configuration</p>
                        </div>
                    )}

                    <div className="config-divider"></div>

                    {service.configFields.map((field) => (
                        <div key={field.key} className="config-field">
                            <label htmlFor={field.key}>{field.label}</label>

                            {field.type === 'select' ? (
                                <select
                                    id={field.key}
                                    value={localConfig[field.key] || ''}
                                    onChange={(e) => handleChange(field.key, e.target.value, field.type)}
                                >
                                    {field.options.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            ) : field.type === 'boolean' ? (
                                <div className="toggle-container">
                                    <input
                                        type="checkbox"
                                        id={field.key}
                                        checked={localConfig[field.key] || false}
                                        onChange={(e) => handleChange(field.key, e.target.checked, field.type)}
                                    />
                                    <label htmlFor={field.key} className="toggle-label">
                                        {localConfig[field.key] ? 'Enabled' : 'Disabled'}
                                    </label>
                                </div>
                            ) : field.type === 'text' ? (
                                <input
                                    type="text"
                                    id={field.key}
                                    value={localConfig[field.key] || ''}
                                    onChange={(e) => handleChange(field.key, e.target.value, field.type)}
                                />
                            ) : (
                                <input
                                    type="number"
                                    id={field.key}
                                    value={localConfig[field.key] || ''}
                                    min={field.min}
                                    max={field.max}
                                    onChange={(e) => handleChange(field.key, e.target.value, field.type)}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleSave}>
                        Apply Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfigModal;
