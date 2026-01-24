import { GoogleGenAI } from "@google/genai";
import { awsServices, getConnectionDefault } from '../data/awsServices';

export const generateArchitecture = async (userPrompt, apiKey) => {
  if (!apiKey) throw new Error("API Key is required for AI generation");

  const ai = new GoogleGenAI({ apiKey: apiKey });

  // 1. Build the "Menu" of valid services
  // We keep it lean to save tokens
  const validServicesList = Object.values(awsServices).map(s => 
    `"${s.id}": ${s.name}`
  ).join(', ');

  // 2. Construct the System Prompt
  const systemInstruction = `
    You are an AWS Architecture Generator.
    CONTEXT: The user wants: "${userPrompt}"
    
    STRICT CONSTRAINTS:
    1. Use ONLY these service IDs: [${validServicesList}]
    2. Output a valid JSON object with this structure:
    {
      "nodes": [
        { 
          "id": "node_1", 
          "serviceType": "ec2", 
          "region": "us-east-1", 
          "config": { "instanceType": "t3.medium" } 
        }
      ],
      "connections": [
        { "source": "node_1", "target": "node_2" }
      ]
    }
    3. RULES:
    - If user specifies a region (e.g. Tokyo), set "region" to AWS code (e.g. ap-northeast-1). Default is us-east-1.
    - If user asks for "3 instances", create 3 separate nodes.
    - "serviceType" MUST be one of the IDs listed above.
    - Do NOT include markdown (\`\`\`json). Return raw JSON only.
  `;

  try {
    console.log("Sending prompt to Gemini...");

    // 3. Call Gemini with SAFETY SETTINGS DISABLED
    // This prevents "Empty Response" errors caused by false positives
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

    // 4. Handle Response
    // In new SDK, .text is a getter. If blocked, it might be null.
    const text = response.text; 
    
    if (!text) {
      // Log detailed debug info if empty
      console.error("Gemini Response Empty. Full Object:", JSON.stringify(response, null, 2));
      throw new Error("AI returned an empty response. This is likely a Safety Filter block or model issue.");
    }

    // 5. Clean and Parse
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);

    if (!data.nodes || !data.connections) {
      throw new Error("Invalid JSON structure received from AI.");
    }

    // 6. Post-Process: Hydrate with Defaults
    const tierMap = {
        'networking': 0, 'security': 0,
        'compute': 1, 'container': 1,
        'database': 2, 'storage': 2, 'messaging': 2,
        'analytics': 3
    };
    const rowTracker = { 0: 0, 1: 0, 2: 0, 3: 0 };

    const nodes = data.nodes.map((aiNode) => {
      const serviceDef = awsServices[aiNode.serviceType];
      
      if (!serviceDef) {
        console.warn(`AI suggested unknown service: ${aiNode.serviceType}`);
        return null;
      }

      // Position Calculation
      const tier = tierMap[serviceDef.category] || 1;
      const x = 100 + (tier * 350);
      const y = 100 + (rowTracker[tier]++ * 150);

      return {
        id: aiNode.id,
        type: 'awsService',
        position: { x, y },
        data: {
          // FORCE DEFAULT NAME: e.g., "EC2 Instance" even if AI said "Tokyo Server"
          label: serviceDef.name, 
          
          serviceType: serviceDef.id,
          icon: serviceDef.icon,
          color: serviceDef.color,
          
          // Apply AI's region or fallback
          region: aiNode.region || 'us-east-1',
          
          // Merge AI configs (e.g. instance count) onto Defaults
          config: { 
            ...serviceDef.defaultConfig, 
            ...(aiNode.config || {}) 
          }
        }
      };
    }).filter(Boolean);

    // 7. Post-Process: Connections
    const edges = data.connections.map((conn) => {
      const sourceNode = nodes.find(n => n.id === conn.source);
      const targetNode = nodes.find(n => n.id === conn.target);

      if (!sourceNode || !targetNode) return null;

      const defaults = getConnectionDefault(
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
          label: defaults.protocol,
          protocol: defaults.protocol,
          port: defaults.port
        }
      };
    }).filter(Boolean);

    return { nodes, edges };

  } catch (error) {
    console.error("AI Generation Error details:", error);
    throw new Error(`AI Generation Failed: ${error.message}`);
  }
};