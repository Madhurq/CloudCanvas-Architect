import { useMemo, useState } from 'react';
import useStore from '../store/useStore';
import { calculateTotalCost } from '../utils/costCalculator';
import CostAnalytics from './CostAnalytics';
import OptimizationPanel from './OptimizationPanel';

const CostPanel = () => {
    const { nodes, region, pricingModel } = useStore();
    const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'analytics', or 'optimization'

    const costData = useMemo(() => {
        return calculateTotalCost(nodes, region, pricingModel);
    }, [nodes, region, pricingModel]);

    return (
        <div className="cost-panel">
            <div className="cost-header">
                <h2>💰 Cost Estimate</h2>
                <p className="region-label">Region: {region}</p>
                {pricingModel !== 'on-demand' && (
                    <p className="pricing-model-label">
                        {pricingModel === 'reserved-1yr' && '📊 Reserved 1 Year'}
                        {pricingModel === 'reserved-3yr' && '📊 Reserved 3 Year'}
                        {pricingModel === 'spot' && '⚡ Spot Instances'}
                    </p>
                )}
            </div>

            {/* Tabs */}
            <div className="cost-panel-tabs">
                <button
                    className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveTab('summary')}
                >
                    Summary
                </button>
                <button
                    className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analytics')}
                >
                    Analytics
                </button>
                <button
                    className={`tab-button ${activeTab === 'optimization' ? 'active' : ''}`}
                    onClick={() => setActiveTab('optimization')}
                >
                    🚀 Optimization
                </button>
            </div>

            {/* Summary Tab */}
            {activeTab === 'summary' && (
                <div>
                    <div className="cost-summary">
                        <div className="cost-card monthly">
                            <span className="cost-label">Monthly</span>
                            <span className="cost-value">${costData.totalMonthly.toFixed(2)}</span>
                        </div>
                        <div className="cost-card yearly">
                            <span className="cost-label">Yearly</span>
                            <span className="cost-value">${costData.totalYearly.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Savings Display */}
                    {pricingModel !== 'on-demand' && costData.savings > 0 && (
                        <div className="savings-card">
                            <h3>💵 Cost Savings</h3>
                            <div className="savings-breakdown">
                                <div className="savings-row">
                                    <span>On-Demand Monthly:</span>
                                    <span>${costData.onDemandMonthly.toFixed(2)}</span>
                                </div>
                                <div className="savings-row">
                                    <span>Your Price:</span>
                                    <span className="highlight">${costData.totalMonthly.toFixed(2)}</span>
                                </div>
                                <div className="savings-row total">
                                    <span>Monthly Savings:</span>
                                    <span className="savings-amount">${costData.savings.toFixed(2)}</span>
                                </div>
                                <div className="savings-row total">
                                    <span>Yearly Savings:</span>
                                    <span className="savings-amount">${(costData.savings * 12).toFixed(2)}</span>
                                </div>
                                <div className="savings-percentage">
                                    {costData.savingsPercentage.toFixed(0)}% Off
                                </div>
                            </div>
                        </div>
                    )}

            {/* Savings Display */}
            {pricingModel !== 'on-demand' && costData.savings > 0 && (
                <div className="savings-card">
                    <h3>💵 Cost Savings</h3>
                    <div className="savings-breakdown">
                        <div className="savings-row">
                            <span>On-Demand Monthly:</span>
                            <span>${costData.onDemandMonthly.toFixed(2)}</span>
                        </div>
                        <div className="savings-row">
                            <span>Your Price:</span>
                            <span className="highlight">${costData.totalMonthly.toFixed(2)}</span>
                        </div>
                        <div className="savings-row total">
                            <span>Monthly Savings:</span>
                            <span className="savings-amount">${costData.savings.toFixed(2)}</span>
                        </div>
                        <div className="savings-row total">
                            <span>Yearly Savings:</span>
                            <span className="savings-amount">${(costData.savings * 12).toFixed(2)}</span>
                        </div>
                        <div className="savings-percentage">
                            {costData.savingsPercentage.toFixed(0)}% Off
                        </div>
                    </div>
                </div>
            )}

            {costData.services.length > 0 ? (
                <div className="cost-breakdown">
                    <h3>Service Breakdown</h3>
                    <div className="service-list">
                        {costData.services.map((service) => (
                            <div key={service.id} className="service-cost-item">
                                <div className="service-cost-header">
                                    <span className="service-name">{service.name}</span>
                                    <span className="service-total">${service.total.toFixed(2)}/mo</span>
                                </div>
                                <div className="service-cost-details">
                                    {Object.entries(service.breakdown).map(([key, value]) => (
                                        <div key={key} className="detail-row">
                                            <span className="detail-key">{key}</span>
                                            <span className="detail-value">
                                                {typeof value === 'number' ? `$${value.toFixed(2)}` : value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="cost-empty">
                    <p>Drag AWS services onto the canvas to see cost estimates</p>
                </div>
            )}

                    <div className="cost-footer">
                        <p className="disclaimer">
                            ⚠️ Estimates based on on-demand pricing. Actual costs may vary.
                        </p>
                    </div>
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
                <CostAnalytics costData={costData} />
            )}

            {/* Optimization Tab */}
            {activeTab === 'optimization' && (
                <OptimizationPanel costData={costData} />
            )}
        </div>
    );
};

export default CostPanel;
