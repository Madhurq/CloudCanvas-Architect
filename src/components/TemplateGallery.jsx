import { useState } from 'react';
import useStore from '../store/useStore';
import { architectureTemplates } from '../data/architectureTemplates';
import '../styles/TemplateGallery.css';

const TemplateGallery = ({ isOpen, onClose }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const loadTemplate = useStore((state) => state.loadTemplate);

  const handleLoadTemplate = (template) => {
    loadTemplate(template.nodes, template.edges);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="template-gallery-overlay" onClick={onClose}>
      <div className="template-gallery-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-gallery-header">
          <h2>Architecture Templates</h2>
          <button className="template-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="template-gallery-grid">
          {architectureTemplates.map((template) => (
            <div
              key={template.id}
              className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="template-icon">{template.thumbnail}</div>
              <div className="template-name">{template.name}</div>
              <div className="template-category">{template.category}</div>
              <div className="template-difficulty">{template.difficulty}</div>
            </div>
          ))}
        </div>

        {selectedTemplate && (
          <div className="template-details">
            <div className="template-details-content">
              <h3>{selectedTemplate.name}</h3>
              <p className="template-description">{selectedTemplate.description}</p>

              <div className="template-stats">
                <div className="stat">
                  <span className="stat-label">Services:</span>
                  <span className="stat-value">{selectedTemplate.nodes.length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Connections:</span>
                  <span className="stat-value">{selectedTemplate.edges.length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Difficulty:</span>
                  <span className="stat-value">{selectedTemplate.difficulty}</span>
                </div>
              </div>

              <div className="template-services">
                <h4>Services Included:</h4>
                <div className="services-list">
                  {selectedTemplate.nodes.map((node) => (
                    <span key={node.id} className="service-badge" style={{ backgroundColor: node.data.color }}>
                      {node.data.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="template-actions">
                <button
                  className="template-load-btn"
                  onClick={() => handleLoadTemplate(selectedTemplate)}
                >
                  Load Template
                </button>
                <button
                  className="template-cancel-btn"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateGallery;
