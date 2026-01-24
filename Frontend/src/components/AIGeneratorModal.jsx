import { useState } from 'react';
import { generateArchitecture } from '../services/aiDesignService'; // Import the AI Service
import useStore from '../store/useStore';

const AIGeneratorModal = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState("AIzaSyCuJ2zLB6Iw3tTi0dmAb_oTcWliSfpLkh0");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const loadTemplate = useStore(state => state.loadTemplate);

  const handleGenerate = async () => {
    if (!prompt) {
      setError("Please describe your system.");
      return;
    }
    if (!apiKey) {
      setError("Google Gemini API Key is required for this mode.");
      return;
    }

    // Save key for convenience
    localStorage.setItem('gemini_api_key', apiKey);
    
    setIsLoading(true);
    setError('');

    try {
      // Call the AI Service
      const { nodes, edges } = await generateArchitecture(prompt, apiKey);

      if (nodes.length === 0) {
        throw new Error("AI returned no valid services. Please try a different description.");
      }

      // Load into Canvas
      loadTemplate(nodes, edges);
      onClose();

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>✨ AI Architecture Generator</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="control-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Describe your System
            </label>
            <textarea
              className="select-input"
              style={{ 
                width: '100%', 
                minHeight: '100px', 
                padding: '10px', 
                background: 'var(--bg-secondary)', 
                color: 'var(--text-primary)', 
                border: '1px solid var(--border-color)' 
              }}
              placeholder="e.g. 'I need a highly available web app with an Application Load Balancer, two EC2 instances, and an RDS database.'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="control-group" style={{ marginBottom: '15px' }}>
             <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
               Google Gemini API Key
             </label>
            <input 
              type="password" 
              placeholder="Paste your Gemini API Key here"
              className="select-input"
              style={{ 
                width: '100%', 
                padding: '8px', 
                background: 'var(--bg-secondary)', 
                color: 'var(--text-primary)', 
                border: '1px solid var(--border-color)' 
              }}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.8em', display: 'block', marginTop: '4px' }}>
              Your key is stored locally in your browser and sent directly to Google.
            </small>
          </div>

          {error && (
            <div style={{ 
              padding: '10px', 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#ef4444', 
              borderRadius: '4px',
              marginBottom: '15px', 
              fontSize: '0.9em' 
            }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button onClick={handleGenerate} disabled={isLoading} className="btn btn-primary">
              {isLoading ? 'Generating...' : 'Generate Design'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGeneratorModal;