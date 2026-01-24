import { useState } from 'react';
import useStore from '../store/useStore';

const VPCConfigPanel = () => {
    const { vpcConfig, setVPCConfig } = useStore();
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleChange = (field, value) => {
        setVPCConfig({
            ...vpcConfig,
            [field]: value
        });
    };

    return (
        <div className="vpc-config-panel">
            <div className="vpc-header">
                <h3>🌐 VPC Configuration</h3>
                <button 
                    className="toggle-advanced"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                >
                    {showAdvanced ? '▼' : '▶'} Advanced
                </button>
            </div>

            <div className="vpc-config-group">
                <label>
                    <span>NAT Gateways</span>
                    <input
                        type="number"
                        min="0"
                        max="10"
                        value={vpcConfig.natGateways || 0}
                        onChange={(e) => handleChange('natGateways', parseInt(e.target.value))}
                        placeholder="0"
                    />
                </label>
                <p className="config-hint">$0.045/hour per NAT Gateway</p>
            </div>

            <div className="vpc-config-group">
                <label>
                    <span>NAT Data Processed (GB/month)</span>
                    <input
                        type="number"
                        min="0"
                        step="10"
                        value={vpcConfig.natDataProcessingGB || 0}
                        onChange={(e) => handleChange('natDataProcessingGB', parseFloat(e.target.value))}
                        placeholder="0"
                    />
                </label>
                <p className="config-hint">$0.045/GB for data processed through NAT</p>
            </div>

            <div className="vpc-config-group">
                <label>
                    <span>Unused Elastic IPs</span>
                    <input
                        type="number"
                        min="0"
                        max="10"
                        value={vpcConfig.unusedElasticIPs || 0}
                        onChange={(e) => handleChange('unusedElasticIPs', parseInt(e.target.value))}
                        placeholder="0"
                    />
                </label>
                <p className="config-hint">$0.005/hour when not associated to an instance</p>
            </div>

            {showAdvanced && (
                <div className="vpc-advanced">
                    <div className="vpc-config-group">
                        <label>
                            <span>VPC Flow Logs (GB/month)</span>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={vpcConfig.flowLogsGB || 0}
                                onChange={(e) => handleChange('flowLogsGB', parseFloat(e.target.value))}
                                placeholder="0"
                            />
                        </label>
                        <p className="config-hint">$0.06/GB for VPC Flow Logs ingestion</p>
                    </div>

                    <div className="vpc-config-group">
                        <label>
                            <span>Number of Subnets</span>
                            <input
                                type="number"
                                min="1"
                                max="200"
                                value={vpcConfig.subnets || 1}
                                onChange={(e) => handleChange('subnets', parseInt(e.target.value))}
                                placeholder="1"
                            />
                        </label>
                        <p className="config-hint">Informational: IPs are covered in VPC hourly cost</p>
                    </div>

                    <div className="vpc-config-group">
                        <label>
                            <span>Total Available IPs</span>
                            <input
                                type="number"
                                min="0"
                                step="256"
                                value={vpcConfig.totalIPs || 256}
                                onChange={(e) => handleChange('totalIPs', parseInt(e.target.value))}
                                placeholder="256"
                            />
                        </label>
                        <p className="config-hint">CIDR size impacts cost. /24 = 256 IPs, /16 = 65,536 IPs</p>
                    </div>
                </div>
            )}

            <div className="vpc-summary">
                <p className="summary-text">
                    ℹ️ VPC hourly cost: $0.07/hour = $51.10/month (fixed)
                </p>
            </div>
        </div>
    );
};

export default VPCConfigPanel;
