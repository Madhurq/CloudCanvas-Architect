import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import apiClient from '../services/apiClient';
import '../styles/SaveArchitecture.css';

const SavedArchitecturesModal = ({ isOpen, onClose }) => {
  const [architectures, setArchitectures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedArchId, setSelectedArchId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { setNodes, setEdges, setRegion, pricingModel, setPricingModel } = useStore();

  useEffect(() => {
    if (isOpen) {
      fetchArchitectures();
    }
  }, [isOpen]);

  const fetchArchitectures = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.getArchitectures();
      if (response?.data?.architectures) {
        setArchitectures(response.data.architectures);
      } else if (response?.architectures) {
        setArchitectures(response.architectures);
      } else {
        setError('Failed to fetch architectures');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch architectures');
      console.error('Fetch architectures error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async (architecture) => {
    try {
      setLoading(true);
      setError('');
      
      // Load architecture data
      setNodes(architecture.nodes || []);
      setEdges(architecture.edges || []);
      setRegion(architecture.region);
      setPricingModel(architecture.pricing_model);
      
      alert('✅ Architecture loaded successfully!');
      onClose();
    } catch (err) {
      setError('Failed to load architecture');
      console.error('Load architecture error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (archId, archName) => {
    if (!window.confirm(`Are you sure you want to delete "${archName}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setError('');
    try {
      await apiClient.deleteArchitecture(archId);
      setArchitectures(architectures.filter(a => a.id !== archId));
      alert('✅ Architecture deleted successfully!');
    } catch (err) {
      setError(err.message || 'Failed to delete architecture');
      console.error('Delete architecture error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content saved-arch-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📂 Saved Architectures</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {loading && !architectures.length ? (
          <div className="loading-state">Loading architectures...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : architectures.length === 0 ? (
          <div className="empty-state">
            <p>📭 No saved architectures yet</p>
            <p>Save your current architecture to access it later</p>
          </div>
        ) : (
          <div className="arch-list">
            {architectures.map((arch) => (
              <div key={arch.id} className="arch-item">
                <div className="arch-item-header">
                  <h4>{arch.name}</h4>
                  <span className="arch-date">{formatDate(arch.updated_at)}</span>
                </div>
                
                {arch.description && (
                  <p className="arch-description">{arch.description}</p>
                )}

                <div className="arch-meta">
                  <span>🌍 {arch.region}</span>
                  <span>💰 {arch.pricing_model}</span>
                  <span>🔗 {arch.edges?.length || 0} connections</span>
                  <span>⚙️ {arch.nodes?.length || 0} services</span>
                </div>

                <div className="arch-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleLoad(arch)}
                    disabled={loading || deleting}
                  >
                    📥 Load
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(arch.id, arch.name)}
                    disabled={deleting}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={loading || deleting}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavedArchitecturesModal;
