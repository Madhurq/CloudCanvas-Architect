import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { awsServices } from '../data/awsServices';

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
    const { nodes, selectedNode, closeConfigModal, updateNodeConfig, updateNodeRegion } = useStore();
    const [localConfig, setLocalConfig] = useState({});
    const [localRegion, setLocalRegion] = useState('us-east-1');

    const node = nodes.find((n) => n.id === selectedNode);
    const serviceType = node?.data?.serviceType;
    const service = serviceType ? awsServices[serviceType] : null;

    useEffect(() => {
        if (node?.data?.config) {
            setLocalConfig({ ...node.data.config });
        }
        if (node?.data?.region) {
            setLocalRegion(node.data.region);
        }
    }, [node]);

    if (!node || !service) return null;

    const handleChange = (key, value, type) => {
        let parsedValue = value;
        if (type === 'number') {
            parsedValue = parseFloat(value) || 0;
        } else if (type === 'boolean') {
            parsedValue = value === 'true' || value === true;
        }
        setLocalConfig((prev) => ({ ...prev, [key]: parsedValue }));
    };

    const handleSave = () => {
        updateNodeConfig(selectedNode, localConfig);
        updateNodeRegion(selectedNode, localRegion);
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
                    {/* Region Selector */}
                    <div className="config-field region-selector">
                        <label htmlFor="node-region">🌍 Region</label>
                        <select
                            id="node-region"
                            value={localRegion}
                            onChange={(e) => setLocalRegion(e.target.value)}
                            className="region-select"
                        >
                            {AWS_REGIONS.map((region) => (
                                <option key={region.value} value={region.value}>
                                    {region.label}
                                </option>
                            ))}
                        </select>
                        <p className="hint">Region affects pricing and data transfer costs</p>
                    </div>

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
