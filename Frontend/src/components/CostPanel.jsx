import { useMemo, useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { calculateTotalCost, calculateVPCCost, calculateDataTransferCost } from '../utils/costCalculator';
import CostAnalytics from './CostAnalytics';
import OptimizationPanel from './OptimizationPanel';
import VPCConfigPanel from './VPCConfigPanel';
import { prefetchDataTransferRates } from '../services/dataTransferPricing';

const CostPanel = () => {
    const { nodes, edges, region, pricingModel, vpcConfig, includeVPC, includeDataTransfer } = useStore();
    const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'vpc', 'analytics', or 'optimization'
    const [dataTransferVersion, setDataTransferVersion] = useState(0);

    // Prefetch API-backed data transfer rates for all regions used by nodes
    useEffect(() => {
        const uniqueRegions = Array.from(new Set(nodes.map(n => n.data?.region || region)));
        if (uniqueRegions.length === 0) return;
        Promise.all(uniqueRegions.map(r => prefetchDataTransferRates(r)))
            .then(() => setDataTransferVersion(v => v + 1))
            .catch(() => { });
    }, [nodes, region]);

    const costData = useMemo(() => {
        const serviceCost = calculateTotalCost(nodes, region, pricingModel);

        // Only include VPC costs if there are services on canvas
        let vpcCost = { total: 0, breakdown: {}, priceSource: 'N/A' };
        if (includeVPC && nodes.length > 0) {
            vpcCost = calculateVPCCost(vpcConfig, region, pricingModel);
        }

        // Only include data transfer if there are edges
        let transferCost = { total: 0, breakdown: {}, priceSource: 'N/A' };
        if (includeDataTransfer && edges.length > 0) {
            transferCost = calculateDataTransferCost(edges, nodes, region, region, pricingModel);
        }

        return {
            services: serviceCost,
            vpc: vpcCost,
            dataTransfer: transferCost,
            total: serviceCost.totalMonthly + vpcCost.total + transferCost.total,
            totalYearly: (serviceCost.totalMonthly + vpcCost.total + transferCost.total) * 12,
            hasServices: nodes.length > 0
        };
    }, [nodes, edges, region, pricingModel, vpcConfig, includeVPC, includeDataTransfer, dataTransferVersion]);

    return (
        <div className="cost-panel">
            <div className="cost-header">
                <h2>💰 Cost Estimate</h2>
                {costData.services?.perRegion && Object.keys(costData.services.perRegion).length > 1 ? (
                    <p className="region-label">
                        Regions: {Object.keys(costData.services.perRegion).join(', ')}
                    </p>
                ) : (
                    <p className="region-label">Region: {region}</p>
                )}
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
                    className={`tab-button ${activeTab === 'vpc' ? 'active' : ''} ${!costData.hasServices ? 'disabled' : ''}`}
                    onClick={() => costData.hasServices && setActiveTab('vpc')}
                    disabled={!costData.hasServices}
                    title={!costData.hasServices ? 'Add services to enable VPC configuration' : ''}
                >
                    🌐 VPC
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
                <>
                    <div className="cost-summary">
                        <div className="cost-card monthly">
                            <span className="cost-label">Monthly</span>
                            <span className="cost-value">${costData.total.toFixed(2)}</span>
                        </div>
                        <div className="cost-card yearly">
                            <span className="cost-label">Yearly</span>
                            <span className="cost-value">${costData.totalYearly.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Cost Breakdown by Category */}
                    <div className="cost-category-breakdown">
                        <h3>Cost Breakdown</h3>

                        {/* Services */}
                        <div className="cost-category">
                            <div className="category-header">
                                <span className="category-name">Services</span>
                                <span className="category-cost">${costData.services.totalMonthly.toFixed(2)}</span>
                            </div>
                            {costData.services.services.length > 0 ? (
                                <div className="category-services">
                                    {costData.services.services.map((service) => (
                                        <div key={service.id} className="service-item">
                                            <span>{service.name} <span className="service-region">({service.region})</span></span>
                                            <span>${service.total.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="category-empty">No services added</p>
                            )}
                            {costData.services?.perRegion && Object.keys(costData.services.perRegion).length > 1 && (
                                <div className="category-breakdown" style={{ marginTop: '8px' }}>
                                    {Object.entries(costData.services.perRegion).map(([rgn, val]) => (
                                        <div key={rgn} className="breakdown-item">
                                            <span>Region: {rgn}</span>
                                            <span>${val.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* VPC & Networking */}
                        {includeVPC && costData.hasServices && costData.vpc.total > 0 && (
                            <div className="cost-category">
                                <div className="category-header">
                                    <span className="category-name">🌐 VPC & Networking</span>
                                    <span className="category-cost">${costData.vpc.total.toFixed(2)}</span>
                                </div>
                                <div className="category-breakdown">
                                    {Object.entries(costData.vpc.breakdown).map(([key, value]) => (
                                        <div key={key} className="breakdown-item">
                                            <span>{key}</span>
                                            <span>${value.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Data Transfer */}
                        {includeDataTransfer && costData.dataTransfer.total > 0 && (
                            <div className="cost-category">
                                <div className="category-header">
                                    <span className="category-name">📊 Data Transfer</span>
                                    <span className="category-cost">${costData.dataTransfer.total.toFixed(2)}</span>
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                    ✨ Live AWS API pricing (per-region rates)
                                </div>
                                <div className="category-breakdown">
                                    {Object.entries(costData.dataTransfer.breakdown).map(([key, value]) => (
                                        <div key={key} className="breakdown-item">
                                            <span className="transfer-route">{key}</span>
                                            <span>${value.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="cost-footer">
                        <p className="disclaimer">
                            ⚠️ Estimates based on on-demand pricing. Actual costs may vary.
                        </p>
                    </div>
                </>
            )}

            {/* VPC Configuration Tab */}
            {activeTab === 'vpc' && (
                <div className="vpc-tab-content">
                    <VPCConfigPanel />
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
