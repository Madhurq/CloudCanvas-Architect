import { useState } from 'react';
import useStore from '../store/useStore';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import '../styles/Marketplace.css';

const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

const PublishToMarketplace = ({ isOpen, onClose }) => {
  const { nodes, edges, accessToken, region, getTotalMonthlyCost, initializeSession, saveArchitecture, selectedArchitecture } = useStore();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'web-app',
    price: 0,
    tags: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let token = accessToken || apiClient.accessToken;

    // If no token, try initializing from stored tokens
    if (!token) {
      await initializeSession?.();
      token = apiClient.accessToken || accessToken;
    }

    // If still no token, and user is logged in via Firebase, sync to backend
    if (!token && user) {
      try {
        const idToken = await user.getIdToken();
        const syncResult = await apiClient.syncFirebaseUser(idToken);
        token = syncResult?.data?.accessToken || apiClient.accessToken || null;
      } catch (err) {
        console.warn('Firebase sync failed:', err?.message || err);
      }
    }

    const effectiveToken = token || apiClient.accessToken || accessToken;

    if (!effectiveToken) {
      alert('Please login to publish architectures');
      return;
    }

    if (nodes.length === 0) {
      alert('Please create an architecture before publishing');
      return;
    }

    try {
      setLoading(true);

      // Ensure architecture is saved (create or update) to obtain architectureId
      const saved = await saveArchitecture({
        name: formData.title || 'Untitled Architecture',
        description: formData.description || '',
      });

      const architectureId = saved?.id || selectedArchitecture?.id;
      if (!architectureId) {
        alert('Could not resolve architecture ID to publish.');
        return;
      }

      const payload = {
        architectureId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      };

      const response = await fetch(`${API_BASE}/api/marketplace/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert('Architecture published successfully!');
        setFormData({ title: '', description: '', category: 'web-app', price: 0, tags: '' });
        onClose();
      } else {
        alert(data.error || 'Publishing failed');
      }
    } catch (error) {
      console.error('Publishing failed:', error);
      alert('Publishing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content publish-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📤 Publish to Marketplace</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body publish-body">
          <form onSubmit={handleSubmit} className="publish-form">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Zoom Video Conferencing Architecture"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your architecture, its features, and use cases..."
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="web-app">Web Application</option>
                <option value="serverless">Serverless</option>
                <option value="microservices">Microservices</option>
                <option value="data-analytics">Data & Analytics</option>
                <option value="ai-ml">AI/ML</option>
                <option value="gaming">Gaming</option>
                <option value="iot">IoT</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="price">Price (USD) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00 for free"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags (comma separated)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g., scalable, high-availability, cost-optimized"
              />
            </div>

            <div className="architecture-summary">
              <h4>Architecture Summary:</h4>
              <p>Services: {nodes.length}</p>
              <p>Connections: {edges.length}</p>
              <p>Region: {region}</p>
              <p>Est. Monthly Cost: ${getTotalMonthlyCost()?.toFixed(2) || '0.00'}</p>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Publishing...' : 'Publish to Marketplace'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublishToMarketplace;
