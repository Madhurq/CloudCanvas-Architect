// import { GoogleGenAI } from "@google/genai";
// import { awsServices, getConnectionDefault, containerTypes } from '../data/awsServices';

// // Helper: Simple wait function
// const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// // Services that must be inside a VPC (Synced with DesignCanvas rules)
// const VPC_REQUIRED_SERVICES = [
//     'ec2', 'ecs', 'eks', 'lambda', 'rds', 'elasticache', 'alb', 
//     'aurora', 'redshift', 'opensearch', 'mq', 'msk', 'batch', 'lightsail',
//     'apprunner', 'natgateway', 'efs',
//     // Added missing components present in awsServices.js
//     'documentdb', 'neptune', 'memorydb', 'fsx', 'emr', 'glue', 'sagemaker'
// ];

// export const generateArchitecture = async (userPrompt) => {

//   const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_AI_API_KEY }); 

//   // 1. Build Strict Menu (IDs only to save bandwidth)
//   // Include both standard services and container types (like VPC)
//   const allServices = { ...awsServices, ...containerTypes };
//   const validServicesList = Object.values(allServices).map(s => `"${s.id}"`).join(', ');

//   const systemInstruction = `
//     You are an AWS Solution Architect.
    
//     INPUT: "${userPrompt}"
    
//     STRICT RULES:
//     1. Use ONLY these service IDs: [${validServicesList}]
//     2. IF the architecture uses Compute (EC2, ECS, Lambda) or Databases (RDS, DynamoDB), you MUST include a "vpc" node.
//     3. Output strict JSON structure:
//     {
//       "nodes": [
//         { "id": "vpc1", "serviceType": "vpc", "region": "us-east-1", "config": { "name": "Main VPC" } },
//         { "id": "n1", "serviceType": "ec2", "region": "us-east-1", "config": {} }
//       ],
//       "connections": [
//         { "source": "n1", "target": "n2" }
//       ]
//     }
//     4. BEHAVIOR:
//     - If user specifies a region (e.g. "Tokyo"), set "region" to "ap-northeast-1".
//     - If user asks for "3 servers", return 3 distinct nodes.
//     - Return RAW JSON only. No markdown.
//   `;

//   // --- RETRY LOOP (For Stability Only) ---
//   let retries = 3;
//   let lastError;

//   while (retries > 0) {
//     try {
//       console.log(`[Online Mode] Calling Gemini... (Attempts left: ${retries})`);

//       const response = await ai.models.generateContent({
//         model: "gemini-3-flash-preview", 
//         contents: systemInstruction,
//         config: { 
//           responseMimeType: "application/json",
//           safetySettings: [
//             { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
//             { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
//             { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
//             { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }
//           ]
//         }
//       });

//       const text = response.text; 
//       if (!text) throw new Error("Gemini returned an empty response.");

//       const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
//       const data = JSON.parse(cleanJson);

//       if (!data.nodes || !data.connections) throw new Error("AI returned invalid JSON structure.");

//       // --- HYDRATION (Apply Icons/Colors/Defaults) ---
//       const tierMap = { 
//         'infrastructure': 0,
//         'networking': 0, 
//         'security': 0, 
//         'compute': 1, 
//         'container': 1, 
//         'database': 2, 
//         'storage': 2, 
//         'messaging': 2, 
//         'analytics': 3 
//       };
//       const rowTracker = { 0: 0, 1: 0, 2: 0, 3: 0 };

//       // 1. First pass: Create all nodes
//       let nodes = data.nodes.map((aiNode) => {
//         const serviceDef = allServices[aiNode.serviceType];
//         if (!serviceDef) return null;

//         const tier = tierMap[serviceDef.category] || 1;
//         const x = 100 + (tier * 350);
//         const y = 100 + (rowTracker[tier]++ * 150);

//         const isContainer = serviceDef.isContainer;
        
//         // Match Manual Add Logic: Strictly use system default names as requested
//         const label = serviceDef.defaultConfig?.name || serviceDef.name;

//         return {
//           id: aiNode.id,
//           type: isContainer ? 'groupNode' : 'awsService',
//           position: { x, y },
//           data: {
//             label: label, 
//             serviceType: serviceDef.id,
//             icon: serviceDef.icon,
//             color: serviceDef.color,
//             isContainer: isContainer,
//             containerType: serviceDef.containerType,
//             region: aiNode.region || 'us-east-1',
//             config: { ...serviceDef.defaultConfig, ...(aiNode.config || {}) }
//           },
//           style: isContainer ? { width: 500, height: 350 } : undefined
//         };
//       }).filter(Boolean);

//       // 2. Second pass: Handle VPC Grouping
//       const vpcNode = nodes.find(n => n.data.serviceType === 'vpc');
      
//       if (vpcNode) {
//         // Move VPC to top-left to encompass other nodes
//         vpcNode.position = { x: 50, y: 50 };
//         // Make VPC large enough to hold the generated architecture
//         vpcNode.style = { width: 1400, height: 1000 }; 

//         // Assign relevant services to this VPC
//         nodes = nodes.map(node => {
//             if (node.id === vpcNode.id) return node;

//             const isVPCRequired = VPC_REQUIRED_SERVICES.includes(node.data.serviceType);
            
//             if (isVPCRequired) {
//                 return {
//                     ...node,
//                     parentId: vpcNode.id, // React Flow Parent ID
//                     extent: 'parent',     // Constrain to parent
//                     // Adjust position to be relative to the VPC (VPC is at 50,50)
//                     position: { 
//                         x: node.position.x - 50, 
//                         y: node.position.y - 50 
//                     }
//                 };
//             }
//             return node;
//         });
//       }

//       // 3. Create Edges
//       const edges = data.connections.map((conn) => {
//         const sourceNode = nodes.find(n => n.id === conn.source);
//         const targetNode = nodes.find(n => n.id === conn.target);
//         if (!sourceNode || !targetNode) return null;

//         const defaults = getConnectionDefault(sourceNode.data.serviceType, targetNode.data.serviceType);

//         return {
//           id: `edge_${conn.source}_${conn.target}`,
//           source: conn.source,
//           target: conn.target,
//           type: 'labeled',
//           animated: true,
//           data: { label: defaults.protocol, protocol: defaults.protocol, port: defaults.port }
//         };
//       }).filter(Boolean);

//       return { nodes, edges }; 

//     } catch (error) {
//       lastError = error;
//       const errorMsg = error.message || '';
      
//       // Retry ONLY on 503 (Overloaded) or 500 (Internal Error)
//       if (errorMsg.includes('503') || errorMsg.includes('overloaded') || errorMsg.includes('500')) {
//         console.warn(`Gemini Busy. Retrying in 2s...`);
//         retries--;
//         await delay(2000); 
//       } else {
//         throw error; 
//       }
//     }
//   }

//   throw lastError;
// };



import { GoogleGenAI } from "@google/genai";
import { awsServices, getConnectionDefault, containerTypes } from '../data/awsServices';

// Helper: Simple wait function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Services that must be inside a VPC (Synced with DesignCanvas rules)
const VPC_REQUIRED_SERVICES = [
    'ec2', 'ecs', 'eks', 'lambda', 'rds', 'elasticache', 'alb', 
    'aurora', 'redshift', 'opensearch', 'mq', 'msk', 'batch', 'lightsail',
    'apprunner', 'natgateway', 'efs',
    'documentdb', 'neptune', 'memorydb', 'fsx', 'emr', 'glue', 'sagemaker'
];

export const generateArchitecture = async (userPrompt) => {

  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_AI_API_KEY }); 

  // 1. Build Strict Menu (IDs only to save bandwidth)
  // Include both standard services and container types (like VPC)
  const allServices = { ...awsServices, ...containerTypes };
  const validServicesList = Object.values(allServices).map(s => `"${s.id}"`).join(', ');

  const systemInstruction = `
    You are an AWS Solution Architect.
    
    INPUT: "${userPrompt}"
    
    STRICT RULES:
    1. Use ONLY these service IDs: [${validServicesList}]
    2. IF the architecture uses Compute (EC2, ECS, Lambda) or Databases (RDS, DynamoDB), you MUST include a "vpc" node.
    3. Output strict JSON structure:
    {
      "nodes": [
        { "id": "vpc1", "serviceType": "vpc", "region": "us-east-1", "config": { "name": "Main VPC" } },
        { "id": "n1", "serviceType": "ec2", "region": "us-east-1", "config": {} }
      ],
      "connections": [
        { "source": "n1", "target": "n2" }
      ]
    }
    4. BEHAVIOR:
    - If user specifies a region (e.g. "Tokyo"), set "region" to "ap-northeast-1".
    - If user asks for "3 servers", return 3 distinct nodes.
    - Return RAW JSON only. No markdown.
  `;

  // --- RETRY LOOP (For Stability Only) ---
  let retries = 3;
  let lastError;

  while (retries > 0) {
    try {
      console.log(`[Online Mode] Calling Gemini... (Attempts left: ${retries})`);

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: systemInstruction,
        config: { 
          responseMimeType: "application/json",
          safetySettings: [
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }
          ]
        }
      });

      const text = response.text; 
      if (!text) throw new Error("Gemini returned an empty response.");

      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanJson);

      if (!data.nodes || !data.connections) throw new Error("AI returned invalid JSON structure.");

      // --- HYDRATION & LAYOUT LOGIC ---
      
      // Helper to determine depth/tier for proper flow representation
      const getServiceTier = (serviceType) => {
        const type = serviceType.toLowerCase();
        // Tier 0: Edge / Entry (No VPC usually)
        if (['route53', 'cloudfront', 'waf', 'shield', 'acm'].includes(type)) return 0;
        // Tier 1: Ingress / API / LB
        if (['alb', 'nlb', 'apigateway', 'appsync'].includes(type)) return 1;
        // Tier 2: Compute / Processing
        if (['ec2', 'ecs', 'eks', 'lambda', 'apprunner', 'lightsail', 'batch', 'emr', 'glue', 'sagemaker', 'bedrock'].includes(type)) return 2;
        // Tier 3: Messaging / Integration
        if (['sqs', 'sns', 'eventbridge', 'stepfunctions', 'mq', 'msk', 'kinesis'].includes(type)) return 3;
        // Tier 4: Storage / Database
        if (['rds', 'dynamodb', 'elasticache', 's3', 'efs', 'fsx', 'documentdb', 'neptune', 'redshift', 'aurora', 'timestream'].includes(type)) return 4;
        // Tier 5: Management / Analytics / Other
        return 5;
      };

      const tierTracker = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const TIER_WIDTH = 350;
      const ROW_HEIGHT = 180;

      // 1. First pass: Create all nodes with global positions based on Tier
      let nodes = data.nodes.map((aiNode) => {
        const serviceDef = allServices[aiNode.serviceType];
        if (!serviceDef) return null;

        const tier = getServiceTier(aiNode.serviceType);
        const row = tierTracker[tier]++;
        
        // Calculate Global Position
        // Add minimal offset (50) to start
        const x = 50 + (tier * TIER_WIDTH); 
        const y = 50 + (row * ROW_HEIGHT);

        const isContainer = serviceDef.isContainer;
        
        // Strictly use system default names
        const label = serviceDef.defaultConfig?.name || serviceDef.name;

        return {
          id: aiNode.id,
          type: isContainer ? 'groupNode' : 'awsService',
          position: { x, y }, // Global position initially
          data: {
            label: label, 
            serviceType: serviceDef.id,
            icon: serviceDef.icon,
            color: serviceDef.color,
            isContainer: isContainer,
            containerType: serviceDef.containerType,
            region: aiNode.region || 'us-east-1',
            config: { ...serviceDef.defaultConfig, ...(aiNode.config || {}) }
          },
          style: isContainer ? { width: 500, height: 350 } : undefined
        };
      }).filter(Boolean);

      // 2. Second pass: Handle VPC Grouping and Dynamic Sizing
      const vpcNode = nodes.find(n => n.data.serviceType === 'vpc');
      
      if (vpcNode) {
        // Find all nodes that SHOULD be in the VPC
        const vpcChildNodes = nodes.filter(n => 
          n.id !== vpcNode.id && VPC_REQUIRED_SERVICES.includes(n.data.serviceType)
        );

        if (vpcChildNodes.length > 0) {
          // Calculate Bounding Box of children
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          
          vpcChildNodes.forEach(node => {
            if (node.position.x < minX) minX = node.position.x;
            if (node.position.y < minY) minY = node.position.y;
            if (node.position.x > maxX) maxX = node.position.x;
            if (node.position.y > maxY) maxY = node.position.y;
          });

          // Add Padding
          const PADDING = 100;
          const vpcX = minX - PADDING;
          const vpcY = minY - PADDING;
          const vpcWidth = (maxX - minX) + (PADDING * 2) + 100; // Extra width for card size
          const vpcHeight = (maxY - minY) + (PADDING * 2) + 100; // Extra height for card size

          // Apply to VPC Node
          vpcNode.position = { x: vpcX, y: vpcY };
          vpcNode.style = { width: vpcWidth, height: vpcHeight };

          // 3. Third Pass: Reparent children and adjust to relative coordinates
          nodes = nodes.map(node => {
            if (node.id === vpcNode.id) return node;

            const isVPCRequired = VPC_REQUIRED_SERVICES.includes(node.data.serviceType);
            
            if (isVPCRequired) {
                return {
                    ...node,
                    parentId: vpcNode.id, // React Flow Parent ID
                    extent: 'parent',     // Constrain to parent
                    // Convert Global to Relative position
                    position: { 
                        x: node.position.x - vpcX, 
                        y: node.position.y - vpcY 
                    }
                };
            }
            return node;
          });
        } else {
            // Fallback if VPC exists but no children (empty VPC)
            vpcNode.position = { x: 300, y: 50 }; // Place roughly in middle tiers
        }
      }

      // 4. Create Edges
      const edges = data.connections.map((conn) => {
        const sourceNode = nodes.find(n => n.id === conn.source);
        const targetNode = nodes.find(n => n.id === conn.target);
        if (!sourceNode || !targetNode) return null;

        const defaults = getConnectionDefault(sourceNode.data.serviceType, targetNode.data.serviceType);

        return {
          id: `edge_${conn.source}_${conn.target}`,
          source: conn.source,
          target: conn.target,
          type: 'labeled',
          animated: true,
          data: { label: defaults.protocol, protocol: defaults.protocol, port: defaults.port }
        };
      }).filter(Boolean);

      return { nodes, edges }; 

    } catch (error) {
      lastError = error;
      const errorMsg = error.message || '';
      
      // Retry ONLY on 503 (Overloaded) or 500 (Internal Error)
      if (errorMsg.includes('503') || errorMsg.includes('overloaded') || errorMsg.includes('500')) {
        console.warn(`Gemini Busy. Retrying in 2s...`);
        retries--;
        await delay(2000); 
      } else {
        throw error; 
      }
    }
  }

  throw lastError;
};