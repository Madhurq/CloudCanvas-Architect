// // import { useState } from 'react';
// // import { generateLocalDesign } from '../services/localDesignService'; // Import new service
// // import useStore from '../store/useStore';
// // import { awsServices } from '../data/awsServices';

// // const AIGeneratorModal = ({ isOpen, onClose }) => {
// //   const [prompt, setPrompt] = useState('');
// //   const [isLoading, setIsLoading] = useState(false);
// //   const [error, setError] = useState('');
// //   const [apiKey, setApiKey] = useState(localStorage.getItem('google_gemini_api_key') || '');
  
// //   const loadTemplate = useStore(state => state.loadTemplate);

// //   const handleGenerate = async () => {
// //     if (!prompt) return;
// //     if (apiKey) localStorage.setItem('google_gemini_api_key', apiKey);
    
// //     setIsLoading(true);
// //     setError('');

// //     try {
// //       let result;
      
// //       // Strategy 1: Try AI if key exists
// //       if (apiKey) {
// //           try {
// //             result = await generateArchitecture(prompt, apiKey);
// //           } catch (aiError) {
// //             console.warn("AI Failed, falling back to local:", aiError);
// //             // If AI fails (404, 401, etc), fall back to local automatically
// //             result = generateLocalDesign(prompt);
// //           }
// //       } else {
// //           // Strategy 2: Use Local Generator immediately if no key
// //           result = generateLocalDesign(prompt);
// //       }

// //       // Validate Services
// //       const validNodes = result.nodes.map(node => {
// //         const serviceDef = awsServices[node.data.serviceType];
// //         if (!serviceDef) return null;
// //         return {
// //           ...node,
// //           data: {
// //             ...node.data,
// //             icon: serviceDef.icon,
// //             color: serviceDef.color,
// //             config: { ...serviceDef.defaultConfig, ...node.data.config }
// //           }
// //         };
// //       }).filter(Boolean);

// //       loadTemplate(validNodes, result.edges);
// //       onClose();

// //     } catch (err) {
// //       setError(err.message || 'Could not generate design.');
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   };

// //   if (!isOpen) return null;

// //   return (
// //     <div className="modal-overlay" onClick={onClose}>
// //       <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
// //         <div className="modal-header">
// //           <h2>✨ Architecture Generator</h2>
// //           <button className="modal-close" onClick={onClose}>✕</button>
// //         </div>
        
// //         <div className="modal-body">
// //           <div className="control-group" style={{ marginBottom: '15px' }}>
// //             <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Describe your system</label>
// //             <textarea
// //               className="select-input"
// //               style={{ width: '100%', minHeight: '100px', padding: '10px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
// //               placeholder="e.g. 'I need a server and a database' (Keywords work best without API Key)"
// //               value={prompt}
// //               onChange={(e) => setPrompt(e.target.value)}
// //             />
// //           </div>

// //           <div className="control-group" style={{ marginBottom: '15px' }}>
// //              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
// //                Google Gemini API Key <span style={{opacity: 0.6}}>(Optional)</span>
// //              </label>
// //             <input 
// //               type="password" 
// //               placeholder="Leave empty to use Offline Mode"
// //               className="select-input"
// //               style={{ width: '100%', padding: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
// //               value={apiKey}
// //               onChange={(e) => setApiKey(e.target.value)}
// //             />
// //             <small style={{ color: 'var(--text-secondary)', fontSize: '0.8em', display: 'block', marginTop: '4px' }}>
// //               If you leave this empty, the app will use basic keyword matching to build your design.
// //             </small>
// //           </div>

// //           {error && <p style={{ color: '#ef4444', marginBottom: '15px', fontSize: '0.9em' }}>{error}</p>}

// //           <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
// //             <button onClick={onClose} className="btn btn-ghost">Cancel</button>
// //             <button onClick={handleGenerate} disabled={isLoading} className="btn btn-primary">
// //               {isLoading ? 'Generating...' : apiKey ? 'Generate with AI' : 'Generate (Offline)'}
// //             </button>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default AIGeneratorModal;



// import { useState } from 'react';
// import { generateLocalDesign } from '../services/localDesignService';
// import { generateArchitecture } from '../services/aiDesignService'; // Updated Import
// import useStore from '../store/useStore';
// import { awsServices } from '../data/awsServices';

// const AIGeneratorModal = ({ isOpen, onClose }) => {
//   const [prompt, setPrompt] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [apiKey, setApiKey] = useState(localStorage.getItem('google_gemini_api_key') || '');
  
//   const loadTemplate = useStore(state => state.loadTemplate);

//   const handleGenerate = async () => {
//     if (!prompt) return;
//     if (apiKey) localStorage.setItem('google_gemini_api_key', apiKey);
    
//     setIsLoading(true);
//     setError('');

//     try {
//       let result;
      
//       // Strategy 1: Try AI if key exists
//       if (apiKey) {
//           try {
//             console.log("Attempting AI generation...");
//             result = await generateArchitecture(prompt, apiKey);
//           } catch (aiError) {
//             console.warn("AI Failed, falling back to local:", aiError);
//             setError(`AI Error: ${aiError.message}. Switching to Offline Mode...`);
//             // Brief pause so user sees the error before fallback
//             await new Promise(resolve => setTimeout(resolve, 1500));
//             result = generateLocalDesign(prompt);
//           }
//       } else {
//           // Strategy 2: Use Local Generator immediately if no key
//           result = generateLocalDesign(prompt);
//       }

//       // Validate Services
//       const validNodes = result.nodes.map(node => {
//         const serviceDef = awsServices[node.data.serviceType];
//         if (!serviceDef) return null;
//         return {
//           ...node,
//           data: {
//             ...node.data,
//             icon: serviceDef.icon,
//             color: serviceDef.color,
//             config: { ...serviceDef.defaultConfig, ...node.data.config }
//           }
//         };
//       }).filter(Boolean);

//       if (validNodes.length === 0) {
//         throw new Error("Could not identify any valid AWS services from the prompt.");
//       }

//       loadTemplate(validNodes, result.edges);
//       onClose();

//     } catch (err) {
//       setError(err.message || 'Could not generate design.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="modal-overlay" onClick={onClose}>
//       <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
//         <div className="modal-header">
//           <h2>✨ Architecture Generator</h2>
//           <button className="modal-close" onClick={onClose}>✕</button>
//         </div>
        
//         <div className="modal-body">
//           <div className="control-group" style={{ marginBottom: '15px' }}>
//             <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Describe your system</label>
//             <textarea
//               className="select-input"
//               style={{ width: '100%', minHeight: '100px', padding: '10px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
//               placeholder="e.g. 'I need a server and a database' or '3 Tier App'"
//               value={prompt}
//               onChange={(e) => setPrompt(e.target.value)}
//             />
//           </div>

//           <div className="control-group" style={{ marginBottom: '15px' }}>
//              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
//                Google Gemini API Key <span style={{opacity: 0.6}}>(Optional)</span>
//              </label>
//             <input 
//               type="password" 
//               placeholder="Leave empty to use Offline Mode"
//               className="select-input"
//               style={{ width: '100%', padding: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
//               value={apiKey}
//               onChange={(e) => setApiKey(e.target.value)}
//             />
//             <small style={{ color: 'var(--text-secondary)', fontSize: '0.8em', display: 'block', marginTop: '4px' }}>
//               If you leave this empty, the app will use standard templates and keyword matching.
//             </small>
//           </div>

//           {error && <p style={{ color: '#ef4444', marginBottom: '15px', fontSize: '0.9em' }}>{error}</p>}

//           <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
//             <button onClick={onClose} className="btn btn-ghost">Cancel</button>
//             <button onClick={handleGenerate} disabled={isLoading} className="btn btn-primary">
//               {isLoading ? 'Generating...' : apiKey ? 'Generate with AI' : 'Generate (Offline)'}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AIGeneratorModal;



import { useState } from 'react';
import { generateLocalDesign } from '../services/localDesignService';
import useStore from '../store/useStore';
import { awsServices } from '../data/awsServices';

const AIGeneratorModal = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // We removed the API Key state since we are focusing on the "Logic Engine"
  const loadTemplate = useStore(state => state.loadTemplate);

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setIsLoading(true);
    setError('');

    // Simulate a "thinking" delay for better UX
    setTimeout(() => {
      try {
        console.log("Running Logic Engine on:", prompt);
        
        // 1. Run the Deterministic Logic Engine
        const result = generateLocalDesign(prompt);

        // 2. Hydrate Nodes with Full Defaults (Safety Step)
        const validNodes = result.nodes.map(node => {
          const serviceDef = awsServices[node.data.serviceType];
          if (!serviceDef) return null;
          return {
            ...node,
            data: {
              ...node.data,
              // Ensure critical UI properties exist
              icon: serviceDef.icon,
              color: serviceDef.color,
              config: { ...serviceDef.defaultConfig, ...node.data.config }
            }
          };
        }).filter(Boolean);

        if (validNodes.length === 0) {
          throw new Error("System Generation Failed: No valid components could be created.");
        }

        loadTemplate(validNodes, result.edges);
        onClose();

      } catch (err) {
        // Display the specific Logical Error message to the user
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }, 600); 
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>🏗️ Auto-Architect (Logic Engine)</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="control-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Describe your architecture
            </label>
            <textarea
              className="select-input"
              style={{ 
                width: '100%', 
                minHeight: '120px', 
                padding: '12px', 
                background: 'var(--bg-secondary)', 
                color: 'var(--text-primary)', 
                border: '1px solid var(--border-color)',
                fontSize: '15px'
              }}
              placeholder="Examples:&#10;- '3 Tier Web App'&#10;- 'A server connected to a postgres database'&#10;- 'S3 bucket with CloudFront CDN'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="info-box" style={{ 
            padding: '12px', 
            background: 'rgba(66, 153, 225, 0.1)', 
            borderLeft: '4px solid #4299e1', 
            marginBottom: '20px',
            fontSize: '0.9em'
          }}>
            <strong>How it works:</strong> The system analyzes your description, checks for logical feasibility (e.g., ensuring databases have servers), and auto-wires connections based on AWS best practices.
          </div>

          {error && (
            <div style={{ 
              padding: '12px', 
              background: 'rgba(239, 68, 68, 0.1)', 
              borderLeft: '4px solid #ef4444', 
              color: '#ef4444', 
              marginBottom: '15px', 
              fontSize: '0.9em' 
            }}>
              <strong>⚠️ Design Error:</strong> {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button onClick={handleGenerate} disabled={isLoading} className="btn btn-primary">
              {isLoading ? 'Processing Logic...' : 'Generate System'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGeneratorModal;