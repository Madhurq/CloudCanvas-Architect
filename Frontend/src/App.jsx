import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ServicePalette from './components/ServicePalette';
import DesignCanvas from './components/DesignCanvas';
import CostPanel from './components/CostPanel';
import ConfigModal from './components/ConfigModal';
import TemplateGallery from './components/TemplateGallery';
import DeploymentPanel from './components/DeploymentPanel';
import useStore from './store/useStore';
import { initializePricing, getPricingMeta } from './services/awsPricingService';
import { downloadArchitecture, loadArchitectureFromFile, decodeArchitectureFromUrl, getShareableUrl } from './utils/exportHelper';
import './App.css';
import AIGeneratorModal from './components/AIGeneratorModal';
import MarketplaceModal from './components/MarketplaceModal';
import PublishToMarketplace from './components/PublishToMarketplace';
import SaveArchitectureModal from './components/SaveArchitectureModal';
import SavedArchitecturesModal from './components/SavedArchitecturesModal';

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
    selectedArchitecture,
  } = useStore();
  const { user, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const [pricingStatus, setPricingStatus] = useState({ loading: true, source: null });
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareUrlCopied, setShareUrlCopied] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const fileInputRef = useRef(null);

  // Bootstrap session when tokens are present
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  const handleLogout = async () => {
    try {
      // Firebase logout
      await authLogout();
    } catch (error) {
      console.error('Firebase logout failed:', error);
    }

    try {
      // Store logout
      await storeLogout();
    } catch (err) {
      console.warn('Store logout failed:', err);
    }

    // Always navigate to landing page after logout
    navigate('/');
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

  const handleExport = useCallback(() => {
    const architecture = exportArchitecture();
    downloadArchitecture(architecture);
  }, [exportArchitecture]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(async (event) => {
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
  }, [importArchitecture]);

  const handleShare = useCallback(() => {
    try {
      const architecture = exportArchitecture();
      const url = getShareableUrl(architecture);
      setShareUrl(url);
      setShowShareModal(true);
      setShareUrlCopied(false);
    } catch (error) {
      alert('Failed to generate share URL: ' + error.message);
    }
  }, [exportArchitecture]);

  const handleCopyShareUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareUrlCopied(true);
      setTimeout(() => setShareUrlCopied(false), 2000);
    } catch (error) {
      alert('Failed to copy URL: ' + error.message);
    }
  }, [shareUrl]);

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
  }, [deleteSelected, undo, redo, clearCanvas, showTemplates, handleExport]);

  return (
    <div className="app">
      <header className="app-header">
        {/* User Profile - Always visible, positioned first for priority */}
        <div className="header-user">
          {user && (
            <div className="user-menu">
              <div className="user-avatar">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <span className="user-email" title={user.email}>
                {user.email?.split('@')[0]}
              </span>
              <button className="btn btn-logout" onClick={handleLogout} title="Sign Out">
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Logo/Brand */}
        <div className="header-brand">
          <span className="brand-icon">☁️</span>
          <span className="brand-text">CloudCanvas</span>
        </div>

        {/* Region & Pricing Controls */}
        <div className="header-controls">
          <div className="control-group">
            <label htmlFor="region-select">Region</label>
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
            <label htmlFor="pricing-model-select">Pricing</label>
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

        {/* Primary Actions */}
        <div className="header-actions-primary">
          <button className="btn btn-primary btn-deploy" onClick={() => setShowDeployModal(true)} title="Deploy to AWS">
            <span className="btn-icon">🚀</span>
            <span className="btn-text">Deploy</span>
          </button>
          <button className="btn btn-primary btn-ai" onClick={() => setShowAIModal(true)} title="Generate with AI">
            <span className="btn-icon">✨</span>
            <span className="btn-text">AI Design</span>
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="header-actions-secondary">
          <button className="btn btn-ghost" onClick={() => setShowTemplates(true)} title="Templates (Ctrl+K)">
            <span className="btn-icon">📋</span>
            <span className="btn-text">Templates</span>
          </button>
          <button className="btn btn-ghost" onClick={() => setShowMarketplace(true)} title="Marketplace">
            <span className="btn-icon">🛒</span>
            <span className="btn-text">Market</span>
          </button>
          <button className="btn btn-ghost" onClick={() => setShowPublish(true)} title="Publish">
            <span className="btn-icon">📤</span>
            <span className="btn-text">Publish</span>
          </button>
          <button className="btn btn-ghost" onClick={() => setShowSaveModal(true)} title="Save Architecture">
            <span className="btn-icon">💾</span>
            <span className="btn-text">Save</span>
          </button>
          <button className="btn btn-ghost" onClick={() => setShowLoadModal(true)} title="Load Saved Architecture">
            <span className="btn-icon">📂</span>
            <span className="btn-text">Load</span>
          </button>
          <button className="btn btn-ghost" onClick={handleImportClick} title="Import">
            <span className="btn-icon">📥</span>
            <span className="btn-text">Import</span>
          </button>
          <button className="btn btn-ghost" onClick={handleExport} title="Export (Ctrl+E)">
            <span className="btn-icon">📤</span>
            <span className="btn-text">Export</span>
          </button>
          <button className="btn btn-ghost" onClick={handleShare} title="Share">
            <span className="btn-icon">🔗</span>
            <span className="btn-text">Share</span>
          </button>
          <button className="btn btn-ghost" onClick={clearCanvas} title="Clear (Ctrl+Shift+C)">
            <span className="btn-icon">🗑️</span>
            <span className="btn-text">Clear</span>
          </button>
          <button className="btn btn-ghost btn-theme" onClick={toggleTheme} title="Toggle Theme">
            <span className="btn-icon">{theme === 'dark' ? '🌞' : '🌙'}</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          style={{ display: 'none' }}
        />
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
      <AIGeneratorModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} />
      <DeploymentPanel
        isOpen={showDeployModal}
        onClose={() => setShowDeployModal(false)}
      />
      <MarketplaceModal isOpen={showMarketplace} onClose={() => setShowMarketplace(false)} />
      <PublishToMarketplace isOpen={showPublish} onClose={() => setShowPublish(false)} />
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

      <SaveArchitectureModal 
        isOpen={showSaveModal} 
        onClose={() => setShowSaveModal(false)} 
      />

      <SavedArchitecturesModal 
        isOpen={showLoadModal} 
        onClose={() => setShowLoadModal(false)} 
      />

      <footer className="app-footer">
        <p className="keyboard-shortcuts">
          <kbd>Delete</kbd> remove • <kbd>Ctrl+Z</kbd>/<kbd>Ctrl+Y</kbd> undo/redo •
          <kbd>Ctrl+E</kbd> export • <kbd>Ctrl+K</kbd> templates • <kbd>Ctrl+Shift+C</kbd> clear
        </p>
      </footer>
    </div>
  );
}

export default App;
