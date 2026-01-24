import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ServicePalette from './components/ServicePalette';
import DesignCanvas from './components/DesignCanvas';
import CostPanel from './components/CostPanel';
import ConfigModal from './components/ConfigModal';
import TemplateGallery from './components/TemplateGallery';
import useStore from './store/useStore';
import { initializePricing, getPricingMeta } from './services/awsPricingService';
import { downloadArchitecture, loadArchitectureFromFile, decodeArchitectureFromUrl, getShareableUrl } from './utils/exportHelper';
import './App.css';

const AWS_REGIONS = [
  { id: 'us-east-1', name: 'US East (N. Virginia)' },
  { id: 'us-west-2', name: 'US West (Oregon)' },
  { id: 'eu-west-1', name: 'EU (Ireland)' },
  { id: 'eu-central-1', name: 'EU (Frankfurt)' },
  { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
  { id: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)' },
];

const PRICING_MODELS = [
  { id: 'on-demand', name: 'On-Demand', discount: 0 },
  { id: 'reserved-1yr', name: 'Reserved (1 Year)', discount: 30 },
  { id: 'reserved-3yr', name: 'Reserved (3 Year)', discount: 50 },
  { id: 'spot', name: 'Spot Instances', discount: 70 },
];

function App() {
  const {
    showConfigModal,
    clearCanvas,
    region,
    setRegion,
    pricingModel,
    setPricingModel,
    exportArchitecture,
    importArchitecture,
    deleteSelected,
    undo,
    redo,
    toggleTheme,
    theme,
    initializeSession,
    logout: storeLogout,
  } = useStore();
  const { user, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const [pricingStatus, setPricingStatus] = useState({ loading: true, source: null });
  const [showTemplates, setShowTemplates] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareUrlCopied, setShareUrlCopied] = useState(false);
  const fileInputRef = useRef(null);

  // Bootstrap session when tokens are present
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      try {
        await storeLogout();
      } catch (err) {
        console.warn('Store logout failed:', err);
      }
      navigate('/login');
    }
  };

  // Initialize AWS pricing on app startup
  useEffect(() => {
    const loadPricing = async () => {
      try {
        await initializePricing(region);
        const meta = getPricingMeta();
        setPricingStatus({ loading: false, source: meta.source });
      } catch (error) {
        console.error('Failed to initialize pricing:', error);
        setPricingStatus({ loading: false, source: 'fallback' });
      }
    };
    loadPricing();
  }, [region]);

  // Load architecture from URL on app startup
  useEffect(() => {
    const loadFromUrl = () => {
      const architecture = decodeArchitectureFromUrl();
      if (architecture) {
        // Load the architecture
        importArchitecture(architecture);
        console.log('Loaded architecture from shared URL');
      }
    };
    loadFromUrl();
  }, [importArchitecture]);

  // Set initial theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ignore if typing in input/textarea
      if (event.target.matches('input, textarea')) return;

      // Delete - Remove selected node/edge
      if (event.key === 'Delete') {
        event.preventDefault();
        deleteSelected();
      }

      // Ctrl+Z - Undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        undo();
      }

      // Ctrl+Y - Redo
      if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
        event.preventDefault();
        redo();
      }

      // Ctrl+Shift+C - Clear canvas
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        if (confirm('Are you sure you want to clear the canvas?')) {
          clearCanvas();
        }
      }

      // Ctrl+E - Export architecture
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        handleExport();
      }

      // Ctrl+K - Focus search/templates
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setShowTemplates(!showTemplates);
      }

      // Escape - Close templates
      if (event.key === 'Escape') {
        setShowTemplates(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, undo, redo, clearCanvas, showTemplates]);

  const handleExport = () => {
    const architecture = exportArchitecture();
    downloadArchitecture(architecture);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const architecture = await loadArchitectureFromFile(file);
      importArchitecture(architecture);
      alert('Architecture imported successfully!');
    } catch (error) {
      alert('Import failed: ' + error.message);
    }

    // Reset file input
    event.target.value = '';
  };

  const handleShare = () => {
    try {
      const architecture = exportArchitecture();
      const url = getShareableUrl(architecture);
      setShareUrl(url);
      setShowShareModal(true);
      setShareUrlCopied(false);
    } catch (error) {
      alert('Failed to generate share URL: ' + error.message);
    }
  };

  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareUrlCopied(true);
      setTimeout(() => setShareUrlCopied(false), 2000);
    } catch (error) {
      alert('Failed to copy URL: ' + error.message);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>☁️ AWS Architecture Cost Calculator</h1>
          {pricingStatus.source && (
            <span className={`badge ${pricingStatus.source === 'aws-api' ? 'badge-success' : 'badge-warning'}`}>
              {pricingStatus.source === 'aws-api' ? '✓ Live Prices' : '⚠ Cached Prices'}
            </span>
          )}
        </div>

        <div className="header-center">
          <div className="header-controls">
            <div className="control-group">
              <label htmlFor="region-select">Region:</label>
              <select
                id="region-select"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="select-input"
              >
                {AWS_REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label htmlFor="pricing-model-select">Pricing:</label>
              <select
                id="pricing-model-select"
                value={pricingModel}
                onChange={(e) => setPricingModel(e.target.value)}
                className="select-input"
              >
                {PRICING_MODELS.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name} {pm.discount > 0 ? `(-${pm.discount}%)` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="header-right">
          <button className="btn btn-ghost" onClick={() => setShowTemplates(true)} title="Load Template (Ctrl+K)">
            📋 Templates
          </button>
          <button className="btn btn-ghost" onClick={handleImportClick} title="Import Architecture">
            📂 Import
          </button>
          <button className="btn btn-ghost" onClick={handleExport} title="Export Architecture (Ctrl+E)">
            💾 Export
          </button>
          <button className="btn btn-ghost" onClick={handleShare} title="Generate Shareable URL">
            🔗 Share
          </button>
          <button className="btn btn-ghost" onClick={clearCanvas} title="Clear Canvas (Ctrl+Shift+C)">
            🗑️ Clear
          </button>
          <button className="btn btn-ghost" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? '🌞' : '🌙'}
          </button>
          {user && (
            <div className="user-menu">
              <span className="user-email" title={user.email}>
                {user.email?.split('@')[0]}
              </span>
              <button className="btn btn-ghost btn-logout" onClick={handleLogout} title="Sign Out">
                🚪 Logout
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />
        </div>
      </header>

      <main className="app-main">
        <aside className="sidebar-left">
          <ServicePalette />
        </aside>

        <section className="canvas-section">
          <DesignCanvas />
        </section>

        <aside className="sidebar-right">
          <CostPanel />
        </aside>
      </main>

      {showConfigModal && <ConfigModal />}
      <TemplateGallery isOpen={showTemplates} onClose={() => setShowTemplates(false)} />

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔗 Share Architecture</h2>
              <button className="modal-close" onClick={() => setShowShareModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="share-description">
                Share your architecture design with others using this link:
              </p>
              <div className="share-url-container">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="share-url-input"
                  onClick={(e) => e.target.select()}
                />
                <button
                  className={`btn btn-primary ${shareUrlCopied ? 'copied' : ''}`}
                  onClick={handleCopyShareUrl}
                >
                  {shareUrlCopied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
              <p className="share-note">
                This link contains your complete architecture. Anyone with the link can view and edit your design.
              </p>
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <p>Drag AWS services • Connect them • Get instant cost estimates</p>
        <p className="footer-note">
          {pricingStatus.loading
            ? 'Loading pricing data...'
            : pricingStatus.source === 'aws-api'
              ? `Prices from AWS Price List API (${region} on-demand rates)`
              : `Using cached prices (${region} on-demand rates)`}
        </p>
        <p className="keyboard-shortcuts">
          Shortcuts: <kbd>Delete</kbd> remove • <kbd>Ctrl+Z</kbd>/<kbd>Ctrl+Y</kbd> undo/redo •
          <kbd>Ctrl+E</kbd> export • <kbd>Ctrl+K</kbd> templates • <kbd>Ctrl+Shift+C</kbd> clear
        </p>
      </footer>
    </div>
  );
}

export default App;
