import { GoogleGenerativeAI } from "@google/generative-ai";
import { awsServices, getConnectionDefault } from '../data/awsServices';

export const generateArchitecture = async (prompt, apiKey) => {
  if (!apiKey) throw new Error("API Key is required for AI generation");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // 1. Construct System Prompt with strict constraints
  const serviceList = Object.values(awsServices).map(s => 
    `- ${s.id}: ${s.name} (Category: ${s.category})`
  ).join('\n');

  const systemInstruction = `
    You are an AWS Solutions Architect. 
    User Prompt: "${prompt}"
    
    Task: Generate a JSON object representing an AWS architecture.
    
    Rules:
    1. Use ONLY these service IDs: 
    ${serviceList}
    
    2. Return ONLY a valid JSON object with this exact structure:
    {
      "nodes": [
        { "id": "node_1", "type": "awsService", "serviceType": "ec2", "label": "Web Server" }
      ],
      "connections": [
        { "source": "node_1", "target": "node_2" }
      ]
    }
    
    3. Do NOT include markdown formatting (like \`\`\`json). Just the raw JSON string.
    4. Ensure connections follow AWS best practices (e.g., CloudFront -> ALB -> EC2 -> RDS).
  `;

  try {
    const result = await model.generateContent(systemInstruction);
    const response = await result.response;
    const text = response.text();
    
    // Clean up potential markdown formatting
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonString);

    // 5. Post-Process: Add visual properties (Colors, Icons, Positions)
    const nodes = data.nodes.map((node, index) => {
      const serviceDef = awsServices[node.serviceType];
      if (!serviceDef) return null; // Skip invalid services

      // Simple tiered positioning logic
      const tierMap = { 
        networking: 100, 
        security: 100, 
        compute: 400, 
        messaging: 400,
        container: 400, 
        database: 800, 
        storage: 800, 
        analytics: 800 
      };
      
      // Calculate position with some variance to avoid stacking
      const x = tierMap[serviceDef.category] || 400;
      const y = 100 + (index * 120);

      return {
        id: node.id,
        type: 'awsService',
        position: { x, y },
        data: {
          label: node.label || serviceDef.name,
          serviceType: node.serviceType,
          icon: serviceDef.icon,
          color: serviceDef.color,
          config: { ...serviceDef.defaultConfig }
        }
      };
    }).filter(Boolean);

    // 6. Post-Process: Add Edge Metadata (Ports/Protocols)
    const edges = data.connections.map(conn => {
        const sourceNode = nodes.find(n => n.id === conn.source);
        const targetNode = nodes.find(n => n.id === conn.target);
        
        if (!sourceNode || !targetNode) return null;

        const connectionMeta = getConnectionDefault(
            sourceNode.data.serviceType, 
            targetNode.data.serviceType
        );

        return {
            id: `edge_${conn.source}_${conn.target}`,
            source: conn.source,
            target: conn.target,
            type: 'labeled',
            animated: true,
            data: { 
                label: connectionMeta.protocol,
                protocol: connectionMeta.protocol,
                port: connectionMeta.port
            }
        };
    }).filter(Boolean);

    return { nodes, edges };

  } catch (error) {
    console.error("AI Generation Failed:", error);
    throw new Error("AI failed to generate a valid design. " + error.message);
  }
};