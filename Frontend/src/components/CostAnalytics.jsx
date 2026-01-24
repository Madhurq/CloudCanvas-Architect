import { useMemo } from 'react';
import '../styles/CostAnalytics.css';

const CostAnalytics = ({ costData }) => {
    if (!costData) {
        return (
            <div className="cost-analytics">
                <div className="empty-state">
                    <p>No cost data available</p>
                    <p className="empty-hint">Add services to see analytics</p>
                </div>
            </div>
        );
    }

    const { services, vpc, dataTransfer, total, totalYearly } = costData;

    // Calculate percentages for breakdown
    const totalCost = total || 0;
    const servicesPercent = totalCost > 0 ? (services?.totalMonthly || 0) / totalCost * 100 : 0;
    const vpcPercent = totalCost > 0 ? (vpc?.total || 0) / totalCost * 100 : 0;
    const transferPercent = totalCost > 0 ? (dataTransfer?.total || 0) / totalCost * 100 : 0;

    // Top services by cost
    const topServices = useMemo(() => {
        if (!services?.services || services.services.length === 0) return [];
        return [...services.services]
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [services]);

    // Calculate savings if on-demand pricing is available
    const savings = services?.savings || 0;
    const savingsPercent = services?.savingsPercentage || 0;

    return (
        <div className="cost-analytics">
            {/* Summary Cards */}
            <div className="analytics-grid-3">
                <div className="analytics-card summary-card">
                    <div className="card-header">
                        <h3>Total Monthly Cost</h3>
                        <span className="model-badge">Current</span>
                    </div>
                    <div className="card-value">${total.toFixed(2)}</div>
                    <div className="card-subtext">${totalYearly.toFixed(2)} per year</div>
                </div>

                <div className="analytics-card summary-card">
                    <div className="card-header">
                        <h3>Services Cost</h3>
                    </div>
                    <div className="card-value">${services?.totalMonthly?.toFixed(2) || '0.00'}</div>
                    <div className="card-subtext">{servicesPercent.toFixed(1)}% of total</div>
                </div>

                {savings > 0 && (
                    <div className="analytics-card summary-card">
                        <div className="card-header">
                            <h3>Potential Savings</h3>
                            <span className="save-badge">Reserved</span>
                        </div>
                        <div className="card-value savings-value">${savings.toFixed(2)}</div>
                        <div className="card-subtext">{savingsPercent.toFixed(1)}% savings</div>
                    </div>
                )}
            </div>

            {/* Cost Breakdown by Category */}
            <div className="analytics-card">
                <h3>Cost Breakdown by Category</h3>
                <div className="breakdown-list">
                    {services?.totalMonthly > 0 && (
                        <div className="breakdown-item">
                            <div className="breakdown-label">Services</div>
                            <div className="breakdown-bar-container">
                                <div
                                    className="breakdown-bar"
                                    style={{
                                        width: `${servicesPercent}%`,
                                        backgroundColor: '#3b82f6'
                                    }}
                                />
                            </div>
                            <div className="breakdown-stats">
                                <span>${services.totalMonthly.toFixed(2)}</span>
                                <span className="percentage">{servicesPercent.toFixed(1)}%</span>
                            </div>
                        </div>
                    )}

                    {vpc?.total > 0 && (
                        <div className="breakdown-item">
                            <div className="breakdown-label">VPC & Networking</div>
                            <div className="breakdown-bar-container">
                                <div
                                    className="breakdown-bar"
                                    style={{
                                        width: `${vpcPercent}%`,
                                        backgroundColor: '#10b981'
                                    }}
                                />
                            </div>
                            <div className="breakdown-stats">
                                <span>${vpc.total.toFixed(2)}</span>
                                <span className="percentage">{vpcPercent.toFixed(1)}%</span>
                            </div>
                        </div>
                    )}

                    {dataTransfer?.total > 0 && (
                        <div className="breakdown-item">
                            <div className="breakdown-label">Data Transfer</div>
                            <div className="breakdown-bar-container">
                                <div
                                    className="breakdown-bar"
                                    style={{
                                        width: `${transferPercent}%`,
                                        backgroundColor: '#8b5cf6'
                                    }}
                                />
                            </div>
                            <div className="breakdown-stats">
                                <span>${dataTransfer.total.toFixed(2)}</span>
                                <span className="percentage">{transferPercent.toFixed(1)}%</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Services */}
            {topServices.length > 0 && (
                <div className="analytics-card">
                    <h3>Top Services by Cost</h3>
                    <div className="services-list">
                        {topServices.map((service, index) => (
                            <div key={service.id} className="service-item">
                                <div className="service-rank">{index + 1}</div>
                                <div className="service-info">
                                    <div className="service-name">{service.name}</div>
                                    <div className="service-type">
                                        {service.serviceType.toUpperCase()} • {service.region}
                                    </div>
                                </div>
                                <div className="service-cost">
                                    ${service.total.toFixed(2)}
                                    <span className="monthly">per month</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VPC Breakdown */}
            {vpc?.breakdown && Object.keys(vpc.breakdown).length > 0 && (
                <div className="analytics-card">
                    <h3>VPC & Networking Breakdown</h3>
                    <div className="breakdown-list">
                        {Object.entries(vpc.breakdown).map(([key, value]) => {
                            if (value <= 0) return null;
                            const percent = vpc.total > 0 ? (value / vpc.total) * 100 : 0;
                            return (
                                <div key={key} className="breakdown-item">
                                    <div className="breakdown-label">{key}</div>
                                    <div className="breakdown-bar-container">
                                        <div
                                            className="breakdown-bar"
                                            style={{
                                                width: `${percent}%`,
                                                backgroundColor: '#10b981'
                                            }}
                                        />
                                    </div>
                                    <div className="breakdown-stats">
                                        <span>${value.toFixed(2)}</span>
                                        <span className="percentage">{percent.toFixed(1)}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Data Transfer Breakdown */}
            {dataTransfer?.breakdown && Object.keys(dataTransfer.breakdown).length > 0 && (
                <div className="analytics-card">
                    <h3>Data Transfer Breakdown</h3>
                    <div className="breakdown-list">
                        {Object.entries(dataTransfer.breakdown).map(([key, value]) => {
                            if (value <= 0) return null;
                            const percent = dataTransfer.total > 0 ? (value / dataTransfer.total) * 100 : 0;
                            return (
                                <div key={key} className="breakdown-item">
                                    <div className="breakdown-label">{key}</div>
                                    <div className="breakdown-bar-container">
                                        <div
                                            className="breakdown-bar"
                                            style={{
                                                width: `${percent}%`,
                                                backgroundColor: '#8b5cf6'
                                            }}
                                        />
                                    </div>
                                    <div className="breakdown-stats">
                                        <span>${value.toFixed(2)}</span>
                                        <span className="percentage">{percent.toFixed(1)}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Region Breakdown */}
            {services?.perRegion && Object.keys(services.perRegion).length > 1 && (
                <div className="analytics-card">
                    <h3>Cost by Region</h3>
                    <div className="breakdown-list">
                        {Object.entries(services.perRegion).map(([region, cost]) => {
                            const percent = services.totalMonthly > 0 ? (cost / services.totalMonthly) * 100 : 0;
                            return (
                                <div key={region} className="breakdown-item">
                                    <div className="breakdown-label">{region}</div>
                                    <div className="breakdown-bar-container">
                                        <div
                                            className="breakdown-bar"
                                            style={{
                                                width: `${percent}%`,
                                                backgroundColor: '#f59e0b'
                                            }}
                                        />
                                    </div>
                                    <div className="breakdown-stats">
                                        <span>${cost.toFixed(2)}</span>
                                        <span className="percentage">{percent.toFixed(1)}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {totalCost === 0 && (
                <div className="empty-state">
                    <p>No services added yet</p>
                    <p className="empty-hint">Add services to the canvas to see detailed analytics</p>
                </div>
            )}
        </div>
    );
};

export default CostAnalytics;
