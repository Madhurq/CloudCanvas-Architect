import { useMemo } from 'react';
import useStore from '../store/useStore';
import { calculateTotalCost } from '../utils/costCalculator';
import '../styles/CostAnalytics.css';

const CostAnalytics = () => {
  const { nodes, region, pricingModel } = useStore();

  // Calculate costs
  const costData = useMemo(() => {
    return calculateTotalCost(nodes, region, pricingModel);
  }, [nodes, region, pricingModel]);

  // Aggregate costs by category
  const categoryBreakdown = useMemo(() => {
    const breakdown = {};
    
    costData.services?.forEach((service) => {
      const node = nodes.find(n => n.id === service.id);
      const category = node?.data?.serviceType?.split('-')[0] || 'other';
      
      if (!breakdown[category]) {
        breakdown[category] = 0;
      }
      breakdown[category] += service.total;
    });

    return Object.entries(breakdown)
      .map(([category, cost]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        cost,
        percentage: (cost / costData.totalMonthly) * 100
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [costData.services, nodes]);

  // Top services
  const topServices = useMemo(() => {
    return (costData.services || [])
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [costData.services]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (!nodes.length) {
    return (
      <div className="cost-analytics">
        <div className="empty-state">
          <p>No services added yet</p>
          <p className="empty-hint">Add services to see cost analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cost-analytics">
      {/* Summary Cards */}
      <div className="analytics-grid-2">
        <div className="analytics-card summary-card">
          <div className="card-header">
            <h3>Monthly Cost</h3>
            <span className="model-badge">{pricingModel.replace('-', ' ')}</span>
          </div>
          <div className="card-value">{formatCurrency(costData.totalMonthly)}</div>
          <div className="card-subtext">
            {formatCurrency(costData.totalYearly)}/year
          </div>
        </div>

        {costData.pricingModel !== 'on-demand' && (
          <div className="analytics-card summary-card savings-card">
            <div className="card-header">
              <h3>Savings</h3>
              <span className="save-badge">{costData.savingsPercentage.toFixed(1)}%</span>
            </div>
            <div className="card-value savings-value">{formatCurrency(costData.savings)}</div>
            <div className="card-subtext">
              vs On-Demand: {formatCurrency(costData.onDemandMonthly)}
            </div>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="analytics-card">
        <h3>Cost by Service Type</h3>
        <div className="breakdown-list">
          {categoryBreakdown.map((cat, idx) => (
            <div key={idx} className="breakdown-item">
              <div className="breakdown-label">{cat.category}</div>
              <div className="breakdown-bar-container">
                <div
                  className="breakdown-bar"
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: getColorForIndex(idx)
                  }}
                />
              </div>
              <div className="breakdown-stats">
                <span>{formatCurrency(cat.cost)}</span>
                <span className="percentage">{cat.percentage.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Services */}
      <div className="analytics-card">
        <h3>Top 5 Services by Cost</h3>
        <div className="services-list">
          {topServices.length > 0 ? (
            topServices.map((service, idx) => (
              <div key={idx} className="service-item">
                <div className="service-rank">{idx + 1}</div>
                <div className="service-info">
                  <div className="service-name">{service.name}</div>
                  <div className="service-type">{service.serviceType}</div>
                </div>
                <div className="service-cost">
                  {formatCurrency(service.total)}
                  <span className="monthly">/mo</span>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-hint">No services added</p>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="analytics-grid-3">
        <div className="analytics-card stat-card">
          <div className="stat-label">Services</div>
          <div className="stat-value">{nodes.length}</div>
        </div>
        <div className="analytics-card stat-card">
          <div className="stat-label">Connections</div>
          <div className="stat-value">
            {useStore.getState().edges.length}
          </div>
        </div>
        <div className="analytics-card stat-card">
          <div className="stat-label">Region</div>
          <div className="stat-value">{region}</div>
        </div>
      </div>

      {/* Cost Comparison */}
      <div className="analytics-card">
        <h3>Pricing Model Comparison</h3>
        <div className="comparison-grid">
          {['on-demand', 'reserved-1yr', 'reserved-3yr', 'spot'].map((model) => {
            const onDemandCost = calculateTotalCost(nodes, region, 'on-demand').totalMonthly;
            const modelCost = calculateTotalCost(nodes, region, model).totalMonthly;
            const savings = onDemandCost - modelCost;
            const savingsPercent = (savings / onDemandCost) * 100;

            return (
              <div key={model} className="comparison-item">
                <div className="comparison-model">{model.replace('-', ' ')}</div>
                <div className="comparison-cost">{formatCurrency(modelCost)}</div>
                {savings > 0 && (
                  <div className="comparison-savings">
                    Save {savingsPercent.toFixed(0)}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Options */}
      <div className="analytics-card">
        <div className="export-section">
          <h3>Export Report</h3>
          <div className="export-buttons">
            <button
              className="export-btn"
              onClick={() => exportAsJSON(costData)}
              title="Export as JSON"
            >
              📄 JSON
            </button>
            <button
              className="export-btn"
              onClick={() => exportAsCSV(costData)}
              title="Export as CSV"
            >
              📊 CSV
            </button>
            <button
              className="export-btn"
              onClick={() => exportAsText(costData)}
              title="Export as Text"
            >
              📝 TEXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Color palette for charts
const colors = [
  '#FF9900', // Compute
  '#3F8624', // Storage
  '#3B48CC', // Database
  '#8C4FFF', // Networking
  '#FF4F8B', // Messaging
  '#DD344C', // Security
  '#A166FF', // Analytics
];

const getColorForIndex = (index) => colors[index % colors.length];

// Export functions
const exportAsJSON = (costData) => {
  const dataStr = JSON.stringify(costData, null, 2);
  downloadFile(dataStr, `cost-report-${Date.now()}.json`, 'application/json');
};

const exportAsCSV = (costData) => {
  let csv = 'Service,Type,Monthly Cost,Annual Cost\n';
  costData.services?.forEach((service) => {
    csv += `"${service.name}","${service.serviceType}",${service.total.toFixed(2)},${(service.total * 12).toFixed(2)}\n`;
  });
  csv += `\nTotal Monthly,${costData.totalMonthly.toFixed(2)}\n`;
  csv += `Total Annual,${costData.totalYearly.toFixed(2)}\n`;
  if (costData.savingsPercentage > 0) {
    csv += `Savings vs On-Demand,${costData.savingsPercentage.toFixed(1)}%\n`;
  }
  downloadFile(csv, `cost-report-${Date.now()}.csv`, 'text/csv');
};

const exportAsText = (costData) => {
  let text = '=== AWS Architecture Cost Report ===\n\n';
  text += `Generated: ${new Date().toLocaleString()}\n\n`;
  text += `SUMMARY\n`;
  text += `Monthly: ${formatCurrency(costData.totalMonthly)}\n`;
  text += `Annual: ${formatCurrency(costData.totalYearly)}\n`;
  if (costData.savingsPercentage > 0) {
    text += `Savings: ${costData.savingsPercentage.toFixed(1)}% (${formatCurrency(costData.savings)})\n`;
  }
  text += `\nSERVICES\n`;
  text += '-'.repeat(60) + '\n';
  costData.services?.forEach((service) => {
    text += `${service.name.padEnd(30)} $${service.total.toFixed(2).padStart(12)}/mo\n`;
  });
  text += '-'.repeat(60) + '\n';
  text += `$${costData.totalMonthly.toFixed(2).padStart(12)}/mo\n`;
  downloadFile(text, `cost-report-${Date.now()}.txt`, 'text/plain');
};

const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export default CostAnalytics;
