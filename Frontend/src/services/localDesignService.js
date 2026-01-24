// // // import { awsServices } from '../data/awsServices';

// // // export const generateLocalDesign = (text) => {
// // //   const lowerText = text.toLowerCase();
// // //   const foundServices = [];
  
// // //   // 1. Scan text for service keywords
// // //   Object.values(awsServices).forEach(service => {
// // //     // Check for ID (e.g., "ec2") or Name (e.g., "EC2 Instance")
// // //     const idMatch = lowerText.includes(service.id);
// // //     const nameMatch = lowerText.includes(service.name.toLowerCase());
    
// // //     // Check for common synonyms (simple mapping)
// // //     const synonyms = {
// // //       's3': ['bucket', 'storage', 'file'],
// // //       'ec2': ['server', 'vm', 'compute', 'host'],
// // //       'rds': ['database', 'sql', 'db', 'postgres', 'mysql'],
// // //       'dynamodb': ['nosql', 'mongo'],
// // //       'lambda': ['function', 'serverless', 'compute'],
// // //       'alb': ['load balancer', 'balancer'],
// // //       'cloudfront': ['cdn', 'cache']
// // //     };
    
// // //     const synonymMatch = synonyms[service.id]?.some(syn => lowerText.includes(syn));

// // //     if (idMatch || nameMatch || synonymMatch) {
// // //       foundServices.push(service);
// // //     }
// // //   });

// // //   if (foundServices.length === 0) {
// // //     throw new Error("No recognized services found. Try typing 'server', 'database', or 'bucket'.");
// // //   }

// // //   // 2. Position nodes in a simple grid
// // //   const nodes = foundServices.map((service, index) => ({
// // //     id: `node_${index}`,
// // //     type: 'awsService',
// // //     position: { x: 50 + (index * 250), y: 100 + (index % 2 * 100) }, // Zig-zag layout
// // //     data: {
// // //       label: service.name,
// // //       serviceType: service.id,
// // //       icon: service.icon,
// // //       color: service.color,
// // //       config: { ...service.defaultConfig }
// // //     }
// // //   }));

// // //   // 3. Create edges for common patterns (Simple logic)
// // //   const edges = [];
// // //   if (nodes.length > 1) {
// // //     for (let i = 0; i < nodes.length - 1; i++) {
// // //         // Connect left-to-right linearly as a basic guess
// // //         edges.push({
// // //             id: `edge_${i}_${i+1}`,
// // //             source: nodes[i].id,
// // //             target: nodes[i+1].id,
// // //             type: 'labeled',
// // //             animated: true,
// // //             data: { label: 'Connects to', protocol: 'TCP' }
// // //         });
// // //     }
// // //   }

// // //   return { nodes, edges };
// // // };




// // // import { awsServices, getConnectionDefault } from '../data/awsServices';

// // // export const generateLocalDesign = (text) => {
// // //   const lowerText = text.toLowerCase();
// // //   const detectedServices = [];
  
// // //   // 1. Scan text for service keywords
// // //   Object.values(awsServices).forEach(service => {
// // //     // Check for ID (e.g., "ec2") or Name (e.g., "EC2 Instance")
// // //     const idMatch = lowerText.includes(service.id);
// // //     const nameMatch = lowerText.includes(service.name.toLowerCase());
    
// // //     // Check for common synonyms
// // //     const synonyms = {
// // //       's3': ['bucket', 'storage', 'file', 'object store'],
// // //       'ec2': ['server', 'vm', 'compute', 'host', 'instance', 'virtual machine'],
// // //       'rds': ['database', 'sql', 'db', 'postgres', 'mysql', 'relational'],
// // //       'dynamodb': ['nosql', 'mongo', 'key-value', 'document db'],
// // //       'lambda': ['function', 'serverless', 'logic', 'handler'],
// // //       'alb': ['load balancer', 'balancer', 'alb'],
// // //       'cloudfront': ['cdn', 'cache', 'edge', 'distribution'],
// // //       'apigateway': ['api', 'gateway', 'endpoint', 'rest'],
// // //       'vpc': ['network', 'private network'],
// // //       'route53': ['dns', 'domain', 'route']
// // //     };
    
// // //     const synonymMatch = synonyms[service.id]?.some(syn => lowerText.includes(syn));

// // //     if (idMatch || nameMatch || synonymMatch) {
// // //       // Prevent duplicates if multiple keywords match the same service
// // //       if (!detectedServices.find(s => s.id === service.id)) {
// // //         detectedServices.push(service);
// // //       }
// // //     }
// // //   });

// // //   if (detectedServices.length === 0) {
// // //     throw new Error("No recognized services found. Try typing 'server', 'database', or 'bucket'.");
// // //   }

// // //   // 2. Intelligent Positioning (Tiered Architecture)
// // //   // Map categories to X-axis positions (Left -> Right)
// // //   const tierXMap = {
// // //     'networking': 100,  // Tier 1: Entry/Edge
// // //     'security': 100,
// // //     'compute': 450,     // Tier 2: Processing
// // //     'messaging': 450,
// // //     'container': 450,
// // //     'database': 800,    // Tier 3: Data
// // //     'storage': 800,
// // //     'analytics': 800
// // //   };

// // //   // Track vertical slots per tier to prevent overlap
// // //   const tierYTracker = { 100: 0, 450: 0, 800: 0 };

// // //   const nodes = detectedServices.map((service) => {
// // //     // Determine column (default to middle if category unknown)
// // //     const xPos = tierXMap[service.category] || 450;
    
// // //     // Determine row (stack them vertically)
// // //     const currentCount = tierYTracker[xPos] || 0;
// // //     const yPos = 100 + (currentCount * 140);
// // //     tierYTracker[xPos] = currentCount + 1;

// // //     return {
// // //       id: `node_${service.id}_${Math.floor(Math.random() * 1000)}`, // Unique ID
// // //       type: 'awsService',
// // //       position: { x: xPos, y: yPos },
// // //       data: {
// // //         label: service.name,
// // //         serviceType: service.id,
// // //         icon: service.icon,
// // //         color: service.color,
// // //         config: { ...service.defaultConfig }
// // //       }
// // //     };
// // //   });

// // //   // 3. Logic-based Connections
// // //   // Instead of linear (i -> i+1), we check the `allowedConnections` rule for every pair
// // //   const edges = [];
  
// // //   nodes.forEach(sourceNode => {
// // //     nodes.forEach(targetNode => {
// // //       if (sourceNode.id === targetNode.id) return; // Don't connect to self

// // //       const sourceServiceDef = awsServices[sourceNode.data.serviceType];
// // //       const targetServiceType = targetNode.data.serviceType;

// // //       // Check "awsServices.js" rules: Does Source allow connecting to Target?
// // //       if (sourceServiceDef.allowedConnections && 
// // //           sourceServiceDef.allowedConnections.includes(targetServiceType)) {
        
// // //         // Get correct port/protocol logic
// // //         const connectionMeta = getConnectionDefault(sourceServiceDef.id, targetServiceType);

// // //         edges.push({
// // //           id: `edge_${sourceNode.id}_${targetNode.id}`,
// // //           source: sourceNode.id,
// // //           target: targetNode.id,
// // //           type: 'labeled',
// // //           animated: true,
// // //           data: { 
// // //             label: connectionMeta.protocol, // e.g., 'HTTPS'
// // //             protocol: connectionMeta.protocol,
// // //             port: connectionMeta.port
// // //           }
// // //         });
// // //       }
// // //     });
// // //   });

// // //   return { nodes, edges };
// // // };




// // import { awsServices, getConnectionDefault } from '../data/awsServices';
// // import { architectureTemplates } from '../data/architectureTemplates';

// // export const generateLocalDesign = (text) => {
// //   const lowerText = text.toLowerCase();
  
// //   // --- STRATEGY 1: EXACT TEMPLATE MATCHING (100% Accuracy) ---
// //   // If the user asks for a known pattern, return the pre-built template.
  
// //   if (lowerText.includes('3 tier') || lowerText.includes('three tier') || (lowerText.includes('web') && lowerText.includes('app'))) {
// //     const template = architectureTemplates.find(t => t.id === '3-tier-web');
// //     if (template) return { nodes: template.nodes, edges: template.edges };
// //   }

// //   if (lowerText.includes('serverless') || (lowerText.includes('lambda') && lowerText.includes('api'))) {
// //     const template = architectureTemplates.find(t => t.id === 'serverless-api');
// //     if (template) return { nodes: template.nodes, edges: template.edges };
// //   }

// //   if (lowerText.includes('data') && (lowerText.includes('pipeline') || lowerText.includes('analytics'))) {
// //     const template = architectureTemplates.find(t => t.id === 'data-pipeline');
// //     if (template) return { nodes: template.nodes, edges: template.edges };
// //   }

// //   // --- STRATEGY 2: INTELLIGENT KEYWORD SCANNING (Fallback) ---
// //   const detectedServices = [];
  
// //   // Scan text for service keywords
// //   Object.values(awsServices).forEach(service => {
// //     const idMatch = lowerText.includes(service.id);
// //     const nameMatch = lowerText.includes(service.name.toLowerCase());
    
// //     const synonyms = {
// //       's3': ['bucket', 'storage', 'file', 'object store'],
// //       'ec2': ['server', 'vm', 'compute', 'host', 'instance'],
// //       'rds': ['database', 'sql', 'db', 'postgres', 'mysql', 'relational'],
// //       'dynamodb': ['nosql', 'mongo', 'key-value'],
// //       'lambda': ['function', 'serverless', 'logic'],
// //       'alb': ['load balancer', 'balancer', 'alb'],
// //       'cloudfront': ['cdn', 'cache', 'edge'],
// //       'apigateway': ['api', 'gateway', 'endpoint'],
// //       'vpc': ['network', 'private network'],
// //       'route53': ['dns', 'domain', 'route']
// //     };
    
// //     const synonymMatch = synonyms[service.id]?.some(syn => lowerText.includes(syn));

// //     if (idMatch || nameMatch || synonymMatch) {
// //       if (!detectedServices.find(s => s.id === service.id)) {
// //         detectedServices.push(service);
// //       }
// //     }
// //   });

// //   if (detectedServices.length === 0) {
// //     throw new Error("No recognized services found. Try typing 'server', 'database', or 'bucket', or use '3 tier app'.");
// //   }

// //   // Position nodes in tiers (Networking -> Compute -> Database)
// //   const tierXMap = {
// //     'networking': 100,
// //     'security': 100,
// //     'compute': 450,
// //     'messaging': 450,
// //     'container': 450,
// //     'database': 800,
// //     'storage': 800,
// //     'analytics': 800
// //   };

// //   const tierYTracker = { 100: 0, 450: 0, 800: 0 };

// //   const nodes = detectedServices.map((service) => {
// //     const xPos = tierXMap[service.category] || 450;
// //     const currentCount = tierYTracker[xPos] || 0;
// //     const yPos = 100 + (currentCount * 140);
// //     tierYTracker[xPos] = currentCount + 1;

// //     return {
// //       id: `node_${service.id}_${Math.floor(Math.random() * 1000)}`,
// //       type: 'awsService',
// //       position: { x: xPos, y: yPos },
// //       data: {
// //         label: service.name,
// //         serviceType: service.id,
// //         icon: service.icon,
// //         color: service.color,
// //         config: { ...service.defaultConfig }
// //       }
// //     };
// //   });

// //   // Smart Connections based on 'allowedConnections' rules
// //   const edges = [];
// //   nodes.forEach(sourceNode => {
// //     nodes.forEach(targetNode => {
// //       if (sourceNode.id === targetNode.id) return;

// //       const sourceServiceDef = awsServices[sourceNode.data.serviceType];
// //       const targetServiceType = targetNode.data.serviceType;

// //       if (sourceServiceDef.allowedConnections && 
// //           sourceServiceDef.allowedConnections.includes(targetServiceType)) {
        
// //         const connectionMeta = getConnectionDefault(sourceServiceDef.id, targetServiceType);

// //         edges.push({
// //           id: `edge_${sourceNode.id}_${targetNode.id}`,
// //           source: sourceNode.id,
// //           target: targetNode.id,
// //           type: 'labeled',
// //           animated: true,
// //           data: { 
// //             label: connectionMeta.protocol,
// //             protocol: connectionMeta.protocol,
// //             port: connectionMeta.port
// //           }
// //         });
// //       }
// //     });
// //   });

// //   return { nodes, edges };
// // };



// import { awsServices, getConnectionDefault } from '../data/awsServices';
// import { architectureTemplates } from '../data/architectureTemplates';

// /**
//  * LOGIC ENGINE CONFIGURATION
//  * Defines the strict "Grammar" of a valid architecture.
//  */
// const TIER_HIERARCHY = {
//   'route53': 0, 'waf': 0,
//   'cloudfront': 1, 'apigateway': 1, 'alb': 1,
//   'ec2': 2, 'ecs': 2, 'eks': 2, 'lambda': 2, 'elasticache': 2, 'apprunner': 2, 'batch': 2, 'lightsail': 2,
//   's3': 3, 'rds': 3, 'dynamodb': 3, 'sqs': 3, 'sns': 3, 'kinesis': 3, 'msk': 3, 'glue': 3, 'emr': 3,
//   'redshift': 4, 'athena': 4, 'quicksight': 5
// };

// const SERVICE_SYNONYMS = {
//   's3': ['bucket', 'storage', 'file', 'object store', 'assets', 'static', 'media'],
//   'ec2': ['server', 'vm', 'compute', 'host', 'instance', 'virtual machine', 'linux', 'windows'],
//   'rds': ['database', 'sql', 'db', 'postgres', 'mysql', 'relational', 'mariadb'],
//   'dynamodb': ['nosql', 'mongo', 'key-value', 'document db', 'table'],
//   'lambda': ['function', 'serverless', 'logic', 'handler', 'code'],
//   'alb': ['load balancer', 'balancer', 'alb', 'routing'],
//   'cloudfront': ['cdn', 'cache', 'edge', 'distribution', 'global'],
//   'apigateway': ['api', 'gateway', 'endpoint', 'rest', 'websocket'],
//   'vpc': ['network', 'private network'],
//   'route53': ['dns', 'domain', 'route', 'url'],
//   'sqs': ['queue', 'message', 'job'],
//   'sns': ['notification', 'topic', 'pubsub', 'email', 'sms']
// };

// export const generateLocalDesign = (text) => {
//   const lowerText = text.toLowerCase().trim();
  
//   // ---------------------------------------------------------
//   // PHASE 1: EXACT TEMPLATE SHORTCUTS (The "Perfect" Match)
//   // ---------------------------------------------------------
//   if (lowerText.includes('3 tier') || lowerText.includes('three tier')) return getTemplate('3-tier-web');
//   if (lowerText.includes('serverless') && lowerText.includes('api')) return getTemplate('serverless-api');
//   if (lowerText.includes('data') && lowerText.includes('pipeline')) return getTemplate('data-pipeline');

//   // ---------------------------------------------------------
//   // PHASE 2: COMPONENT EXTRACTION & CLASSIFICATION
//   // ---------------------------------------------------------
//   const detectedServices = [];
  
//   Object.values(awsServices).forEach(service => {
//     const idMatch = lowerText.includes(service.id);
//     const nameMatch = lowerText.includes(service.name.toLowerCase());
//     const synonymMatch = SERVICE_SYNONYMS[service.id]?.some(syn => lowerText.includes(syn));

//     if (idMatch || nameMatch || synonymMatch) {
//       if (!detectedServices.find(s => s.id === service.id)) {
//         detectedServices.push(service);
//       }
//     }
//   });

//   if (detectedServices.length === 0) {
//     throw new Error("I couldn't identify any AWS components. Try describing them like: 'I need a server and a database' or 'S3 with CloudFront'.");
//   }

//   // ---------------------------------------------------------
//   // PHASE 3: LOGICAL VALIDATION (The "Feasibility" Check)
//   // ---------------------------------------------------------
//   const ids = detectedServices.map(s => s.id);
//   const categories = detectedServices.map(s => s.category);

//   const hasCompute = categories.includes('compute');
//   const hasDatabase = categories.includes('database');
//   const hasGateway = ids.includes('alb') || ids.includes('apigateway');
//   const hasStorage = ids.includes('s3');
//   const isStaticSite = hasStorage && (ids.includes('cloudfront') || ids.includes('route53')) && !hasCompute;

//   // RULE 1: A system needs logic (Compute) or static hosting.
//   if (!hasCompute && !isStaticSite) {
//     if (hasDatabase) {
//       throw new Error("Logical Error: You requested a Database but no Compute (like EC2 or Lambda) to use it. A database cannot exist alone.");
//     }
//     if (hasGateway) {
//       throw new Error("Logical Error: You requested a Gateway/Load Balancer but no Server to forward traffic to.");
//     }
//     // If they just asked for "SQS", allow it but warn? For now, strict:
//     if (detectedServices.length < 2) {
//        // Single service request - likely exploring palette
//        // Allow it for single item exploration
//     } else {
//        throw new Error("System Incomplete: Your design lacks a 'brain'. Add a Server (EC2), Function (Lambda), or Container (ECS).");
//     }
//   }

//   // ---------------------------------------------------------
//   // PHASE 4: TIERED LAYOUT & AUTO-WIRING
//   // ---------------------------------------------------------
//   const nodes = [];
//   const edges = [];
//   const tierTracker = {}; // Track items per tier for Y-positioning

//   // 1. Create Nodes with Tier Coordinates
//   detectedServices.sort((a, b) => (TIER_HIERARCHY[a.id] || 99) - (TIER_HIERARCHY[b.id] || 99)).forEach(service => {
//     const tier = TIER_HIERARCHY[service.id] !== undefined ? TIER_HIERARCHY[service.id] : 2;
//     const tierX = 100 + (tier * 300); // 300px spacing between tiers
    
//     // Stacking logic
//     tierTracker[tier] = (tierTracker[tier] || 0) + 1;
//     const tierY = 50 + (tierTracker[tier] * 120);

//     nodes.push({
//       id: `node_${service.id}_${Math.random().toString(36).substr(2, 5)}`,
//       type: 'awsService',
//       position: { x: tierX, y: tierY },
//       data: {
//         label: service.name,
//         serviceType: service.id,
//         icon: service.icon,
//         color: service.color,
//         config: { ...service.defaultConfig },
//         _tier: tier // Internal use for wiring
//       }
//     });
//   });

//   // 2. Deterministic Wiring (The "Auto-Linker")
//   // We only connect Node A to Node B if:
//   // a) A allows connection to B (defined in awsServices.js)
//   // b) A is in a lower or equal Tier to B (Flow moves Right)
//   // c) They are adjacent tiers (or specific skip-logic like CloudFront -> S3)
  
//   nodes.forEach(source => {
//     nodes.forEach(target => {
//       if (source.id === target.id) return;

//       const sourceDef = awsServices[source.data.serviceType];
//       const targetDef = awsServices[target.data.serviceType];
      
//       const sourceTier = source.data._tier;
//       const targetTier = target.data._tier;

//       // Check if connection is strictly allowed by AWS rules
//       const isAllowed = sourceDef.allowedConnections?.includes(targetDef.id);
      
//       // Check Logical Flow (Downstream only)
//       // e.g., Tier 1 (ALB) -> Tier 2 (EC2) is OK. Tier 3 (RDS) -> Tier 1 (ALB) is BLOCKED.
//       const isDownstream = sourceTier <= targetTier;

//       if (isAllowed && isDownstream) {
//         // Prevent duplicate edges (A->B and B->A shouldn't happen due to downstream check, but safe to check)
//         const edgeId = `edge_${source.id}_${target.id}`;
        
//         // Retrieve exact protocol/port
//         const connMeta = getConnectionDefault(sourceDef.id, targetDef.id);

//         edges.push({
//           id: edgeId,
//           source: source.id,
//           target: target.id,
//           type: 'labeled',
//           animated: true,
//           data: { 
//             label: connMeta.protocol,
//             protocol: connMeta.protocol,
//             port: connMeta.port
//           }
//         });
//       }
//     });
//   });

//   // ---------------------------------------------------------
//   // PHASE 5: FINAL ISOLATION CHECK
//   // ---------------------------------------------------------
//   // If we have multiple nodes but NO edges, something is wrong with the user's combination
//   if (nodes.length > 1 && edges.length === 0) {
//      throw new Error(`I created the components (${nodes.map(n => n.data.label).join(', ')}), but they are not compatible with each other. Please check your architecture.`);
//   }

//   return { nodes, edges };
// };

// // Helper to fetch templates
// const getTemplate = (id) => {
//   const t = architectureTemplates.find(x => x.id === id);
//   return t ? { nodes: t.nodes, edges: t.edges } : { nodes: [], edges: [] };
// };



import { awsServices, getConnectionDefault } from '../data/awsServices';
import { architectureTemplates } from '../data/architectureTemplates';

/**
 * LOGIC ENGINE CONFIGURATION
 * Defines the strict "Grammar" of a valid architecture.
 */
const TIER_HIERARCHY = {
  // Edge / Public Tier
  'route53': 0, 'waf': 0, 'cloudfront': 1, 'apigateway': 1, 'alb': 1,
  
  // Compute / App Tier
  'ec2': 2, 'ecs': 2, 'eks': 2, 'lambda': 2, 'elasticache': 2, 
  'apprunner': 2, 'batch': 2, 'lightsail': 2, 'emr': 2,
  
  // Data / Storage Tier
  's3': 3, 'rds': 3, 'dynamodb': 3, 'sqs': 3, 'sns': 3, 
  'kinesis': 3, 'msk': 3, 'mq': 3, 'glue': 3, 'efs': 3,
  
  // Analytics / Warehouse Tier
  'redshift': 4, 'opensearch': 4, 'athena': 4,
  
  // Visualization / Management Tier
  'quicksight': 5, 'config': 5, 'cloudtrail': 5, 'guardduty': 5,
  'secrets': 5, 'ssm': 5, 'acm': 5, 'natgateway': 5, 'cognito': 5, 'eventbridge': 5
};

const SERVICE_SYNONYMS = {
  // --- COMPUTE ---
  'ec2': ['server', 'vm', 'compute', 'host', 'instance', 'virtual machine', 'linux', 'windows', 'ubuntu', 'rhel'],
  'ecs': ['container', 'docker', 'fargate', 'task', 'cluster', 'microservices'],
  'eks': ['kubernetes', 'k8s', 'kube', 'container orchestration', 'cluster'],
  'lambda': ['function', 'serverless', 'logic', 'handler', 'faas', 'code', 'microservice'],
  'apprunner': ['app runner', 'paas', 'web app', 'container service'],
  'batch': ['batch job', 'hpc', 'scheduler', 'offline processing'],
  'lightsail': ['vps', 'wordpress', 'simple server', 'lamp'],

  // --- STORAGE ---
  's3': ['bucket', 'storage', 'file', 'object store', 'assets', 'static', 'media', 'data lake', 'blob'],
  'efs': ['file system', 'nfs', 'network storage', 'shared volume', 'mount'],

  // --- DATABASE ---
  'rds': ['database', 'sql', 'db', 'postgres', 'mysql', 'mariadb', 'relational', 'rdbms'],
  'dynamodb': ['nosql', 'mongo', 'key-value', 'document db', 'table', 'kv store'],
  'elasticache': ['cache', 'redis', 'memcached', 'in-memory', 'caching', 'session store'],
  'aurora': ['aurora', 'serverless db', 'cluster db', 'high performance db'],

  // --- NETWORKING ---
  'alb': ['load balancer', 'balancer', 'elb', 'routing', 'listener', 'target group'],
  'cloudfront': ['cdn', 'cache', 'edge', 'distribution', 'content delivery', 'latency'],
  'apigateway': ['api', 'gateway', 'endpoint', 'rest', 'websocket', 'http api'],
  'route53': ['dns', 'domain', 'route', 'url', 'nameserver', 'zone'],
  'natgateway': ['nat', 'internet access', 'outbound'],

  // --- MESSAGING ---
  'sqs': ['queue', 'message', 'job', 'fifo', 'buffer', 'decouple'],
  'sns': ['notification', 'topic', 'pubsub', 'email', 'sms', 'push', 'fanout'],
  'eventbridge': ['event bus', 'scheduler', 'cron', 'event driven', 'rule'],
  'msk': ['kafka', 'streaming', 'stream processing', 'broker', 'zookeeper'],
  'mq': ['activemq', 'rabbitmq', 'message broker', 'queue manager'],

  // --- SECURITY ---
  'waf': ['firewall', 'security', 'acl', 'protection', 'block ip', 'xss'],
  'cognito': ['auth', 'user', 'login', 'identity', 'sso', 'oauth', 'jwt', 'sign up'],
  'secrets': ['secrets manager', 'password', 'credential', 'key', 'rotation'],
  'guardduty': ['threat detection', 'ids', 'malware protection', 'security monitoring'],
  'acm': ['certificate', 'ssl', 'tls', 'https', 'encryption'],
  
  // --- ANALYTICS ---
  'kinesis': ['data stream', 'real-time', 'ingestion', 'shard'],
  'opensearch': ['elasticsearch', 'search', 'elk', 'kibana', 'log analytics'],
  'athena': ['query', 'sql on s3', 'analysis', 'serverless query'],
  'redshift': ['warehouse', 'data warehouse', 'olap', 'bi store', 'analytics db'],
  'quicksight': ['dashboard', 'visualization', 'bi', 'report', 'chart', 'graph'],
  'emr': ['hadoop', 'spark', 'big data', 'mapreduce', 'hive', 'cluster compute'],
  'glue': ['etl', 'catalog', 'crawler', 'data pipeline', 'transformation'],

  // --- MANAGEMENT ---
  'cloudtrail': ['audit', 'logging', 'history', 'tracking', 'governance'],
  'config': ['compliance', 'inventory', 'resource tracking', 'audit rules'],
  'ssm': ['systems manager', 'parameter store', 'patch', 'remote access', 'run command']
};

export const generateLocalDesign = (text) => {
  const lowerText = text.toLowerCase().trim();
  
  // ---------------------------------------------------------
  // PHASE 1: EXACT TEMPLATE SHORTCUTS (The "Perfect" Match)
  // ---------------------------------------------------------
  if (lowerText.includes('3 tier') || lowerText.includes('three tier')) return getTemplate('3-tier-web');
  if (lowerText.includes('serverless') && lowerText.includes('api')) return getTemplate('serverless-api');
  if (lowerText.includes('data') && lowerText.includes('pipeline')) return getTemplate('data-pipeline');
  if (lowerText.includes('microservice')) return getTemplate('microservices');
  if (lowerText.includes('static web')) return getTemplate('static-website');

  // ---------------------------------------------------------
  // PHASE 2: COMPONENT EXTRACTION & CLASSIFICATION
  // ---------------------------------------------------------
  const detectedServices = [];
  
  Object.values(awsServices).forEach(service => {
    // 1. Check exact ID
    const idMatch = lowerText.includes(service.id);
    // 2. Check Service Name
    const nameMatch = lowerText.includes(service.name.toLowerCase());
    // 3. Check Synonyms
    const synonymMatch = SERVICE_SYNONYMS[service.id]?.some(syn => lowerText.includes(syn));

    if (idMatch || nameMatch || synonymMatch) {
      if (!detectedServices.find(s => s.id === service.id)) {
        detectedServices.push(service);
      }
    }
  });

  if (detectedServices.length === 0) {
    throw new Error("I couldn't identify any AWS components. Try describing them like: 'I need a server and a database' or 'S3 with CloudFront'.");
  }

  // ---------------------------------------------------------
  // PHASE 3: LOGICAL VALIDATION (The "Feasibility" Check)
  // ---------------------------------------------------------
  const ids = detectedServices.map(s => s.id);
  const categories = detectedServices.map(s => s.category);

  const hasCompute = categories.includes('compute');
  const hasDatabase = categories.includes('database');
  const hasGateway = ids.includes('alb') || ids.includes('apigateway');
  const hasStorage = ids.includes('s3');
  const isStaticSite = hasStorage && (ids.includes('cloudfront') || ids.includes('route53')) && !hasCompute;

  // RULE: A system generally needs logic (Compute) or static hosting to be valid.
  if (!hasCompute && !isStaticSite) {
    if (hasDatabase) {
      throw new Error("Logical Error: You requested a Database but no Compute (like EC2, EKS, or Lambda) to use it. A database cannot exist alone.");
    }
    if (hasGateway) {
      throw new Error("Logical Error: You requested a Gateway/Load Balancer but no Server to forward traffic to.");
    }
    
    // Allow single items for exploration, but block invalid combos
    if (detectedServices.length >= 2) {
       throw new Error("System Incomplete: Your design lacks a 'brain'. Add a Server (EC2), Kubernetes (EKS), or Function (Lambda).");
    }
  }

  // ---------------------------------------------------------
  // PHASE 4: TIERED LAYOUT & AUTO-WIRING
  // ---------------------------------------------------------
  const nodes = [];
  const edges = [];
  const tierTracker = {}; // Track items per tier for Y-positioning

  // 1. Create Nodes with Tier Coordinates
  detectedServices.sort((a, b) => (TIER_HIERARCHY[a.id] || 99) - (TIER_HIERARCHY[b.id] || 99)).forEach(service => {
    const tier = TIER_HIERARCHY[service.id] !== undefined ? TIER_HIERARCHY[service.id] : 2;
    const tierX = 100 + (tier * 300); // 300px spacing between tiers
    
    // Stacking logic
    tierTracker[tier] = (tierTracker[tier] || 0) + 1;
    const tierY = 50 + (tierTracker[tier] * 120);

    nodes.push({
      id: `node_${service.id}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'awsService',
      position: { x: tierX, y: tierY },
      data: {
        label: service.name,
        serviceType: service.id,
        icon: service.icon,
        color: service.color,
        config: { ...service.defaultConfig },
        _tier: tier // Internal use for wiring
      }
    });
  });

  // 2. Deterministic Wiring (The "Auto-Linker")
  nodes.forEach(source => {
    nodes.forEach(target => {
      if (source.id === target.id) return;

      const sourceDef = awsServices[source.data.serviceType];
      const targetDef = awsServices[target.data.serviceType];
      
      const sourceTier = source.data._tier;
      const targetTier = target.data._tier;

      // Check if connection is strictly allowed by AWS rules
      const isAllowed = sourceDef.allowedConnections?.includes(targetDef.id);
      
      // Check Logical Flow (Downstream only)
      // Tier 1 -> Tier 2 is OK. Tier 2 -> Tier 2 is OK. Tier 3 -> Tier 2 is NOT.
      const isDownstream = sourceTier <= targetTier;

      if (isAllowed && isDownstream) {
        const edgeId = `edge_${source.id}_${target.id}`;
        
        // Retrieve exact protocol/port
        const connMeta = getConnectionDefault(sourceDef.id, targetDef.id);

        edges.push({
          id: edgeId,
          source: source.id,
          target: target.id,
          type: 'labeled',
          animated: true,
          data: { 
            label: connMeta.protocol,
            protocol: connMeta.protocol,
            port: connMeta.port
          }
        });
      }
    });
  });

  // ---------------------------------------------------------
  // PHASE 5: FINAL ISOLATION CHECK
  // ---------------------------------------------------------
  if (nodes.length > 1 && edges.length === 0) {
     throw new Error(`I created the components (${nodes.map(n => n.data.label).join(', ')}), but they are not compatible with each other. Please check your architecture.`);
  }

  return { nodes, edges };
};

// Helper to fetch templates
const getTemplate = (id) => {
  const t = architectureTemplates.find(x => x.id === id);
  return t ? { nodes: t.nodes, edges: t.edges } : { nodes: [], edges: [] };
};