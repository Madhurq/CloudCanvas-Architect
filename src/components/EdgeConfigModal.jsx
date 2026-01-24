import { useState } from 'react';
import useStore from '../store/useStore';

const EdgeConfigModal = ({ edgeId, onClose }) => {
    const { edges, updateEdgeData } = useStore();
    const edge = edges.find(e => e.id === edgeId);

    if (!edge) return null;

    const [bandwidthGB, setBandwidthGB] = useState(edge.data?.bandwidthGB || 10);
    const [transferType, setTransferType] = useState(edge.data?.transferType || 'intra-region');

    const handleSave = () => {
        updateEdgeData(edgeId, {
            bandwidthGB: parseFloat(bandwidthGB),
            transferType
        });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>📊 Data Transfer Config</h2>

                <div className="config-group">
                    <label>Bandwidth (GB/month)</label>
                    <input
                        type="number"
                        min="0"
                        step="1"
                        value={bandwidthGB}
                        onChange={(e) => setBandwidthGB(e.target.value)}
                    />
                    <p className="hint">Amount of data transferred between services</p>
                </div>

                <div className="config-group">
                    <label>Transfer Type</label>
                    <select value={transferType} onChange={(e) => setTransferType(e.target.value)}>
                        <option value="intra-region">Within Region (Free)</option>
                        <option value="inter-az">Between AZs ($0.01/GB)</option>
                        <option value="inter-region">Between Regions ($0.02/GB)</option>
                        <option value="internet">To Internet ($0.09/GB)</option>
                    </select>
                    <p className="hint">Determines data transfer pricing</p>
                </div>

                <div className="modal-actions">
                    <button className="btn btn-primary" onClick={handleSave}>
                        Save
                    </button>
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EdgeConfigModal;
