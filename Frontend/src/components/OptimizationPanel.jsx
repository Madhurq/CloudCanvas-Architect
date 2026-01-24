import { useMemo, useState } from 'react';
import {
  analyzeArchitecture,
  getOptimizationStats,
  OptimizationSeverity,
} from '../utils/optimizationEngine';
import useStore from '../store/useStore';
import '../styles/OptimizationPanel.css';

const OptimizationPanel = ({ costData }) => {
  const { nodes, edges } = useStore();
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);

  const { suggestions, stats } = useMemo(() => {
    const sug = analyzeArchitecture(nodes, edges);
    const st = getOptimizationStats(sug);
    return { suggestions: sug, stats: st };
  }, [nodes, edges]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case OptimizationSeverity.CRITICAL:
        return '#ef4444'; // Red
      case OptimizationSeverity.WARNING:
        return '#f59e0b'; // Amber
      case OptimizationSeverity.INFO:
        return '#3b82f6'; // Blue
      default:
        return '#6b7280';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case OptimizationSeverity.CRITICAL:
        return '🚨';
      case OptimizationSeverity.WARNING:
        return '⚠️';
      case OptimizationSeverity.INFO:
        return 'ℹ️';
      default:
        return '•';
    }
  };

  const downloadOptimizationReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSuggestions: stats.total,
        critical: stats.critical,
        warnings: stats.warning,
        info: stats.info,
        potentialMonthlySavings: stats.totalSavings,
        potentialYearlySavings: stats.totalSavings * 12,
      },
      suggestions: suggestions.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        severity: s.severity,
        recommendation: s.recommendation,
        estimatedSavings: s.estimatedSavings,
      })),
    };

    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2))
    );
    element.setAttribute('download', `optimization-report-${Date.now()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (suggestions.length === 0) {
    return (
      <div className="optimization-panel">
        <div className="optimization-empty">
          <p className="empty-title">✅ No Optimization Issues Found!</p>
          <p className="empty-subtitle">
            Your architecture is well-optimized. Keep monitoring for new opportunities.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="optimization-panel">
      {/* Summary Cards */}
      <div className="optimization-summary">
        <div className="summary-card total">
          <div className="card-label">Total Issues</div>
          <div className="card-value">{stats.total}</div>
        </div>
        <div className="summary-card critical">
          <div className="card-label">Critical</div>
          <div className="card-value">{stats.critical}</div>
        </div>
        <div className="summary-card warning">
          <div className="card-label">Warnings</div>
          <div className="card-value">{stats.warning}</div>
        </div>
        <div className="summary-card savings">
          <div className="card-label">Potential Savings</div>
          <div className="card-value">${stats.totalSavings}/mo</div>
        </div>
      </div>

      {/* Savings Breakdown */}
      <div className="savings-callout">
        <div className="savings-icon">💰</div>
        <div className="savings-info">
          <div className="savings-title">Potential Annual Savings</div>
          <div className="savings-amount">${(stats.totalSavings * 12).toLocaleString()}</div>
          <div className="savings-description">By implementing these optimization recommendations</div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="suggestions-list">
        {suggestions.map((suggestion, index) => (
          <div key={suggestion.id} className="suggestion-item">
            <div
              className="suggestion-header"
              onClick={() =>
                setExpandedSuggestion(
                  expandedSuggestion === suggestion.id ? null : suggestion.id
                )
              }
            >
              <div className="suggestion-title-group">
                <span className="severity-icon">{getSeverityIcon(suggestion.severity)}</span>
                <div className="title-section">
                  <h3 className="suggestion-title">{suggestion.title}</h3>
                  <p className="suggestion-description">{suggestion.description}</p>
                </div>
              </div>
              <div className="suggestion-right">
                <div className="savings-badge">
                  ${suggestion.estimatedSavings}/mo
                </div>
                <span className="expand-icon">
                  {expandedSuggestion === suggestion.id ? '▼' : '▶'}
                </span>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedSuggestion === suggestion.id && (
              <div className="suggestion-details">
                <div className="recommendation-section">
                  <h4>💡 Recommendation</h4>
                  <p>{suggestion.recommendation}</p>
                </div>

                {suggestion.impactedResources.length > 0 && (
                  <div className="impacted-section">
                    <h4>📍 Affected Services</h4>
                    <div className="impacted-list">
                      {suggestion.impactedResources.map(resourceId => {
                        const node = nodes.find(n => n.id === resourceId);
                        return node ? (
                          <span key={resourceId} className="impacted-badge">
                            {node.data.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                <div className="savings-detail">
                  <div className="savings-row">
                    <span>Monthly Savings:</span>
                    <strong>${suggestion.estimatedSavings}</strong>
                  </div>
                  <div className="savings-row">
                    <span>Annual Savings:</span>
                    <strong>${(suggestion.estimatedSavings * 12).toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Export Button */}
      <div className="optimization-footer">
        <button className="export-optimization-btn" onClick={downloadOptimizationReport}>
          📥 Download Report
        </button>
      </div>
    </div>
  );
};

export default OptimizationPanel;
