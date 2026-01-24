/**
 * Connection Validation Engine
 * Validates AWS service connections and detects anti-patterns
 */

import { awsServices } from '../data/awsServices';

// Anti-patterns: connections that are technically possible but not recommended
const ANTI_PATTERNS = {
  'ec2->internet': {
    severity: 'warning',
    message: 'EC2 directly exposed to internet without ALB/NLB',
    suggestion: 'Use Application Load Balancer (ALB) or Network Load Balancer (NLB) for traffic distribution'
  },
  'rds->internet': {
    severity: 'error',
    message: 'RDS exposed to internet - major security risk',
    suggestion: 'RDS should only be accessed through EC2/ECS/Lambda via private subnets'
  },
  'dynamodb->internet': {
    severity: 'warning',
    message: 'DynamoDB exposed to internet',
    suggestion: 'Use VPC endpoints for private access'
  },
  's3->internet-only': {
    severity: 'info',
    message: 'S3 bucket publicly accessible',
    suggestion: 'Use S3 bucket policies to restrict access if needed'
  },
  'lambda->lambda': {
    severity: 'warning',
    message: 'Direct Lambda-to-Lambda invocation can create tight coupling',
    suggestion: 'Consider using SQS, SNS, or EventBridge for loose coupling'
  },
  'ec2->ec2-same-sg': {
    severity: 'info',
    message: 'EC2 instances in same security group can communicate',
    suggestion: 'Ensure proper network segmentation and security groups'
  },
  'no-load-balancer': {
    severity: 'warning',
    message: 'Multiple compute instances without load balancer',
    suggestion: 'Add ALB or NLB to distribute traffic'
  },
  'single-az': {
    severity: 'warning',
    message: 'Single compute instance without HA setup',
    suggestion: 'Use Auto Scaling Groups and multi-AZ deployment'
  },
  'unencrypted-connection': {
    severity: 'warning',
    message: 'Connection uses unencrypted protocol',
    suggestion: 'Use HTTPS/TLS for secure communication'
  }
};

// Best practices for each service type
const SERVICE_BEST_PRACTICES = {
  'ec2': [
    'Place behind load balancer for HA',
    'Use security groups for network isolation',
    'Enable CloudWatch monitoring',
    'Use Elastic IPs for web servers'
  ],
  'rds': [
    'Always use private subnets',
    'Enable Multi-AZ for production',
    'Use VPC security groups',
    'Enable automated backups'
  ],
  's3': [
    'Enable versioning for protection',
    'Use bucket policies for access control',
    'Enable server-side encryption',
    'Configure lifecycle policies'
  ],
  'lambda': [
    'Use SQS/SNS for event sources (not direct calls)',
    'Configure timeout appropriate for function',
    'Use environment variables for config',
    'Enable VPC access if needed'
  ],
  'dynamodb': [
    'Use on-demand for variable workloads',
    'Enable TTL for automatic cleanup',
    'Use Global Tables for multi-region',
    'Enable point-in-time recovery'
  ],
  'alb': [
    'Always use ALB in front of compute',
    'Configure target health checks',
    'Use path-based routing where possible',
    'Enable access logs'
  ],
  'cloudfront': [
    'Use for static assets distribution',
    'Enable compression',
    'Set appropriate cache TTL',
    'Use Origin Access Control (OAC)'
  ]
};

/**
 * Validate if a connection is allowed between two services
 * @returns { valid: boolean, error?: string }
 */
export const validateConnection = (sourceServiceType, targetServiceType) => {
  const sourceService = awsServices[sourceServiceType];
  const targetService = awsServices[targetServiceType];

  if (!sourceService || !targetService) {
    return { valid: false, error: `Service not found: ${!sourceService ? sourceServiceType : targetServiceType}` };
  }

  // Check if connection is allowed
  if (!sourceService.allowedConnections.includes(targetServiceType)) {
    return {
      valid: false,
      error: `${sourceService.name} cannot connect to ${targetService.name}. Invalid connection pattern.`
    };
  }

  return { valid: true };
};

/**
 * Detect anti-patterns and get recommendations
 * @returns { issues: Array<{type, severity, message, suggestion}> }
 */
export const detectAntiPatterns = (nodes, edges) => {
  const issues = [];

  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    if (!sourceNode || !targetNode) return;

    const sourceType = sourceNode.data?.serviceType;
    const targetType = targetNode.data?.serviceType;

    // Check for direct RDS exposure
    if (targetType === 'rds' && !['ec2', 'ecs', 'lambda', 'apprunner', 'aurora'].includes(sourceType)) {
      issues.push({
        type: 'rds-access',
        severity: 'warning',
        message: `${sourceNode.data.label} accessing RDS may not be ideal`,
        suggestion: 'RDS should typically be accessed through compute services'
      });
    }

    // Check for EC2 without load balancer
    if (sourceType === 'ec2' && !edges.some(e => 
      nodes.find(n => n.id === e.source)?.data?.serviceType === 'alb' &&
      e.target === sourceNode.id
    )) {
      const ec2Count = nodes.filter(n => n.data?.serviceType === 'ec2').length;
      if (ec2Count > 1) {
        issues.push({
          type: 'no-load-balancer',
          severity: 'warning',
          message: 'Multiple EC2 instances without load balancer detected',
          suggestion: 'Add Application Load Balancer (ALB) for traffic distribution and high availability'
        });
      }
    }

    // Check for Lambda to Lambda direct invocation
    if (sourceType === 'lambda' && targetType === 'lambda') {
      issues.push({
        type: 'lambda-lambda-coupling',
        severity: 'warning',
        message: 'Direct Lambda-to-Lambda invocation creates tight coupling',
        suggestion: 'Use SQS, SNS, or EventBridge for asynchronous, loosely-coupled communication'
      });
    }

    // Check for S3 without CloudFront
    if (sourceType === 's3' && !edges.some(e => 
      nodes.find(n => n.id === e.source)?.data?.serviceType === 'cloudfront' &&
      e.target === sourceNode.id
    )) {
      issues.push({
        type: 's3-optimization',
        severity: 'info',
        message: 'S3 bucket not behind CloudFront',
        suggestion: 'Use CloudFront CDN in front of S3 for better performance and cost optimization'
      });
    }

    // Check connection protocol
    const sourceService = awsServices[sourceType];
    const targetService = awsServices[targetType];
    const edgeData = edge.data || {};
    
    // Warn about unencrypted protocols for sensitive data
    if (['rds', 'dynamodb', 'elasticache'].includes(targetType) && edgeData.protocol === 'HTTP') {
      issues.push({
        type: 'unencrypted-connection',
        severity: 'error',
        message: `Unencrypted connection to ${targetService.name}`,
        suggestion: 'Use encrypted protocols (TLS/HTTPS) for database and cache connections'
      });
    }
  });

  // Check for single points of failure
  const computeServices = ['ec2', 'ecs', 'lambda', 'apprunner'];
  const computeNodes = nodes.filter(n => computeServices.includes(n.data?.serviceType));
  
  if (computeNodes.length === 1) {
    issues.push({
      type: 'single-compute',
      severity: 'warning',
      message: 'Only single compute instance - no high availability',
      suggestion: 'For production, deploy multiple instances across availability zones with load balancing'
    });
  }

  return issues;
};

/**
 * Get connection validity status with validation and anti-pattern info
 * @returns { valid: boolean, validation: {valid, error?}, antiPatterns: Array, bestPractices: Array }
 */
export const getConnectionStatus = (sourceServiceType, targetServiceType, nodes, edges) => {
  const validation = validateConnection(sourceServiceType, targetServiceType);
  
  if (!validation.valid) {
    return {
      valid: false,
      validation,
      antiPatterns: [],
      bestPractices: []
    };
  }

  const antiPatterns = [];
  const key = `${sourceServiceType}->${targetServiceType}`;
  
  if (ANTI_PATTERNS[key]) {
    antiPatterns.push(ANTI_PATTERNS[key]);
  }

  const bestPractices = [
    ...(SERVICE_BEST_PRACTICES[sourceServiceType] || []).slice(0, 2),
    ...(SERVICE_BEST_PRACTICES[targetServiceType] || []).slice(0, 2)
  ];

  return {
    valid: true,
    validation,
    antiPatterns,
    bestPractices
  };
};

/**
 * Get edge styling based on validation status
 * @returns { strokeColor: string, strokeWidth: number, strokeDasharray?: string, label: string }
 */
export const getEdgeValidationStyle = (sourceServiceType, targetServiceType, isValid) => {
  if (!isValid) {
    return {
      strokeColor: '#FF0000',
      strokeWidth: 3,
      strokeDasharray: '5,5',
      label: '❌ Invalid'
    };
  }

  const validation = validateConnection(sourceServiceType, targetServiceType);
  
  if (!validation.valid) {
    return {
      strokeColor: '#FFA500',
      strokeWidth: 2,
      strokeDasharray: '5,5',
      label: '⚠️ Invalid'
    };
  }

  const antiPatterns = [];
  const key = `${sourceServiceType}->${targetServiceType}`;
  if (ANTI_PATTERNS[key]) {
    antiPatterns.push(ANTI_PATTERNS[key]);
  }

  if (antiPatterns.some(ap => ap.severity === 'error')) {
    return {
      strokeColor: '#FF6B6B',
      strokeWidth: 2.5,
      strokeDasharray: '3,3',
      label: '⚠️ Anti-pattern'
    };
  }

  if (antiPatterns.some(ap => ap.severity === 'warning')) {
    return {
      strokeColor: '#FFD700',
      strokeWidth: 2,
      label: '⚠️ Warning'
    };
  }

  return {
    strokeColor: '#4CAF50',
    strokeWidth: 2,
    label: '✓ Valid'
  };
};

export default {
  validateConnection,
  detectAntiPatterns,
  getConnectionStatus,
  getEdgeValidationStyle
};
