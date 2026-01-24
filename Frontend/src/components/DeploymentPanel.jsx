import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import apiClient from '../services/apiClient';
import '../styles/DeploymentPanel.css';

export default function DeploymentPanel({ isOpen, onClose }) {
  const { selectedArchitecture, saveArchitecture, nodes, edges, region: storeRegion } = useStore();
  const [credentials, setCredentials] = useState({
    awsAccessKeyId: '',
    awsSecretAccessKey: '',
    awsRegion: storeRegion || 'us-east-1',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deployment, setDeployment] = useState(null);
  const [deploymentHistory, setDeploymentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('deploy'); // 'deploy' or 'history'
  const [pollingInterval, setPollingInterval] = useState(null);

  // Load deployment history when modal opens
  useEffect(() => {
    if (isOpen && selectedArchitecture?.id) {
      loadDeploymentHistory();
    }
  }, [isOpen, selectedArchitecture]);

  // Sync region with store
  useEffect(() => {
    if (storeRegion) {
      setCredentials(prev => ({ ...prev, awsRegion: storeRegion }));
    }
  }, [storeRegion]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const loadDeploymentHistory = async () => {
    if (!selectedArchitecture?.id) return;
    
    setLoadingHistory(true);
    try {
      const response = await apiClient.request(`/api/deployments/architecture/${selectedArchitecture.id}`);
      setDeploymentHistory(response?.data?.deployments || []);
    } catch (err) {
      console.error('Failed to load deployment history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const ensureArchitectureSaved = async () => {
    // If architecture is not saved yet, save it first
    if (!selectedArchitecture?.id) {
      const architectureName = prompt('Please enter a name for your architecture:', 'My AWS Architecture');
      if (!architectureName) {
        throw new Error('Architecture name is required');
      }
      
      await saveArchitecture(architectureName);
      return useStore.getState().selectedArchitecture?.id;
    }
    return selectedArchitecture.id;
  };

  const handleDownloadTemplate = async () => {
    try {
      const archId = await ensureArchitectureSaved();
      if (!archId) {
        setError('Failed to save architecture');
        return;
      }

      // Fetch CloudFormation template from backend
      const response = await apiClient.request(`/api/deployments/preview/${archId}`);
      const templateJson = response?.data?.templateJson || JSON.stringify(response?.data?.template, null, 2);
      const architectureName = response?.data?.architectureName || 'architecture';

      // Download the template
      const blob = new Blob([templateJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cloudformation-${architectureName.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess('CloudFormation template downloaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to download template');
    }
  };

  const startStatusPolling = (deploymentId) => {
    // Poll every 10 seconds
    const interval = setInterval(async () => {
      try {
        const response = await apiClient.request(`/api/deployments/${deploymentId}/status`);
        const updatedDeployment = response?.data?.deployment;
        
        if (updatedDeployment) {
          setDeployment(updatedDeployment);
          
          // Stop polling if deployment is complete or failed
          if (updatedDeployment.status === 'complete' || 
              updatedDeployment.status === 'failed' || 
              updatedDeployment.status === 'rolled_back') {
            clearInterval(interval);
            setPollingInterval(null);
            loadDeploymentHistory(); // Refresh history
          }
        }
      } catch (err) {
        console.error('Status polling error:', err);
      }
    }, 10000);

    setPollingInterval(interval);
  };

  const handleDeploy = async () => {
    if (!credentials.awsAccessKeyId || !credentials.awsSecretAccessKey) {
      setError('AWS credentials are required');
      return;
    }

    if (nodes.length === 0) {
      setError('Cannot deploy an empty architecture');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Ensure architecture is saved
      const archId = await ensureArchitectureSaved();
      if (!archId) {
        throw new Error('Failed to save architecture. Please try again.');
      }

      const response = await apiClient.request('/api/deployments', {
        method: 'POST',
        body: JSON.stringify({
          architectureId: archId,
          awsAccessKeyId: credentials.awsAccessKeyId,
          awsSecretAccessKey: credentials.awsSecretAccessKey,
          awsRegion: credentials.awsRegion,
        }),
      });

      const deploymentData = response?.data?.deployment;
      setDeployment(deploymentData);
      setSuccess(`Deployment initiated! Stack ID: ${deploymentData?.cloudformation_stack_id}`);
      
      // Start polling for status
      startStatusPolling(deploymentData.id);
      
      // Clear credentials after successful deployment
      setCredentials({
        awsAccessKeyId: '',
        awsSecretAccessKey: '',
        awsRegion: credentials.awsRegion,
      });

      // Switch to history tab to show deployment
      setActiveTab('history');
      loadDeploymentHistory();
    } catch (err) {
      setError(err.message || 'Failed to deploy architecture');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDeployment = async (deploymentId) => {
    if (!confirm('Are you sure you want to delete this deployment record? This will not delete the AWS stack.')) {
      return;
    }

    try {
      await apiClient.request(`/api/deployments/${deploymentId}`, {
        method: 'DELETE',
      });
      loadDeploymentHistory();
    } catch (err) {
      setError(err.message || 'Failed to delete deployment');
    }
  };

  if (!isOpen) return null;

  const AWS_REGIONS = [
    { id: 'us-east-1', name: 'US East (N. Virginia)' },
    { id: 'us-west-2', name: 'US West (Oregon)' },
    { id: 'us-east-2', name: 'US East (Ohio)' },
    { id: 'us-west-1', name: 'US West (N. California)' },
    { id: 'eu-west-1', name: 'EU (Ireland)' },
    { id: 'eu-central-1', name: 'EU (Frankfurt)' },
    { id: 'eu-west-2', name: 'EU (London)' },
    { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
    { id: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)' },
    { id: 'ap-south-1', name: 'Asia Pacific (Mumbai)' },
  ];

  const getStatusBadge = (status) => {
    const statusMap = {
      creating: { emoji: '⏳', class: 'status-creating', label: 'Creating' },
      complete: { emoji: '✅', class: 'status-complete', label: 'Complete' },
      failed: { emoji: '❌', class: 'status-failed', label: 'Failed' },
      rolled_back: { emoji: '↩️', class: 'status-rollback', label: 'Rolled Back' },
      pending: { emoji: '⏸️', class: 'status-pending', label: 'Pending' },
    };
    const info = statusMap[status] || { emoji: '❓', class: 'status-unknown', label: status };
    return (
      <span className={`status-badge ${info.class}`}>
        {info.emoji} {info.label}
      </span>
    );
  };

  return (
    <div className="deployment-modal-overlay" onClick={onClose}>
      <div className="deployment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="deployment-modal-header">
          <h2>🚀 AWS Deployment</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="deployment-tabs">
          <button
            className={`tab-btn ${activeTab === 'deploy' ? 'active' : ''}`}
            onClick={() => setActiveTab('deploy')}
          >
            Deploy New
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Deployment History
          </button>
        </div>

        <div className="deployment-modal-body">
          {/* Deploy Tab */}
          {activeTab === 'deploy' && (
            <>
              <div className="deployment-warning">
                <p>⚠️ <strong>Security Note:</strong> Only use temporary AWS credentials or a dedicated IAM user with minimal permissions. Never commit credentials to version control.</p>
              </div>

              {!selectedArchitecture?.id && (
                <div className="alert alert-info">
                  ℹ️ Your architecture will be automatically saved before deployment.
                </div>
              )}

              <div className="form-group">
                <label htmlFor="awsAccessKeyId">AWS Access Key ID</label>
                <input
                  type="password"
                  id="awsAccessKeyId"
                  name="awsAccessKeyId"
                  value={credentials.awsAccessKeyId}
                  onChange={handleInputChange}
                  placeholder="AKIA..."
                  className="form-input"
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label htmlFor="awsSecretAccessKey">AWS Secret Access Key</label>
                <input
                  type="password"
                  id="awsSecretAccessKey"
                  name="awsSecretAccessKey"
                  value={credentials.awsSecretAccessKey}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="form-input"
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label htmlFor="awsRegion">AWS Region</label>
                <select
                  id="awsRegion"
                  name="awsRegion"
                  value={credentials.awsRegion}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  {AWS_REGIONS.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>

              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              {deployment && (
                <div className="deployment-status">
                  <h3>Current Deployment</h3>
                  <p><strong>Stack ID:</strong> <code>{deployment.cloudformation_stack_id}</code></p>
                  <p><strong>Status:</strong> {getStatusBadge(deployment.status)}</p>
                  <p><strong>Region:</strong> {deployment.aws_region}</p>
                  <p><strong>Created:</strong> {new Date(deployment.created_at).toLocaleString()}</p>
                  {deployment.error_message && (
                    <p className="error-text"><strong>Error:</strong> {deployment.error_message}</p>
                  )}
                </div>
              )}

              <div className="deployment-info">
                <p>📊 <strong>Services to deploy:</strong> {nodes.length} AWS services</p>
                <p>🔗 <strong>Connections:</strong> {edges.length} relationships</p>
              </div>
            </>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="deployment-history">
              {loadingHistory ? (
                <div className="loading-state">Loading deployment history...</div>
              ) : deploymentHistory.length === 0 ? (
                <div className="empty-state">
                  <p>📭 No deployments yet</p>
                  <p className="empty-state-subtitle">Deploy your architecture to see history here</p>
                </div>
              ) : (
                <div className="history-list">
                  {deploymentHistory.map((dep) => (
                    <div key={dep.id} className="history-item">
                      <div className="history-header">
                        <div>
                          {getStatusBadge(dep.status)}
                          <span className="history-region">{dep.aws_region}</span>
                        </div>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDeleteDeployment(dep.id)}
                          title="Delete deployment record"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="history-details">
                        <p className="history-stack-id">
                          <strong>Stack:</strong> <code>{dep.cloudformation_stack_id}</code>
                        </p>
                        <p className="history-date">
                          <strong>Created:</strong> {new Date(dep.created_at).toLocaleString()}
                        </p>
                        {dep.completed_at && (
                          <p className="history-date">
                            <strong>Completed:</strong> {new Date(dep.completed_at).toLocaleString()}
                          </p>
                        )}
                        {dep.error_message && (
                          <p className="history-error">
                            <strong>Error:</strong> {dep.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="deployment-modal-footer">
          {activeTab === 'deploy' ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={handleDownloadTemplate}
                disabled={loading || nodes.length === 0}
                title="Download CloudFormation template"
              >
                📥 Download Template
              </button>
              <button
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDeploy}
                disabled={loading || !credentials.awsAccessKeyId || nodes.length === 0}
              >
                {loading ? '⏳ Deploying...' : '🚀 Deploy Now'}
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => loadDeploymentHistory()}
                disabled={loadingHistory}
              >
                🔄 Refresh
              </button>
              <button
                className="btn btn-secondary"
                onClick={onClose}
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
