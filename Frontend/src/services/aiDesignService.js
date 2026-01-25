// import { GoogleGenAI } from "@google/genai";
// import { awsServices, getConnectionDefault, containerTypes } from '../data/awsServices';

// // Helper: Simple wait function
// const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// // Services that must be inside a VPC (Synced with DesignCanvas rules)
// const VPC_REQUIRED_SERVICES = [
//     'ec2', 'ecs', 'eks', 'lambda', 'rds', 'elasticache', 'alb', 'nlb', 
//     'aurora', 'redshift', 'opensearch', 'mq', 'msk', 'batch', 'lightsail',
//     'apprunner', 'nat_gateway', 'efs'
// ];

// export const generateArchitecture = async (userPrompt) => {

//   const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_AI_API_KEY }); // put This API in .env 

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
//   // We retry on 503 (Server Error) but NOT on 429 (Quota)
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
//           // Disable Safety filters to prevent false positives on technical prompts
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
//       // Added 'infrastructure' for VPC positioning
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
//         // Basic layout logic
//         const x = 100 + (tier * 350);
//         const y = 100 + (rowTracker[tier]++ * 150);

//         const isContainer = serviceDef.isContainer;
        
//         return {
//           id: aiNode.id,
//           type: isContainer ? 'groupNode' : 'awsService', // Use groupNode for VPC
//           position: { x, y },
//           data: {
//             label: aiNode.config?.name || serviceDef.name,
//             serviceType: serviceDef.id,
//             icon: serviceDef.icon,
//             color: serviceDef.color,
//             isContainer: isContainer, // Flag for GroupNode
//             containerType: serviceDef.containerType,
//             region: aiNode.region || 'us-east-1',
//             config: { ...serviceDef.defaultConfig, ...(aiNode.config || {}) }
//           },
//           // Set initial dimensions for containers (will be adjusted if it's a VPC)
//           style: isContainer ? { width: 500, height: 350 } : undefined
//         };
//       }).filter(Boolean);

//       // 2. Second pass: Handle VPC Grouping
//       const vpcNode = nodes.find(n => n.data.serviceType === 'vpc');
      
//       if (vpcNode) {
//         // Move VPC to top-left to encompass other nodes
//         vpcNode.position = { x: 50, y: 50 };
//         // Make VPC large enough to hold the generated architecture
//         // (Rough calculation based on rows/tiers used)
//         vpcNode.style = { width: 1400, height: 1000 }; 

//         // Assign relevant services to this VPC
//         nodes = nodes.map(node => {
//             // Skip the VPC itself and non-VPC services (like S3/CloudFront/Route53 usually)
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

//       return { nodes, edges }; // Success!

//     } catch (error) {
//       lastError = error;
//       const errorMsg = error.message || '';
      
//       // Retry ONLY on 503 (Overloaded) or 500 (Internal Error)
//       if (errorMsg.includes('503') || errorMsg.includes('overloaded') || errorMsg.includes('500')) {
//         console.warn(`Gemini Busy. Retrying in 2s...`);
//         retries--;
//         await delay(2000); 
//       } else {
//         throw error; // Throw immediately for other errors
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
    'ec2', 'ecs', 'eks', 'lambda', 'rds', 'elasticache', 'alb', 'nlb', 
    'aurora', 'redshift', 'opensearch', 'mq', 'msk', 'batch', 'lightsail',
    'apprunner', 'nat_gateway', 'efs'
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

      // --- HYDRATION (Apply Icons/Colors/Defaults) ---
      const tierMap = { 
        'infrastructure': 0,
        'networking': 0, 
        'security': 0, 
        'compute': 1, 
        'container': 1, 
        'database': 2, 
        'storage': 2, 
        'messaging': 2, 
        'analytics': 3 
      };
      const rowTracker = { 0: 0, 1: 0, 2: 0, 3: 0 };

      // 1. First pass: Create all nodes
      let nodes = data.nodes.map((aiNode) => {
        const serviceDef = allServices[aiNode.serviceType];
        if (!serviceDef) return null;

        const tier = tierMap[serviceDef.category] || 1;
        const x = 100 + (tier * 350);
        const y = 100 + (rowTracker[tier]++ * 150);

        const isContainer = serviceDef.isContainer;
        
        // Match Manual Add Logic: Use config name first, then default config name, then service name
        const label = aiNode.config?.name || serviceDef.defaultConfig?.name || serviceDef.name;

        return {
          id: aiNode.id,
          type: isContainer ? 'groupNode' : 'awsService',
          position: { x, y },
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

      // 2. Second pass: Handle VPC Grouping
      const vpcNode = nodes.find(n => n.data.serviceType === 'vpc');
      
      if (vpcNode) {
        // Move VPC to top-left to encompass other nodes
        vpcNode.position = { x: 50, y: 50 };
        // Make VPC large enough to hold the generated architecture
        vpcNode.style = { width: 1400, height: 1000 }; 

        // Assign relevant services to this VPC
        nodes = nodes.map(node => {
            if (node.id === vpcNode.id) return node;

            const isVPCRequired = VPC_REQUIRED_SERVICES.includes(node.data.serviceType);
            
            if (isVPCRequired) {
                return {
                    ...node,
                    parentId: vpcNode.id, // React Flow Parent ID
                    extent: 'parent',     // Constrain to parent
                    // Adjust position to be relative to the VPC (VPC is at 50,50)
                    position: { 
                        x: node.position.x - 50, 
                        y: node.position.y - 50 
                    }
                };
            }
            return node;
        });
      }

      // 3. Create Edges
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