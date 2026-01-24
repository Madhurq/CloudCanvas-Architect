// AWS Service definitions with pricing and connection rules
export const awsServices = {
  // ==================== COMPUTE ====================
  ec2: {
    id: 'ec2',
    name: 'EC2 Instance',
    category: 'compute',
    color: '#FF9900',
    icon: '🖥️',
    useCase: 'Virtual servers for full control over OS, scaling, and configurations',
    whenToUse: 'Need full OS access, custom software, or legacy app hosting',
    defaultConfig: {
      instanceType: 't3.medium',
      count: 1,
      hoursPerMonth: 730,
      os: 'linux',
      ebsStorage: 30
    },
    configFields: [
      { key: 'instanceType', label: 'Instance Type', type: 'select', options: ['t3.micro', 't3.small', 't3.medium', 't3.large', 't3.xlarge', 'm5.large', 'm5.xlarge'] },
      { key: 'count', label: 'Instance Count', type: 'number', min: 1, max: 100 },
      { key: 'hoursPerMonth', label: 'Hours/Month', type: 'number', min: 1, max: 730 },
      { key: 'os', label: 'Operating System', type: 'select', options: ['linux', 'windows'] },
      { key: 'ebsStorage', label: 'EBS Storage (GB)', type: 'number', min: 8, max: 16000 }
    ],
    allowedConnections: ['rds', 's3', 'elasticache', 'dynamodb', 'sqs', 'sns'],
    defaultPorts: { inbound: [80, 443, 22], outbound: [5432, 6379, 443] }
  },

  ecs: {
    id: 'ecs',
    name: 'ECS Fargate',
    category: 'compute',
    color: '#FF9900',
    icon: '🐳',
    useCase: 'Serverless containers - run Docker without managing servers',
    whenToUse: 'Containerized microservices without infrastructure management',
    defaultConfig: {
      taskCount: 2,
      vCPU: 0.5,
      memoryGB: 1,
      hoursPerMonth: 730
    },
    configFields: [
      { key: 'taskCount', label: 'Number of Tasks', type: 'number', min: 1, max: 100 },
      { key: 'vCPU', label: 'vCPU per Task', type: 'select', options: [0.25, 0.5, 1, 2, 4] },
      { key: 'memoryGB', label: 'Memory (GB) per Task', type: 'select', options: [0.5, 1, 2, 4, 8, 16] },
      { key: 'hoursPerMonth', label: 'Hours/Month', type: 'number', min: 1, max: 730 }
    ],
    allowedConnections: ['rds', 's3', 'elasticache', 'dynamodb', 'sqs', 'sns'],
    defaultPorts: { inbound: [80, 443, 8080], outbound: [5432, 6379, 443] }
  },

  lambda: {
    id: 'lambda',
    name: 'Lambda',
    category: 'compute',
    color: '#FF9900',
    icon: 'λ',
    useCase: 'Run code without servers - pay only when code executes',
    whenToUse: 'Event-driven, short tasks, APIs, automations (<15 min)',
    defaultConfig: {
      requestsPerMonth: 1000000,
      avgDurationMs: 200,
      memoryMB: 128
    },
    configFields: [
      { key: 'requestsPerMonth', label: 'Requests/Month', type: 'number', min: 0, max: 1000000000 },
      { key: 'avgDurationMs', label: 'Avg Duration (ms)', type: 'number', min: 1, max: 900000 },
      { key: 'memoryMB', label: 'Memory (MB)', type: 'select', options: [128, 256, 512, 1024, 2048, 4096, 10240] }
    ],
    allowedConnections: ['s3', 'dynamodb', 'rds', 'sqs', 'sns', 'eventbridge'],
    defaultPorts: { inbound: [], outbound: [443] }
  },

  apprunner: {
    id: 'apprunner',
    name: 'App Runner',
    category: 'compute',
    color: '#FF9900',
    icon: '🚀',
    useCase: 'Deploy containerized web apps with zero infrastructure config',
    whenToUse: 'Simple web apps/APIs without needing container orchestration',
    defaultConfig: {
      vCPU: 1,
      memoryGB: 2,
      provisionedInstances: 1,
      activeInstanceHours: 730
    },
    configFields: [
      { key: 'vCPU', label: 'vCPU', type: 'select', options: [0.25, 0.5, 1, 2, 4] },
      { key: 'memoryGB', label: 'Memory (GB)', type: 'select', options: [0.5, 1, 2, 4, 8, 12] },
      { key: 'provisionedInstances', label: 'Provisioned Instances', type: 'number', min: 1, max: 25 },
      { key: 'activeInstanceHours', label: 'Active Hours/Month', type: 'number', min: 0, max: 730 }
    ],
    allowedConnections: ['rds', 's3', 'dynamodb'],
    defaultPorts: { inbound: [443], outbound: [443, 5432] }
  },

  // ==================== STORAGE ====================
  s3: {
    id: 's3',
    name: 'S3 Bucket',
    category: 'storage',
    color: '#3F8624',
    icon: '🪣',
    useCase: 'Unlimited object storage for files, backups, static websites',
    whenToUse: 'Store files, images, videos, backups, or host static sites',
    defaultConfig: {
      storageGB: 100,
      storageClass: 'STANDARD',
      putRequests: 100000,
      getRequests: 1000000,
      dataTransferOutGB: 50
    },
    configFields: [
      { key: 'storageGB', label: 'Storage (GB)', type: 'number', min: 1, max: 100000 },
      { key: 'storageClass', label: 'Storage Class', type: 'select', options: ['STANDARD', 'STANDARD_IA', 'GLACIER', 'DEEP_ARCHIVE'] },
      { key: 'putRequests', label: 'PUT Requests/Month', type: 'number', min: 0, max: 100000000 },
      { key: 'getRequests', label: 'GET Requests/Month', type: 'number', min: 0, max: 100000000 },
      { key: 'dataTransferOutGB', label: 'Data Transfer Out (GB)', type: 'number', min: 0, max: 100000 }
    ],
    allowedConnections: [],
    defaultPorts: { inbound: [443], outbound: [] }
  },

  efs: {
    id: 'efs',
    name: 'EFS',
    category: 'storage',
    color: '#3F8624',
    icon: '📁',
    useCase: 'Elastic file system shared across multiple EC2/ECS instances',
    whenToUse: 'Shared file storage for multiple compute instances (NFS)',
    defaultConfig: {
      storageGB: 100,
      storageClass: 'STANDARD',
      throughputMode: 'bursting'
    },
    configFields: [
      { key: 'storageGB', label: 'Storage (GB)', type: 'number', min: 1, max: 100000 },
      { key: 'storageClass', label: 'Storage Class', type: 'select', options: ['STANDARD', 'INFREQUENT_ACCESS'] },
      { key: 'throughputMode', label: 'Throughput Mode', type: 'select', options: ['bursting', 'provisioned'] }
    ],
    allowedConnections: [],
    defaultPorts: { inbound: [2049], outbound: [] }
  },

  // ==================== DATABASE ====================
  rds: {
    id: 'rds',
    name: 'RDS Database',
    category: 'database',
    color: '#3B48CC',
    icon: '🗄️',
    useCase: 'Managed relational databases (PostgreSQL, MySQL, MariaDB)',
    whenToUse: 'Traditional SQL workloads with ACID compliance needed',
    defaultConfig: {
      instanceClass: 'db.t3.small',
      engine: 'postgres',
      storageGB: 100,
      multiAZ: false
    },
    configFields: [
      { key: 'instanceClass', label: 'Instance Class', type: 'select', options: ['db.t3.micro', 'db.t3.small', 'db.t3.medium', 'db.t3.large', 'db.r5.large'] },
      { key: 'engine', label: 'Database Engine', type: 'select', options: ['postgres', 'mysql', 'mariadb'] },
      { key: 'storageGB', label: 'Storage (GB)', type: 'number', min: 20, max: 65536 },
      { key: 'multiAZ', label: 'Multi-AZ Deployment', type: 'boolean' }
    ],
    allowedConnections: [],
    defaultPorts: { inbound: [5432, 3306], outbound: [] }
  },

  dynamodb: {
    id: 'dynamodb',
    name: 'DynamoDB',
    category: 'database',
    color: '#3B48CC',
    icon: '⚡',
    useCase: 'Serverless NoSQL database with single-digit ms latency',
    whenToUse: 'Key-value/document data, high scale, serverless apps',
    defaultConfig: {
      readUnits: 25,
      writeUnits: 25,
      storageGB: 25,
      capacityMode: 'provisioned'
    },
    configFields: [
      { key: 'capacityMode', label: 'Capacity Mode', type: 'select', options: ['provisioned', 'on-demand'] },
      { key: 'readUnits', label: 'Read Capacity Units', type: 'number', min: 1, max: 40000 },
      { key: 'writeUnits', label: 'Write Capacity Units', type: 'number', min: 1, max: 40000 },
      { key: 'storageGB', label: 'Storage (GB)', type: 'number', min: 1, max: 100000 }
    ],
    allowedConnections: [],
    defaultPorts: { inbound: [443], outbound: [] }
  },

  elasticache: {
    id: 'elasticache',
    name: 'ElastiCache Redis',
    category: 'database',
    color: '#C925D1',
    icon: '🔴',
    useCase: 'In-memory caching for microsecond response times',
    whenToUse: 'Session storage, caching, real-time leaderboards',
    defaultConfig: {
      nodeType: 'cache.t3.micro',
      numNodes: 1,
      hoursPerMonth: 730
    },
    configFields: [
      { key: 'nodeType', label: 'Node Type', type: 'select', options: ['cache.t3.micro', 'cache.t3.small', 'cache.t3.medium', 'cache.r5.large'] },
      { key: 'numNodes', label: 'Number of Nodes', type: 'number', min: 1, max: 6 },
      { key: 'hoursPerMonth', label: 'Hours/Month', type: 'number', min: 1, max: 730 }
    ],
    allowedConnections: [],
    defaultPorts: { inbound: [6379], outbound: [] }
  },

  aurora: {
    id: 'aurora',
    name: 'Aurora Serverless',
    category: 'database',
    color: '#3B48CC',
    icon: '🌟',
    useCase: 'Auto-scaling managed MySQL/PostgreSQL (5x faster than RDS)',
    whenToUse: 'Variable workloads, dev/test, auto-scaling SQL needs',
    defaultConfig: {
      engine: 'aurora-postgresql',
      acuMin: 0.5,
      acuMax: 16,
      storageGB: 100
    },
    configFields: [
      { key: 'engine', label: 'Engine', type: 'select', options: ['aurora-postgresql', 'aurora-mysql'] },
      { key: 'acuMin', label: 'Min ACUs', type: 'select', options: [0.5, 1, 2, 4, 8, 16] },
      { key: 'acuMax', label: 'Max ACUs', type: 'select', options: [1, 2, 4, 8, 16, 32, 64, 128] },
      { key: 'storageGB', label: 'Storage (GB)', type: 'number', min: 10, max: 128000 }
    ],
    allowedConnections: [],
    defaultPorts: { inbound: [5432, 3306], outbound: [] }
  },

  // ==================== NETWORKING ====================
  alb: {
    id: 'alb',
    name: 'Application Load Balancer',
    category: 'networking',
    color: '#8C4FFF',
    icon: '⚖️',
    useCase: 'Distribute HTTP/HTTPS traffic across multiple targets',
    whenToUse: 'Web apps needing path-based routing, TLS termination',
    defaultConfig: {
      hoursPerMonth: 730,
      lcuHours: 10,
      newConnections: 100000,
      processedBytes: 50
    },
    configFields: [
      { key: 'hoursPerMonth', label: 'Hours/Month', type: 'number', min: 1, max: 730 },
      { key: 'lcuHours', label: 'LCU-Hours/Hour', type: 'number', min: 0, max: 1000 },
      { key: 'newConnections', label: 'New Connections/Month', type: 'number', min: 0, max: 100000000 },
      { key: 'processedBytes', label: 'Processed Data (GB)', type: 'number', min: 0, max: 100000 }
    ],
    allowedConnections: ['ec2', 'ecs', 'lambda'],
    defaultPorts: { inbound: [80, 443], outbound: [80, 8080] }
  },

  cloudfront: {
    id: 'cloudfront',
    name: 'CloudFront CDN',
    category: 'networking',
    color: '#8C4FFF',
    icon: '🌐',
    useCase: 'Global CDN for low-latency content delivery',
    whenToUse: 'Static assets, global users, DDoS protection, edge caching',
    defaultConfig: {
      dataTransferGB: 100,
      requestsMillions: 1,
      httpRequests: true
    },
    configFields: [
      { key: 'dataTransferGB', label: 'Data Transfer (GB)', type: 'number', min: 0, max: 1000000 },
      { key: 'requestsMillions', label: 'Requests (Millions)', type: 'number', min: 0, max: 10000 },
      { key: 'httpRequests', label: 'HTTP/HTTPS Requests', type: 'boolean' }
    ],
    allowedConnections: ['s3', 'alb', 'ec2', 'apigateway'],
    defaultPorts: { inbound: [443], outbound: [443, 80] }
  },

  apigateway: {
    id: 'apigateway',
    name: 'API Gateway',
    category: 'networking',
    color: '#8C4FFF',
    icon: '🚪',
    useCase: 'Managed API endpoint with throttling, auth, and caching',
    whenToUse: 'REST/WebSocket APIs, Lambda integration, API management',
    defaultConfig: {
      requestsMillions: 1,
      apiType: 'REST',
      cachingEnabled: false
    },
    configFields: [
      { key: 'requestsMillions', label: 'Requests (Millions)', type: 'number', min: 0, max: 10000 },
      { key: 'apiType', label: 'API Type', type: 'select', options: ['REST', 'HTTP', 'WebSocket'] },
      { key: 'cachingEnabled', label: 'Enable Caching', type: 'boolean' }
    ],
    allowedConnections: ['lambda', 'ec2', 'ecs'],
    defaultPorts: { inbound: [443], outbound: [443] }
  },

  route53: {
    id: 'route53',
    name: 'Route 53',
    category: 'networking',
    color: '#8C4FFF',
    icon: '🌍',
    useCase: 'Scalable DNS and domain registration',
    whenToUse: 'Custom domains, DNS routing, health checks, failover',
    defaultConfig: {
      hostedZones: 1,
      queriesMillions: 1,
      healthChecks: 2
    },
    configFields: [
      { key: 'hostedZones', label: 'Hosted Zones', type: 'number', min: 1, max: 500 },
      { key: 'queriesMillions', label: 'Queries (Millions)', type: 'number', min: 0, max: 10000 },
      { key: 'healthChecks', label: 'Health Checks', type: 'number', min: 0, max: 200 }
    ],
    allowedConnections: ['cloudfront', 'alb', 'ec2', 's3'],
    defaultPorts: { inbound: [53], outbound: [] }
  },

  natgateway: {
    id: 'natgateway',
    name: 'NAT Gateway',
    category: 'networking',
    color: '#8C4FFF',
    icon: '🚧',
    useCase: 'Allow private subnets to access internet securely',
    whenToUse: 'Private instances need outbound internet (updates, APIs)',
    defaultConfig: {
      hoursPerMonth: 730,
      dataProcessedGB: 100
    },
    configFields: [
      { key: 'hoursPerMonth', label: 'Hours/Month', type: 'number', min: 1, max: 730 },
      { key: 'dataProcessedGB', label: 'Data Processed (GB)', type: 'number', min: 0, max: 100000 }
    ],
    allowedConnections: [],
    defaultPorts: { inbound: [], outbound: [443, 80] }
  },

  // ==================== MESSAGING ====================
  sqs: {
    id: 'sqs',
    name: 'SQS Queue',
    category: 'messaging',
    color: '#FF4F8B',
    icon: '📬',
    useCase: 'Fully managed message queue for decoupling services',
    whenToUse: 'Async processing, decoupling microservices, job queues',
    defaultConfig: {
      requestsMillions: 1,
      queueType: 'standard'
    },
    configFields: [
      { key: 'requestsMillions', label: 'Requests (Millions)', type: 'number', min: 0, max: 100000 },
      { key: 'queueType', label: 'Queue Type', type: 'select', options: ['standard', 'fifo'] }
    ],
    allowedConnections: ['lambda', 'ec2', 'ecs'],
    defaultPorts: { inbound: [443], outbound: [] }
  },

  sns: {
    id: 'sns',
    name: 'SNS Topic',
    category: 'messaging',
    color: '#FF4F8B',
    icon: '📢',
    useCase: 'Pub/Sub messaging and mobile push notifications',
    whenToUse: 'Fan-out messaging, event notifications, mobile push',
    defaultConfig: {
      publishRequests: 1000000,
      deliveries: 1000000,
      deliveryType: 'sqs'
    },
    configFields: [
      { key: 'publishRequests', label: 'Publish Requests', type: 'number', min: 0, max: 100000000 },
      { key: 'deliveries', label: 'Deliveries', type: 'number', min: 0, max: 100000000 },
      { key: 'deliveryType', label: 'Delivery Type', type: 'select', options: ['sqs', 'lambda', 'http', 'email', 'sms'] }
    ],
    allowedConnections: ['sqs', 'lambda'],
    defaultPorts: { inbound: [443], outbound: [] }
  },

  eventbridge: {
    id: 'eventbridge',
    name: 'EventBridge',
    category: 'messaging',
    color: '#FF4F8B',
    icon: '🔔',
    useCase: 'Serverless event bus for event-driven architectures',
    whenToUse: 'Cross-service events, scheduled tasks, SaaS integrations',
    defaultConfig: {
      eventsPerMonth: 1000000,
      customBus: false
    },
    configFields: [
      { key: 'eventsPerMonth', label: 'Events/Month', type: 'number', min: 0, max: 100000000 },
      { key: 'customBus', label: 'Custom Event Bus', type: 'boolean' }
    ],
    allowedConnections: ['lambda', 'sqs', 'sns'],
    defaultPorts: { inbound: [443], outbound: [] }
  },

  // ==================== SECURITY ====================
  waf: {
    id: 'waf',
    name: 'AWS WAF',
    category: 'security',
    color: '#DD344C',
    icon: '🛡️',
    useCase: 'Web application firewall against common exploits',
    whenToUse: 'Protect against SQL injection, XSS, DDoS, bad bots',
    defaultConfig: {
      webACLs: 1,
      rules: 10,
      requestsMillions: 1
    },
    configFields: [
      { key: 'webACLs', label: 'Web ACLs', type: 'number', min: 1, max: 100 },
      { key: 'rules', label: 'Rules per ACL', type: 'number', min: 0, max: 100 },
      { key: 'requestsMillions', label: 'Requests (Millions)', type: 'number', min: 0, max: 10000 }
    ],
    allowedConnections: ['cloudfront', 'alb', 'apigateway'],
    defaultPorts: { inbound: [443], outbound: [443] }
  },

  cognito: {
    id: 'cognito',
    name: 'Cognito',
    category: 'security',
    color: '#DD344C',
    icon: '👤',
    useCase: 'User authentication, authorization, and user management',
    whenToUse: 'User sign-up/sign-in, social login, OAuth/OIDC',
    defaultConfig: {
      monthlyActiveUsers: 1000,
      advancedSecurity: false
    },
    configFields: [
      { key: 'monthlyActiveUsers', label: 'Monthly Active Users', type: 'number', min: 0, max: 10000000 },
      { key: 'advancedSecurity', label: 'Advanced Security', type: 'boolean' }
    ],
    allowedConnections: ['apigateway', 'alb', 'lambda'],
    defaultPorts: { inbound: [443], outbound: [] }
  },

  secrets: {
    id: 'secrets',
    name: 'Secrets Manager',
    category: 'security',
    color: '#DD344C',
    icon: '🔐',
    useCase: 'Securely store and rotate secrets, API keys, passwords',
    whenToUse: 'Database credentials, API keys, automatic rotation',
    defaultConfig: {
      secretsCount: 10,
      apiCallsPerMonth: 10000
    },
    configFields: [
      { key: 'secretsCount', label: 'Number of Secrets', type: 'number', min: 1, max: 1000 },
      { key: 'apiCallsPerMonth', label: 'API Calls/Month', type: 'number', min: 0, max: 10000000 }
    ],
    allowedConnections: [],
    defaultPorts: { inbound: [], outbound: [] }
  },

  // ==================== ANALYTICS ====================
  kinesis: {
    id: 'kinesis',
    name: 'Kinesis Data Streams',
    category: 'analytics',
    color: '#A166FF',
    icon: '🌊',
    useCase: 'Real-time data streaming at massive scale',
    whenToUse: 'Real-time analytics, log processing, IoT data ingestion',
    defaultConfig: {
      shards: 2,
      hoursPerMonth: 730,
      dataIngestionGB: 100
    },
    configFields: [
      { key: 'shards', label: 'Number of Shards', type: 'number', min: 1, max: 500 },
      { key: 'hoursPerMonth', label: 'Hours/Month', type: 'number', min: 1, max: 730 },
      { key: 'dataIngestionGB', label: 'Data Ingestion (GB)', type: 'number', min: 0, max: 100000 }
    ],
    allowedConnections: ['lambda', 's3'],
    defaultPorts: { inbound: [443], outbound: [] }
  },

  opensearch: {
    id: 'opensearch',
    name: 'OpenSearch',
    category: 'analytics',
    color: '#A166FF',
    icon: '🔍',
    useCase: 'Search, log analytics, and visualization (ELK alternative)',
    whenToUse: 'Full-text search, log analysis, application monitoring',
    defaultConfig: {
      instanceType: 't3.small.search',
      instanceCount: 2,
      storageGB: 100
    },
    configFields: [
      { key: 'instanceType', label: 'Instance Type', type: 'select', options: ['t3.small.search', 't3.medium.search', 'm5.large.search', 'r5.large.search'] },
      { key: 'instanceCount', label: 'Instance Count', type: 'number', min: 1, max: 80 },
      { key: 'storageGB', label: 'Storage (GB)', type: 'number', min: 10, max: 15000 }
    ],
    allowedConnections: [],
    defaultPorts: { inbound: [443, 9200], outbound: [] }
  },

  athena: {
    id: 'athena',
    name: 'Athena',
    category: 'analytics',
    color: '#A166FF',
    icon: '📊',
    useCase: 'Serverless SQL queries directly on S3 data',
    whenToUse: 'Ad-hoc queries on data lake, no ETL needed',
    defaultConfig: {
      dataScannedTB: 1
    },
    configFields: [
      { key: 'dataScannedTB', label: 'Data Scanned (TB/Month)', type: 'number', min: 0, max: 1000 }
    ],
    allowedConnections: ['s3'],
    defaultPorts: { inbound: [], outbound: [443] }
  },

  // ==================== NEW ANALYTICS SERVICES ====================
  redshift: {
    id: 'redshift',
    name: 'Redshift',
    category: 'analytics',
    color: '#A166FF',
    icon: '🏗️',
    useCase: 'Data warehouse for petabyte-scale analytics',
    whenToUse: 'Large-scale data warehousing, business intelligence',
    defaultConfig: {
      nodeType: 'ra3.xlplus',
      numNodes: 2,
      hoursPerMonth: 730,
      storageGB: 2000
    },
    configFields: [
      { key: 'nodeType', label: 'Node Type', type: 'select', options: ['ra3.xlplus', 'ra3.4xlarge', 'ra3.16xlarge', 'dc2.large', 'dc2.8xlarge'] },
      { key: 'numNodes', label: 'Number of Nodes', type: 'number', min: 1, max: 128 },
      { key: 'hoursPerMonth', label: 'Hours/Month', type: 'number', min: 1, max: 730 },
      { key: 'storageGB', label: 'Storage (GB)', type: 'number', min: 100, max: 100000 }
    ],
    allowedConnections: ['s3', 'athena', 'kinesis'],
    defaultPorts: { inbound: [5439], outbound: [443] }
  },

  quicksight: {
    id: 'quicksight',
    name: 'QuickSight',
    category: 'analytics',
    color: '#A166FF',
    icon: '📈',
    useCase: 'Business intelligence and data visualization',
    whenToUse: 'Dashboards, reports, self-service analytics',
    defaultConfig: {
      userType: 'reader',
      users: 10,
      sessions: 1000
    },
    configFields: [
      { key: 'userType', label: 'User Type', type: 'select', options: ['reader', 'author', 'admin'] },
      { key: 'users', label: 'Number of Users', type: 'number', min: 1, max: 10000 },
      { key: 'sessions', label: 'Sessions/Month', type: 'number', min: 0, max: 1000000 }
    ],
    allowedConnections: ['redshift', 'rds', 's3', 'dynamodb', 'athena'],
    defaultPorts: { inbound: [443], outbound: [443] }
  },

  emr: {
    id: 'emr',
    name: 'EMR (Elastic MapReduce)',
    category: 'analytics',
    color: '#A166FF',
    icon: '⚙️',
    useCase: 'Managed Hadoop/Spark for big data processing',
    whenToUse: 'Big data processing, machine learning, data transformation',
    defaultConfig: {
      masterInstanceType: 'm5.xlarge',
      coreNodes: 2,
      taskNodes: 0,
      hoursPerMonth: 168
    },
    configFields: [
      { key: 'masterInstanceType', label: 'Master Instance Type', type: 'select', options: ['m5.xlarge', 'm5.2xlarge', 'r5.xlarge', 'r5.2xlarge'] },
      { key: 'coreNodes', label: 'Core Nodes', type: 'number', min: 1, max: 100 },
      { key: 'taskNodes', label: 'Task Nodes', type: 'number', min: 0, max: 1000 },
      { key: 'hoursPerMonth', label: 'Hours/Month', type: 'number', min: 1, max: 730 }
    ],
    allowedConnections: ['s3', 'dynamodb', 'rds'],
    defaultPorts: { inbound: [22, 443], outbound: [443] }
  },

  glue: {
    id: 'glue',
    name: 'Glue',
    category: 'analytics',
    color: '#A166FF',
    icon: '🔗',
    useCase: 'Serverless ETL (Extract, Transform, Load) service',
    whenToUse: 'Data integration, transformation, catalog management',
    defaultConfig: {
      dpuHours: 100,
      crawlerHours: 10,
      numCrawlers: 2
    },
    configFields: [
      { key: 'dpuHours', label: 'DPU-Hours/Month', type: 'number', min: 0, max: 10000 },
      { key: 'crawlerHours', label: 'Crawler-Hours/Month', type: 'number', min: 0, max: 1000 },
      { key: 'numCrawlers', label: 'Number of Crawlers', type: 'number', min: 0, max: 100 }
    ],
    allowedConnections: ['s3', 'rds', 'dynamodb', 'redshift'],
    defaultPorts: { inbound: [443], outbound: [443] }
  },

  // ==================== NEW COMPUTE SERVICES ====================
  eks: {
    id: 'eks',
    name: 'EKS (Kubernetes)',
    category: 'compute',
    color: '#FF9900',
    icon: '☸️',
    useCase: 'Managed Kubernetes for container orchestration',
    whenToUse: 'Complex microservices, multi-container workloads',
    defaultConfig: {
      nodeGroupType: 't3.medium',
      numNodes: 3,
      clusterCount: 1,
      hoursPerMonth: 730
    },
    configFields: [
      { key: 'nodeGroupType', label: 'Node Type', type: 'select', options: ['t3.medium', 't3.large', 'm5.large', 'm5.xlarge', 'c5.large'] },
      { key: 'numNodes', label: 'Number of Nodes', type: 'number', min: 1, max: 500 },
      { key: 'clusterCount', label: 'Number of Clusters', type: 'number', min: 1, max: 10 },
      { key: 'hoursPerMonth', label: 'Hours/Month', type: 'number', min: 1, max: 730 }
    ],
    allowedConnections: ['rds', 's3', 'elasticache', 'dynamodb'],
    defaultPorts: { inbound: [443, 6443], outbound: [443, 6379, 5432] }
  },

  batch: {
    id: 'batch',
    name: 'AWS Batch',
    category: 'compute',
    color: '#FF9900',
    icon: '📦',
    useCase: 'Managed batch computing for large-scale parallel jobs',
    whenToUse: 'Scientific computing, rendering, data processing',
    defaultConfig: {
      computeInstanceType: 't3.medium',
      maxvCPUs: 256,
      jobsPerMonth: 1000
    },
    configFields: [
      { key: 'computeInstanceType', label: 'Compute Instance Type', type: 'select', options: ['t3.medium', 't3.large', 'c5.large', 'c5.2xlarge', 'm5.large'] },
      { key: 'maxvCPUs', label: 'Max vCPUs', type: 'number', min: 1, max: 256 },
      { key: 'jobsPerMonth', label: 'Jobs/Month', type: 'number', min: 0, max: 1000000 }
    ],
    allowedConnections: ['s3', 'dynamodb', 'ec2'],
    defaultPorts: { inbound: [], outbound: [443, 80] }
  },

  lightsail: {
    id: 'lightsail',
    name: 'Lightsail',
    category: 'compute',
    color: '#FF9900',
    icon: '💡',
    useCase: 'Simple virtual servers for beginners and small apps',
    whenToUse: 'WordPress, web apps, development, simple workloads',
    defaultConfig: {
      bundleSize: 'small',
      instanceCount: 1,
      hoursPerMonth: 730,
      staticIP: false
    },
    configFields: [
      { key: 'bundleSize', label: 'Bundle Size', type: 'select', options: ['small', 'medium', 'large', 'xlarge', '2xlarge'] },
      { key: 'instanceCount', label: 'Instance Count', type: 'number', min: 1, max: 20 },
      { key: 'hoursPerMonth', label: 'Hours/Month', type: 'number', min: 1, max: 730 },
      { key: 'staticIP', label: 'Static IP Addresses', type: 'boolean' }
    ],
    allowedConnections: ['s3', 'rds'],
    defaultPorts: { inbound: [80, 443, 22], outbound: [80, 443] }
  },

  // ==================== NEW MESSAGING SERVICES ====================
  msk: {
    id: 'msk',
    name: 'MSK (Managed Kafka)',
    category: 'messaging',
    color: '#FF4F8B',
    icon: '🚀',
    useCase: 'Managed Apache Kafka for streaming data pipelines',
    whenToUse: 'Real-time data streaming, event streaming, data integration',
    defaultConfig: {
      brokerNodeType: 'kafka.m5.large',
      brokerCount: 3,
      storageGB: 1000,
      hoursPerMonth: 730
    },
    configFields: [
      { key: 'brokerNodeType', label: 'Broker Node Type', type: 'select', options: ['kafka.m5.large', 'kafka.m5.xlarge', 'kafka.m5.2xlarge', 'kafka.m7g.large'] },
      { key: 'brokerCount', label: 'Number of Brokers', type: 'number', min: 1, max: 30 },
      { key: 'storageGB', label: 'Storage per Broker (GB)', type: 'number', min: 100, max: 16000 },
      { key: 'hoursPerMonth', label: 'Hours/Month', type: 'number', min: 1, max: 730 }
    ],
    allowedConnections: ['lambda', 'kinesis', 'ec2', 'ecs'],
    defaultPorts: { inbound: [9092, 9094], outbound: [] }
  },

  mq: {
    id: 'mq',
    name: 'Amazon MQ',
    category: 'messaging',
    color: '#FF4F8B',
    icon: '📨',
    useCase: 'Managed message broker (RabbitMQ/ActiveMQ)',
    whenToUse: 'Traditional messaging, microservice communication',
    defaultConfig: {
      brokerType: 'ACTIVE_MQ',
      instanceType: 'mq.t3.micro',
      brokerCount: 1,
      storageGB: 20
    },
    configFields: [
      { key: 'brokerType', label: 'Broker Type', type: 'select', options: ['ACTIVE_MQ', 'RABBITMQ'] },
      { key: 'instanceType', label: 'Instance Type', type: 'select', options: ['mq.t3.micro', 'mq.t3.small', 'mq.m5.large', 'mq.m5.xlarge'] },
      { key: 'brokerCount', label: 'Broker Count', type: 'number', min: 1, max: 1 },
      { key: 'storageGB', label: 'Storage (GB)', type: 'number', min: 20, max: 500 }
    ],
    allowedConnections: ['lambda', 'ec2', 'ecs'],
    defaultPorts: { inbound: [5671, 61614], outbound: [] }
  },

  // ==================== NEW SECURITY SERVICES ====================
  guardduty: {
    id: 'guardduty',
    name: 'GuardDuty',
    category: 'security',
    color: '#DD344C',
    icon: '👁️',
    useCase: 'Threat detection using machine learning',
    whenToUse: 'Continuous monitoring, threat detection, compliance',
    defaultConfig: {
      accountsMonitored: 1,
      sourcesEnabled: ['cloudtrail', 'vpcflow', 'dnsqueries'],
      hoursPerMonth: 730
    },
    configFields: [
      { key: 'accountsMonitored', label: 'Accounts Monitored', type: 'number', min: 1, max: 1000 },
      { key: 'sourcesEnabled', label: 'Findings/Month', type: 'number', min: 0, max: 10000 },
      { key: 'hoursPerMonth', label: 'Hours/Month', type: 'number', min: 1, max: 730 }
    ],
    allowedConnections: ['cloudtrail'],
    defaultPorts: { inbound: [], outbound: [443] }
  },

  config: {
    id: 'config',
    name: 'AWS Config',
    category: 'security',
    color: '#DD344C',
    icon: '⚙️',
    useCase: 'Track AWS resource configuration changes',
    whenToUse: 'Compliance monitoring, configuration tracking, auditing',
    defaultConfig: {
      recordedResources: 100,
      configRules: 10,
      hoursPerMonth: 730
    },
    configFields: [
      { key: 'recordedResources', label: 'Recorded Resources', type: 'number', min: 1, max: 10000 },
      { key: 'configRules', label: 'Config Rules', type: 'number', min: 0, max: 300 },
      { key: 'hoursPerMonth', label: 'Hours/Month', type: 'number', min: 1, max: 730 }
    ],
    allowedConnections: ['s3'],
    defaultPorts: { inbound: [], outbound: [443] }
  },

  cloudtrail: {
    id: 'cloudtrail',
    name: 'CloudTrail',
    category: 'security',
    color: '#DD344C',
    icon: '📝',
    useCase: 'Audit API activity and compliance logging',
    whenToUse: 'Compliance auditing, troubleshooting, security analysis',
    defaultConfig: {
      eventsPerGBStorageMonth: 1,
      hoursPerMonth: 730
    },
    configFields: [
      { key: 'eventsPerGBStorageMonth', label: 'Data Events Enabled', type: 'boolean' },
      { key: 'hoursPerMonth', label: 'Hours/Month', type: 'number', min: 1, max: 730 }
    ],
    allowedConnections: ['s3', 'cloudwatch', 'sns'],
    defaultPorts: { inbound: [], outbound: [443] }
  },

  ssm: {
    id: 'ssm',
    name: 'Systems Manager',
    category: 'security',
    color: '#DD344C',
    icon: '🔧',
    useCase: 'Unified management of AWS and on-premises resources',
    whenToUse: 'Fleet management, patching, parameter storage',
    defaultConfig: {
      instancesManaged: 10,
      patchGroups: 5,
      parametersStored: 100
    },
    configFields: [
      { key: 'instancesManaged', label: 'Instances Managed', type: 'number', min: 0, max: 10000 },
      { key: 'patchGroups', label: 'Patch Groups', type: 'number', min: 0, max: 100 },
      { key: 'parametersStored', label: 'Parameters Stored', type: 'number', min: 0, max: 10000 }
    ],
    allowedConnections: ['ec2', 'ecs'],
    defaultPorts: { inbound: [], outbound: [443] }
  },

  acm: {
    id: 'acm',
    name: 'Certificate Manager',
    category: 'security',
    color: '#DD344C',
    icon: '🔒',
    useCase: 'Provision and manage SSL/TLS certificates',
    whenToUse: 'HTTPS, TLS termination, certificate automation',
    defaultConfig: {
      publicCertificates: 5,
      privateCA: false
    },
    configFields: [
      { key: 'publicCertificates', label: 'Public Certificates', type: 'number', min: 0, max: 1000 },
      { key: 'privateCA', label: 'Private Certificate Authority', type: 'boolean' }
    ],
    allowedConnections: ['cloudfront', 'alb', 'apigateway'],
    defaultPorts: { inbound: [443], outbound: [443] }
  }
};

// Connection port suggestions based on source -> target
export const connectionDefaults = {
  'alb->ec2': { port: 80, protocol: 'HTTP' },
  'alb->ecs': { port: 80, protocol: 'HTTP' },
  'alb->lambda': { port: 443, protocol: 'HTTPS' },
  'cloudfront->alb': { port: 443, protocol: 'HTTPS' },
  'cloudfront->s3': { port: 443, protocol: 'HTTPS' },
  'cloudfront->apigateway': { port: 443, protocol: 'HTTPS' },
  'ec2->rds': { port: 5432, protocol: 'TCP' },
  'ec2->s3': { port: 443, protocol: 'HTTPS' },
  'ec2->elasticache': { port: 6379, protocol: 'TCP' },
  'ec2->dynamodb': { port: 443, protocol: 'HTTPS' },
  'ec2->sqs': { port: 443, protocol: 'HTTPS' },
  'ec2->sns': { port: 443, protocol: 'HTTPS' },
  'ecs->rds': { port: 5432, protocol: 'TCP' },
  'ecs->s3': { port: 443, protocol: 'HTTPS' },
  'ecs->elasticache': { port: 6379, protocol: 'TCP' },
  'ecs->dynamodb': { port: 443, protocol: 'HTTPS' },
  'ecs->sqs': { port: 443, protocol: 'HTTPS' },
  'lambda->dynamodb': { port: 443, protocol: 'HTTPS' },
  'lambda->s3': { port: 443, protocol: 'HTTPS' },
  'lambda->rds': { port: 5432, protocol: 'TCP' },
  'lambda->sqs': { port: 443, protocol: 'HTTPS' },
  'lambda->sns': { port: 443, protocol: 'HTTPS' },
  'apigateway->lambda': { port: 443, protocol: 'HTTPS' },
  'apigateway->ec2': { port: 80, protocol: 'HTTP' },
  'apigateway->ecs': { port: 80, protocol: 'HTTP' },
  'sqs->lambda': { port: 443, protocol: 'HTTPS' },
  'sns->lambda': { port: 443, protocol: 'HTTPS' },
  'sns->sqs': { port: 443, protocol: 'HTTPS' },
  'eventbridge->lambda': { port: 443, protocol: 'HTTPS' },
  'eventbridge->sqs': { port: 443, protocol: 'HTTPS' },
  'kinesis->lambda': { port: 443, protocol: 'HTTPS' },
  'kinesis->s3': { port: 443, protocol: 'HTTPS' },
  'waf->cloudfront': { port: 443, protocol: 'HTTPS' },
  'waf->alb': { port: 443, protocol: 'HTTPS' },
  'waf->apigateway': { port: 443, protocol: 'HTTPS' },
  'route53->cloudfront': { port: 443, protocol: 'HTTPS' },
  'route53->alb': { port: 443, protocol: 'HTTPS' },
  'route53->s3': { port: 443, protocol: 'HTTPS' },
  'cognito->apigateway': { port: 443, protocol: 'HTTPS' },
  'cognito->alb': { port: 443, protocol: 'HTTPS' },
  'athena->s3': { port: 443, protocol: 'HTTPS' },
  'apprunner->rds': { port: 5432, protocol: 'TCP' },
  'apprunner->dynamodb': { port: 443, protocol: 'HTTPS' },
  // Phase 2: New services
  'redshift->s3': { port: 443, protocol: 'HTTPS' },
  'quicksight->redshift': { port: 5439, protocol: 'TCP' },
  'quicksight->rds': { port: 5432, protocol: 'TCP' },
  'emr->s3': { port: 443, protocol: 'HTTPS' },
  'emr->dynamodb': { port: 443, protocol: 'HTTPS' },
  'glue->s3': { port: 443, protocol: 'HTTPS' },
  'glue->rds': { port: 5432, protocol: 'TCP' },
  'eks->rds': { port: 5432, protocol: 'TCP' },
  'eks->dynamodb': { port: 443, protocol: 'HTTPS' },
  'eks->elasticache': { port: 6379, protocol: 'TCP' },
  'batch->s3': { port: 443, protocol: 'HTTPS' },
  'lightsail->rds': { port: 5432, protocol: 'TCP' },
  'msk->lambda': { port: 443, protocol: 'HTTPS' },
  'msk->kinesis': { port: 443, protocol: 'HTTPS' },
  'mq->lambda': { port: 443, protocol: 'HTTPS' },
  'mq->ec2': { port: 5671, protocol: 'TCP' },
  'config->s3': { port: 443, protocol: 'HTTPS' },
  'cloudtrail->s3': { port: 443, protocol: 'HTTPS' },
  'guardduty->s3': { port: 443, protocol: 'HTTPS' },
  'ssm->ec2': { port: 443, protocol: 'HTTPS' },
  'acm->cloudfront': { port: 443, protocol: 'HTTPS' },
  'acm->alb': { port: 443, protocol: 'HTTPS' },
};

export const getConnectionDefault = (sourceType, targetType) => {
  const key = `${sourceType}->${targetType}`;
  return connectionDefaults[key] || { port: 443, protocol: 'HTTPS' };
};

export const serviceCategories = [
  { id: 'compute', name: 'Compute', color: '#FF9900' },
  { id: 'storage', name: 'Storage', color: '#3F8624' },
  { id: 'database', name: 'Database', color: '#3B48CC' },
  { id: 'networking', name: 'Networking', color: '#8C4FFF' },
  { id: 'messaging', name: 'Messaging', color: '#FF4F8B' },
  { id: 'security', name: 'Security', color: '#DD344C' },
  { id: 'analytics', name: 'Analytics', color: '#A166FF' },
  { id: 'infrastructure', name: 'Infrastructure', color: '#232F3E' }
];

// Container/Group type definitions
export const containerTypes = {
  vpc: {
    id: 'vpc',
    name: 'VPC',
    category: 'infrastructure',
    color: '#232F3E',
    icon: '🌐',
    isContainer: true,
    containerType: 'vpc',
    useCase: 'Virtual Private Cloud - isolated network environment',
    whenToUse: 'Group related services in a private network boundary',
    defaultConfig: {
      cidrBlock: '10.0.0.0/16',
      name: 'My VPC',
    },
    configFields: [
      { key: 'name', label: 'VPC Name', type: 'text' },
      { key: 'cidrBlock', label: 'CIDR Block', type: 'text' },
    ],
    defaultSize: { width: 500, height: 350 },
  },
  subnet_public: {
    id: 'subnet_public',
    name: 'Public Subnet',
    category: 'infrastructure',
    color: '#10B981',
    icon: '🌍',
    isContainer: true,
    containerType: 'subnet_public',
    useCase: 'Public-facing resources with internet access',
    whenToUse: 'ALBs, NAT Gateways, Bastion hosts',
    defaultConfig: {
      cidrBlock: '10.0.1.0/24',
      name: 'Public Subnet',
      availabilityZone: 'a',
    },
    configFields: [
      { key: 'name', label: 'Subnet Name', type: 'text' },
      { key: 'cidrBlock', label: 'CIDR Block', type: 'text' },
      { key: 'availabilityZone', label: 'Availability Zone', type: 'select', options: ['a', 'b', 'c'] },
    ],
    defaultSize: { width: 400, height: 250 },
  },
  subnet_private: {
    id: 'subnet_private',
    name: 'Private Subnet',
    category: 'infrastructure',
    color: '#3B82F6',
    icon: '🔒',
    isContainer: true,
    containerType: 'subnet_private',
    useCase: 'Internal resources without direct internet access',
    whenToUse: 'Databases, app servers, internal services',
    defaultConfig: {
      cidrBlock: '10.0.2.0/24',
      name: 'Private Subnet',
      availabilityZone: 'a',
    },
    configFields: [
      { key: 'name', label: 'Subnet Name', type: 'text' },
      { key: 'cidrBlock', label: 'CIDR Block', type: 'text' },
      { key: 'availabilityZone', label: 'Availability Zone', type: 'select', options: ['a', 'b', 'c'] },
    ],
    defaultSize: { width: 400, height: 250 },
  },
  availability_zone: {
    id: 'availability_zone',
    name: 'Availability Zone',
    category: 'infrastructure',
    color: '#8B5CF6',
    icon: '📍',
    isContainer: true,
    containerType: 'availability_zone',
    useCase: 'Physical datacenter location boundary',
    whenToUse: 'Visualize multi-AZ deployments for high availability',
    defaultConfig: {
      name: 'us-east-1a',
      zone: 'a',
    },
    configFields: [
      { key: 'name', label: 'AZ Name', type: 'text' },
      { key: 'zone', label: 'Zone', type: 'select', options: ['a', 'b', 'c', 'd', 'e', 'f'] },
    ],
    defaultSize: { width: 450, height: 300 },
  },
  security_group: {
    id: 'security_group',
    name: 'Security Group',
    category: 'infrastructure',
    color: '#EF4444',
    icon: '🛡️',
    isContainer: true,
    containerType: 'security_group',
    useCase: 'Virtual firewall for controlling traffic',
    whenToUse: 'Group services with same inbound/outbound rules',
    defaultConfig: {
      name: 'web-servers-sg',
      description: 'Security group for web servers',
    },
    configFields: [
      { key: 'name', label: 'SG Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
    ],
    defaultSize: { width: 350, height: 220 },
  },
  custom_group: {
    id: 'custom_group',
    name: 'Custom Group',
    category: 'infrastructure',
    color: '#64748B',
    icon: '📦',
    isContainer: true,
    containerType: 'custom_group',
    useCase: 'Logical grouping for organization',
    whenToUse: 'Group related services visually (Frontend, Backend, Data Layer)',
    defaultConfig: {
      name: 'My Group',
      description: '',
    },
    configFields: [
      { key: 'name', label: 'Group Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
    ],
    defaultSize: { width: 400, height: 280 },
  },
};

// Helper to check if a service type is a container
export const isContainerType = (serviceType) => {
  return containerTypes[serviceType]?.isContainer === true;
};

// Get container definition
export const getContainerType = (serviceType) => {
  return containerTypes[serviceType] || null;
};

