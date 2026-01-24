/**
 * Cost Optimization Engine
 * Analyzes architecture for cost optimization opportunities
 */

export const OptimizationSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
};

/**
 * Analyze architecture for EC2 instances without load balancer
 * @param {Array} nodes - Architecture nodes
 * @param {Array} edges - Architecture connections
 * @returns {Object} Optimization suggestion
 */
export const checkEC2WithoutLoadBalancer = (nodes, edges) => {
  const ec2Nodes = nodes.filter(n => n.data.label === 'EC2');
  if (ec2Nodes.length === 0) return null;

  // Check if any EC2 is not connected to ALB/NLB
  const unbalancedEC2s = ec2Nodes.filter(ec2 => {
    const hasLB = edges.some(
      e =>
        (e.source === ec2.id && nodes.find(n => n.id === e.target)?.data.label === 'ALB') ||
        (e.source === ec2.id && nodes.find(n => n.id === e.target)?.data.label === 'NLB') ||
        (e.target === ec2.id && nodes.find(n => n.id === e.source)?.data.label === 'ALB') ||
        (e.target === ec2.id && nodes.find(n => n.id === e.source)?.data.label === 'NLB')
    );
    return !hasLB;
  });

  if (unbalancedEC2s.length > 0) {
    return {
      id: 'ec2-without-lb',
      title: 'EC2 Instances Without Load Balancer',
      description: `${unbalancedEC2s.length} EC2 instance(s) not connected to a load balancer. This prevents auto-scaling and high availability.`,
      severity: OptimizationSeverity.CRITICAL,
      estimatedSavings: unbalancedEC2s.length * 50,
      recommendation: 'Add Application Load Balancer (ALB) or Network Load Balancer (NLB) in front of EC2 instances for better scalability and availability.',
      impactedResources: unbalancedEC2s.map(ec2 => ec2.id),
    };
  }

  return null;
};

/**
 * Analyze for single point of failure (no redundancy)
 * @param {Array} nodes - Architecture nodes
 * @param {Array} edges - Architecture connections
 * @returns {Object} Optimization suggestion
 */
export const checkSinglePointOfFailure = (nodes, edges) => {
  const computeServices = ['EC2', 'RDS', 'Lambda', 'ECS', 'EKS'];
  const singleNodes = nodes.filter(
    n => computeServices.includes(n.data.label) && n.data.quantity === 1
  );

  if (singleNodes.length > 0) {
    return {
      id: 'single-point-failure',
      title: 'Single Points of Failure Detected',
      description: `${singleNodes.length} service(s) running as a single instance. This creates availability risks.`,
      severity: OptimizationSeverity.CRITICAL,
      estimatedSavings: 0,
      recommendation: 'Deploy multiple instances across availability zones for high availability. Consider using Auto Scaling Groups with minimum 2 instances.',
      impactedResources: singleNodes.map(n => n.id),
    };
  }

  return null;
};

/**
 * Analyze for unoptimized instance sizes
 * @param {Array} nodes - Architecture nodes
 * @returns {Object} Optimization suggestion
 */
export const checkUnoptimizedInstances = (nodes) => {
  const largeInstances = nodes.filter(
    n =>
      (n.data.label === 'EC2' && n.data.instanceType?.includes('xlarge')) ||
      (n.data.label === 'RDS' && n.data.instanceType?.includes('large'))
  );

  if (largeInstances.length > 0) {
    const monthlySavings = largeInstances.length * 150; // Rough estimate
    return {
      id: 'unoptimized-instances',
      title: 'Large Instance Types Detected',
      description: `${largeInstances.length} service(s) using large or xlarge instance types. Consider right-sizing for your workload.`,
      severity: OptimizationSeverity.WARNING,
      estimatedSavings: monthlySavings,
      recommendation: 'Review actual resource utilization and consider downgrading to smaller instance types (t3, t4) or using burstable instances for non-critical workloads.',
      impactedResources: largeInstances.map(n => n.id),
    };
  }

  return null;
};

/**
 * Analyze for missing Reserved Instances
 * @param {Array} nodes - Architecture nodes
 * @returns {Object} Optimization suggestion
 */
export const checkMissingReservedInstances = (nodes) => {
  const computeServices = ['EC2', 'RDS', 'Redshift'];
  const computeNodes = nodes.filter(n => computeServices.includes(n.data.label));

  if (computeNodes.length > 0) {
    // Estimate monthly cost and savings with 1-year reserved instance (30% discount)
    const estimatedMonthlyCost = computeNodes.length * 200;
    const savingsPerMonth = Math.round(estimatedMonthlyCost * 0.3);
    const savingsPerYear = savingsPerMonth * 12;

    return {
      id: 'missing-reserved-instances',
      title: 'Opportunity for Reserved Instance Savings',
      description: `${computeNodes.length} long-running compute service(s) can benefit from Reserved Instances.`,
      severity: OptimizationSeverity.WARNING,
      estimatedSavings: savingsPerMonth,
      recommendation: `Purchase 1-year or 3-year Reserved Instances for baseline capacity. Estimated savings: $${savingsPerMonth}/month ($${savingsPerYear}/year).`,
      impactedResources: computeNodes.map(n => n.id),
    };
  }

  return null;
};

/**
 * Analyze for unused resources
 * @param {Array} nodes - Architecture nodes
 * @param {Array} edges - Architecture connections
 * @returns {Object} Optimization suggestion
 */
export const checkUnusedResources = (nodes, edges) => {
  const orphanNodes = nodes.filter(node => {
    // Find if node has any connections
    const hasConnection = edges.some(e => e.source === node.id || e.target === node.id);
    return !hasConnection;
  });

  if (orphanNodes.length > 0) {
    const estimatedMonthlyCost = orphanNodes.length * 25;
    return {
      id: 'unused-resources',
      title: 'Disconnected/Unused Resources',
      description: `${orphanNodes.length} resource(s) with no connections to the architecture. These may be unused.`,
      severity: OptimizationSeverity.WARNING,
      estimatedSavings: estimatedMonthlyCost,
      recommendation: 'Review and remove disconnected resources if no longer needed. This will reduce unnecessary costs.',
      impactedResources: orphanNodes.map(n => n.id),
    };
  }

  return null;
};

/**
 * Analyze for cross-region data transfer costs
 * @param {Array} nodes - Architecture nodes
 * @param {Array} edges - Architecture connections
 * @returns {Object} Optimization suggestion
 */
export const checkCrossRegionTransfer = (nodes) => {
  // Check if multiple regions are used
  const regions = [...new Set(nodes.map(n => n.data.region))];

  if (regions.length > 1) {
    const estimatedMonthlyCost = 500; // Rough estimate
    return {
      id: 'cross-region-transfer',
      title: 'Cross-Region Data Transfer',
      description: `Architecture spans ${regions.length} regions. Data transfer between regions has significant costs.`,
      severity: OptimizationSeverity.INFO,
      estimatedSavings: 0,
      recommendation: 'Consolidate to single region when possible. If multi-region is required, use CloudFront or S3 cross-region replication with appropriate caching.',
      impactedResources: [],
    };
  }

  return null;
};

/**
 * Analyze for missing auto-scaling configuration
 * @param {Array} nodes - Architecture nodes
 * @returns {Object} Optimization suggestion
 */
export const checkMissingAutoScaling = (nodes) => {
  const scalableServices = nodes.filter(
    n => ['EC2', 'ECS', 'Lambda', 'DynamoDB'].includes(n.data.label) && !n.data.autoScaling
  );

  if (scalableServices.length > 0) {
    return {
      id: 'missing-auto-scaling',
      title: 'Missing Auto-Scaling Configuration',
      description: `${scalableServices.length} service(s) could benefit from auto-scaling to optimize costs during low-traffic periods.`,
      severity: OptimizationSeverity.INFO,
      estimatedSavings: 100,
      recommendation: 'Enable auto-scaling for variable workloads. Scale down during off-peak hours and scale up during peak demand to optimize costs.',
      impactedResources: scalableServices.map(n => n.id),
    };
  }

  return null;
};

/**
 * Analyze for inefficient storage configuration
 * @param {Array} nodes - Architecture nodes
 * @returns {Object} Optimization suggestion
 */
export const checkStorageOptimization = (nodes) => {
  const storageNodes = nodes.filter(n => ['S3', 'EBS', 'EFS'].includes(n.data.label));

  if (storageNodes.length > 0) {
    const s3Nodes = storageNodes.filter(n => n.data.label === 'S3');
    if (s3Nodes.length > 0 && !s3Nodes.some(n => n.data.storageClass === 'INTELLIGENT_TIERING')) {
      return {
        id: 'storage-optimization',
        title: 'Storage Optimization Opportunity',
        description: 'S3 buckets can benefit from Intelligent-Tiering or Lifecycle Policies to reduce storage costs.',
        severity: OptimizationSeverity.INFO,
        estimatedSavings: 50,
        recommendation: 'Enable S3 Intelligent-Tiering for automatic cost optimization. Implement Lifecycle Policies to move old data to cheaper tiers.',
        impactedResources: s3Nodes.map(n => n.id),
      };
    }
  }

  return null;
};

/**
 * Run comprehensive optimization analysis
 * @param {Array} nodes - Architecture nodes
 * @param {Array} edges - Architecture connections
 * @returns {Array} Array of optimization suggestions
 */
export const analyzeArchitecture = (nodes, edges) => {
  const suggestions = [];

  // Run all analysis checks
  const checks = [
    checkEC2WithoutLoadBalancer(nodes, edges),
    checkSinglePointOfFailure(nodes, edges),
    checkUnoptimizedInstances(nodes),
    checkMissingReservedInstances(nodes),
    checkUnusedResources(nodes, edges),
    checkCrossRegionTransfer(nodes),
    checkMissingAutoScaling(nodes),
    checkStorageOptimization(nodes),
  ];

  // Filter out null results and sort by severity
  return checks
    .filter(Boolean)
    .sort((a, b) => {
      const severityOrder = {
        [OptimizationSeverity.CRITICAL]: 0,
        [OptimizationSeverity.WARNING]: 1,
        [OptimizationSeverity.INFO]: 2,
      };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
};

/**
 * Calculate total potential savings
 * @param {Array} suggestions - Array of optimization suggestions
 * @returns {number} Total potential monthly savings
 */
export const calculateTotalPotentialSavings = (suggestions) => {
  return suggestions.reduce((total, suggestion) => total + (suggestion.estimatedSavings || 0), 0);
};

/**
 * Get optimization stats
 * @param {Array} suggestions - Array of optimization suggestions
 * @returns {Object} Stats object
 */
export const getOptimizationStats = (suggestions) => {
  return {
    total: suggestions.length,
    critical: suggestions.filter(s => s.severity === OptimizationSeverity.CRITICAL).length,
    warning: suggestions.filter(s => s.severity === OptimizationSeverity.WARNING).length,
    info: suggestions.filter(s => s.severity === OptimizationSeverity.INFO).length,
    totalSavings: calculateTotalPotentialSavings(suggestions),
  };
};
