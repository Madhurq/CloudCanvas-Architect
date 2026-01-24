/**
 * Pre-built Architecture Templates
 * Users can load these to quickly start designing common AWS architectures
 */

export const architectureTemplates = [
  {
    id: '3-tier-web',
    name: '3-Tier Web Application',
    description: 'Classic 3-tier architecture with load balancer, app servers, and database',
    category: 'Web Application',
    thumbnail: '🏢',
    difficulty: 'Beginner',
    nodes: [
      {
        id: 'cloudfront-1',
        type: 'awsService',
        position: { x: 50, y: 50 },
        data: {
          label: 'CloudFront CDN',
          serviceType: 'cloudfront',
          color: '#8C4FFF',
          config: {
            dataTransferGB: 100,
            requestsMillions: 1,
            httpRequests: true
          }
        }
      },
      {
        id: 'alb-1',
        type: 'awsService',
        position: { x: 50, y: 200 },
        data: {
          label: 'Application Load Balancer',
          serviceType: 'alb',
          color: '#8C4FFF',
          config: {
            hoursPerMonth: 730,
            lcuHours: 10,
            newConnections: 100000,
            processedBytes: 50
          }
        }
      },
      {
        id: 'ec2-1',
        type: 'awsService',
        position: { x: 50, y: 350 },
        data: {
          label: 'EC2 App Server 1',
          serviceType: 'ec2',
          color: '#FF9900',
          config: {
            instanceType: 't3.medium',
            count: 1,
            hoursPerMonth: 730,
            os: 'linux',
            ebsStorage: 30
          }
        }
      },
      {
        id: 'ec2-2',
        type: 'awsService',
        position: { x: 250, y: 350 },
        data: {
          label: 'EC2 App Server 2',
          serviceType: 'ec2',
          color: '#FF9900',
          config: {
            instanceType: 't3.medium',
            count: 1,
            hoursPerMonth: 730,
            os: 'linux',
            ebsStorage: 30
          }
        }
      },
      {
        id: 'rds-1',
        type: 'awsService',
        position: { x: 150, y: 500 },
        data: {
          label: 'RDS Database',
          serviceType: 'rds',
          color: '#3B48CC',
          config: {
            instanceClass: 'db.t3.small',
            engine: 'postgres',
            storageGB: 100,
            multiAZ: true
          }
        }
      },
      {
        id: 's3-1',
        type: 'awsService',
        position: { x: 400, y: 150 },
        data: {
          label: 'S3 Static Assets',
          serviceType: 's3',
          color: '#3F8624',
          config: {
            storageGB: 100,
            storageClass: 'STANDARD',
            putRequests: 100000,
            getRequests: 1000000,
            dataTransferOutGB: 50
          }
        }
      }
    ],
    edges: [
      { source: 'cloudfront-1', target: 's3-1', type: 'labeled', animated: true, data: { port: 443, protocol: 'HTTPS' } },
      { source: 'cloudfront-1', target: 'alb-1', type: 'labeled', animated: true, data: { port: 443, protocol: 'HTTPS' } },
      { source: 'alb-1', target: 'ec2-1', type: 'labeled', animated: true, data: { port: 80, protocol: 'HTTP' } },
      { source: 'alb-1', target: 'ec2-2', type: 'labeled', animated: true, data: { port: 80, protocol: 'HTTP' } },
      { source: 'ec2-1', target: 'rds-1', type: 'labeled', animated: true, data: { port: 5432, protocol: 'TCP' } },
      { source: 'ec2-2', target: 'rds-1', type: 'labeled', animated: true, data: { port: 5432, protocol: 'TCP' } }
    ]
  },

  {
    id: 'serverless-api',
    name: 'Serverless API',
    description: 'Fully serverless REST API with Lambda, API Gateway, and DynamoDB',
    category: 'API',
    thumbnail: '⚡',
    difficulty: 'Beginner',
    nodes: [
      {
        id: 'cloudfront-2',
        type: 'awsService',
        position: { x: 50, y: 50 },
        data: {
          label: 'CloudFront CDN',
          serviceType: 'cloudfront',
          color: '#8C4FFF',
          config: {
            dataTransferGB: 50,
            requestsMillions: 1,
            httpRequests: true
          }
        }
      },
      {
        id: 'apigateway-1',
        type: 'awsService',
        position: { x: 50, y: 200 },
        data: {
          label: 'API Gateway',
          serviceType: 'apigateway',
          color: '#8C4FFF',
          config: {
            requestsMillions: 1,
            apiType: 'REST',
            cachingEnabled: true
          }
        }
      },
      {
        id: 'lambda-1',
        type: 'awsService',
        position: { x: 50, y: 350 },
        data: {
          label: 'Lambda Function',
          serviceType: 'lambda',
          color: '#FF9900',
          config: {
            requestsPerMonth: 1000000,
            avgDurationMs: 200,
            memoryMB: 256
          }
        }
      },
      {
        id: 'dynamodb-1',
        type: 'awsService',
        position: { x: 50, y: 500 },
        data: {
          label: 'DynamoDB Table',
          serviceType: 'dynamodb',
          color: '#3B48CC',
          config: {
            readUnits: 25,
            writeUnits: 25,
            storageGB: 25,
            capacityMode: 'on-demand'
          }
        }
      },
      {
        id: 's3-2',
        type: 'awsService',
        position: { x: 250, y: 200 },
        data: {
          label: 'S3 Media Storage',
          serviceType: 's3',
          color: '#3F8624',
          config: {
            storageGB: 500,
            storageClass: 'STANDARD',
            putRequests: 500000,
            getRequests: 5000000,
            dataTransferOutGB: 200
          }
        }
      }
    ],
    edges: [
      { source: 'cloudfront-2', target: 'apigateway-1', type: 'labeled', animated: true, data: { port: 443, protocol: 'HTTPS' } },
      { source: 'cloudfront-2', target: 's3-2', type: 'labeled', animated: true, data: { port: 443, protocol: 'HTTPS' } },
      { source: 'apigateway-1', target: 'lambda-1', type: 'labeled', animated: true, data: { port: 443, protocol: 'HTTPS' } },
      { source: 'lambda-1', target: 'dynamodb-1', type: 'labeled', animated: true, data: { port: 443, protocol: 'HTTPS' } },
      { source: 'lambda-1', target: 's3-2', type: 'labeled', animated: true, data: { port: 443, protocol: 'HTTPS' } }
    ]
  },

  {
    id: 'data-pipeline',
    name: 'Data Pipeline',
    description: 'Data ingestion, processing, and warehouse with Kinesis, Glue, and Redshift',
    category: 'Analytics',
    thumbnail: '🌊',
    difficulty: 'Intermediate',
    nodes: [
      {
        id: 'kinesis-1',
        type: 'awsService',
        position: { x: 50, y: 100 },
        data: {
          label: 'Kinesis Data Streams',
          serviceType: 'kinesis',
          color: '#A166FF',
          config: {
            shards: 2,
            hoursPerMonth: 730,
            dataIngestionGB: 100
          }
        }
      },
      {
        id: 's3-3',
        type: 'awsService',
        position: { x: 250, y: 100 },
        data: {
          label: 'S3 Data Lake',
          serviceType: 's3',
          color: '#3F8624',
          config: {
            storageGB: 5000,
            storageClass: 'STANDARD_IA',
            putRequests: 1000000,
            getRequests: 5000000,
            dataTransferOutGB: 500
          }
        }
      },
      {
        id: 'glue-1',
        type: 'awsService',
        position: { x: 150, y: 250 },
        data: {
          label: 'AWS Glue',
          serviceType: 'glue',
          color: '#A166FF',
          config: {
            dpuHours: 500,
            crawlerHours: 50,
            numCrawlers: 3
          }
        }
      },
      {
        id: 'redshift-1',
        type: 'awsService',
        position: { x: 50, y: 400 },
        data: {
          label: 'Redshift Warehouse',
          serviceType: 'redshift',
          color: '#A166FF',
          config: {
            nodeType: 'ra3.xlplus',
            numNodes: 3,
            hoursPerMonth: 730,
            storageGB: 5000
          }
        }
      },
      {
        id: 'athena-1',
        type: 'awsService',
        position: { x: 250, y: 400 },
        data: {
          label: 'Athena Queries',
          serviceType: 'athena',
          color: '#A166FF',
          config: {
            dataScannedTB: 10
          }
        }
      },
      {
        id: 'quicksight-1',
        type: 'awsService',
        position: { x: 150, y: 550 },
        data: {
          label: 'QuickSight Dashboard',
          serviceType: 'quicksight',
          color: '#A166FF',
          config: {
            userType: 'author',
            users: 20,
            sessions: 5000
          }
        }
      }
    ],
    edges: [
      { source: 'kinesis-1', target: 's3-3', type: 'labeled', animated: true, data: { port: 443, protocol: 'HTTPS' } },
      { source: 's3-3', target: 'glue-1', type: 'labeled', animated: true, data: { port: 443, protocol: 'HTTPS' } },
      { source: 'glue-1', target: 'redshift-1', type: 'labeled', animated: true, data: { port: 443, protocol: 'HTTPS' } },
      { source: 's3-3', target: 'athena-1', type: 'labeled', animated: true, data: { port: 443, protocol: 'HTTPS' } },
      { source: 'redshift-1', target: 'quicksight-1', type: 'labeled', animated: true, data: { port: 5439, protocol: 'TCP' } },
      { source: 'athena-1', target: 'quicksight-1', type: 'labeled', animated: true, data: { port: 443, protocol: 'HTTPS' } }
    ]
  },

  {
    id: 'microservices',
    name: 'Microservices Architecture',
    description: 'ECS containers, service mesh, and event-driven communication',
    category: 'Microservices',
    thumbnail: '🐳',
    difficulty: 'Advanced',
    nodes: [
      {
        id: 'alb-2',
        type: 'awsService',
        position: { x: 50, y: 50 },
        data: {
          label: 'Application Load Balancer',
          serviceType: 'alb',
          color: '#8C4FFF',
          config: {
            hoursPerMonth: 730,
            lcuHours: 20,
            newConnections: 500000,
            processedBytes: 200
          }
        }
      },
      {
        id: 'ecs-1',
        type: 'awsService',
        position: { x: 50, y: 200 },
        data: {
          label: 'ECS User Service',
          serviceType: 'ecs',
          color: '#FF9900',
          config: {
            taskCount: 5,
            vCPU: 1,
            memoryGB: 2,
            hoursPerMonth: 730
          }
        }
      },
      {
        id: 'ecs-2',
        type: 'awsService',
        position: { x: 250, y: 200 },
        data: {
          label: 'ECS Order Service',
          serviceType: 'ecs',
          color: '#FF9900',
          config: {
            taskCount: 5,
            vCPU: 1,
            memoryGB: 2,
            hoursPerMonth: 730
          }
        }
      },
      {
        id: 'ecs-3',
        type: 'awsService',
        position: { x: 450, y: 200 },
        data: {
          label: 'ECS Payment Service',
          serviceType: 'ecs',
          color: '#FF9900',
          config: {
            taskCount: 3,
            vCPU: 1,
            memoryGB: 2,
            hoursPerMonth: 730
          }
        }
      },
      {
        id: 'sqs-1',
        type: 'awsService',
        position: { x: 150, y: 350 },
        data: {
          label: 'SQS Message Queue',
          serviceType: 'sqs',
          color: '#FF4F8B',
          config: {
            requestsMillions: 5,
            queueType: 'standard'
          }
        }
      },
      {
        id: 'dynamodb-2',
        type: 'awsService',
        position: { x: 50, y: 500 },
        data: {
          label: 'DynamoDB Users',
          serviceType: 'dynamodb',
          color: '#3B48CC',
          config: {
            readUnits: 50,
            writeUnits: 50,
            storageGB: 100,
            capacityMode: 'provisioned'
          }
        }
      },
      {
        id: 'rds-2',
        type: 'awsService',
        position: { x: 250, y: 500 },
        data: {
          label: 'RDS Orders',
          serviceType: 'rds',
          color: '#3B48CC',
          config: {
            instanceClass: 'db.t3.medium',
            engine: 'postgres',
            storageGB: 200,
            multiAZ: true
          }
        }
      },
      {
        id: 'elasticache-1',
        type: 'awsService',
        position: { x: 450, y: 500 },
        data: {
          label: 'ElastiCache Redis',
          serviceType: 'elasticache',
          color: '#C925D1',
          config: {
            nodeType: 'cache.r5.large',
            numNodes: 2,
            hoursPerMonth: 730
          }
        }
      }
    ],
    edges: [
      { source: 'alb-2', target: 'ecs-1', type: 'labeled', animated: true, data: { port: 80, protocol: 'HTTP' } },
      { source: 'alb-2', target: 'ecs-2', type: 'labeled', animated: true, data: { port: 80, protocol: 'HTTP' } },
      { source: 'alb-2', target: 'ecs-3', type: 'labeled', animated: true, data: { port: 80, protocol: 'HTTP' } },
      { source: 'ecs-1', target: 'dynamodb-2', type: 'labeled', animated: true, data: { port: 443, protocol: 'HTTPS' } },
      { source: 'ecs-2', target: 'rds-2', type: 'labeled', animated: true, data: { port: 5432, protocol: 'TCP' } },
      { source: 'ecs-2', target: 'sqs-1', type: 'labeled', animated: true, data: { port: 443, protocol: 'HTTPS' } },
      { source: 'ecs-3', target: 'elasticache-1', type: 'labeled', animated: true, data: { port: 6379, protocol: 'TCP' } },
      { source: 'ecs-1', target: 'ecs-2', type: 'labeled', animated: true, data: { port: 443, protocol: 'HTTPS' } },
      { source: 'ecs-2', target: 'ecs-3', type: 'labeled', animated: true, data: { port: 443, protocol: 'HTTPS' } }
    ]
  },

  {
    id: 'static-website',
    name: 'Static Website',
    description: 'Simple static site hosted on S3 with CloudFront CDN and Route53',
    category: 'Website',
    thumbnail: '🌐',
    difficulty: 'Beginner',
    nodes: [
      {
        id: 'route53-1',
        type: 'awsService',
        position: { x: 50, y: 50 },
        data: {
          label: 'Route 53 DNS',
          serviceType: 'route53',
          color: '#8C4FFF',
          config: {
            hostedZones: 1,
            queriesMillions: 1,
            healthChecks: 0
          }
        }
      },
      {
        id: 'cloudfront-3',
        type: 'awsService',
        position: { x: 50, y: 200 },
        data: {
          label: 'CloudFront CDN',
          serviceType: 'cloudfront',
          color: '#8C4FFF',
          config: {
            dataTransferGB: 100,
            requestsMillions: 1,
            httpRequests: true
          }
        }
      },
      {
        id: 's3-4',
        type: 'awsService',
        position: { x: 50, y: 350 },
        data: {
          label: 'S3 Website Bucket',
          serviceType: 's3',
          color: '#3F8624',
          config: {
            storageGB: 50,
            storageClass: 'STANDARD',
            putRequests: 1000,
            getRequests: 1000000,
            dataTransferOutGB: 100
          }
        }
      },
      {
        id: 'waf-1',
        type: 'awsService',
        position: { x: 250, y: 200 },
        data: {
          label: 'AWS WAF',
          serviceType: 'waf',
          color: '#DD344C',
          config: {
            webACLs: 1,
            rules: 5,
            requestsMillions: 1
          }
        }
      }
    ],
    edges: [
      { source: 'route53-1', target: 'cloudfront-3', type: 'labeled', animated: true, data: { port: 443, protocol: 'HTTPS' } },
      { source: 'cloudfront-3', target: 'waf-1', type: 'labeled', animated: true, data: { port: 443, protocol: 'HTTPS' } },
      { source: 'waf-1', target: 's3-4', type: 'labeled', animated: true, data: { port: 443, protocol: 'HTTPS' } }
    ]
  }
];

export const getTemplateById = (templateId) => {
  return architectureTemplates.find(t => t.id === templateId);
};

export const getTemplatesByCategory = (category) => {
  return architectureTemplates.filter(t => t.category === category);
};

export default architectureTemplates;
