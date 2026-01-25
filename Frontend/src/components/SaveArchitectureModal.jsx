import { useState } from 'react';
import useStore from '../store/useStore';
import apiClient from '../services/apiClient';
import '../styles/SaveArchitecture.css';

const SaveArchitectureModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { nodes, edges, region, pricingModel } = useStore();

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Architecture name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.createArchitecture({
        name: name.trim(),
        description: description.trim(),
        nodes,
        edges,
        region,
        pricingModel
      });

      if (response?.data?.architecture || response?.architecture) {
        setName('');
        setDescription('');
        alert('✅ Architecture saved successfully!');
        onClose();
      } else {
        setError(response?.error || 'Failed to save architecture');
      }
    } catch (err) {
      setError(err.message || 'Failed to save architecture');
      console.error('Save architecture error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content save-arch-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💾 Save Architecture</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="save-arch-form">
          <div className="form-group">
            <label htmlFor="arch-name">Architecture Name *</label>
            <input
              id="arch-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., E-commerce Platform, API Gateway..."
              maxLength={255}
              disabled={loading}
            />
            <span className="char-count">{name.length}/255</span>
          </div>

          <div className="form-group">
            <label htmlFor="arch-desc">Description</label>
            <textarea
              id="arch-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional: Describe your architecture..."
              rows={4}
              maxLength={1000}
              disabled={loading}
            />
            <span className="char-count">{description.length}/1000</span>
          </div>

          <div className="arch-info">
            <div className="info-item">
              <span className="info-label">Region:</span>
              <span className="info-value">{region}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Pricing Model:</span>
              <span className="info-value">{pricingModel}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Services:</span>
              <span className="info-value">{nodes.length}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Connections:</span>
              <span className="info-value">{edges.length}</span>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-footer">
            <button 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={loading || !name.trim()}
            >
              {loading ? 'Saving...' : '💾 Save Architecture'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveArchitectureModal;
