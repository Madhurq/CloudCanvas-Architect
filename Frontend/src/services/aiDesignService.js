import { GoogleGenAI } from "@google/genai";
import { awsServices, getConnectionDefault } from '../data/awsServices';

// Helper: Simple wait function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const generateArchitecture = async (userPrompt) => {

  const ai = new GoogleGenAI({ apiKey: process.env.AI_API_KEY }); // put This API in .env 

  // 1. Build Strict Menu (IDs only to save bandwidth)
  const validServicesList = Object.values(awsServices).map(s => `"${s.id}"`).join(', ');

  const systemInstruction = `
    You are an AWS Solution Architect.
    
    INPUT: "${userPrompt}"
    
    STRICT RULES:
    1. Use ONLY these service IDs: [${validServicesList}]
    2. Output strict JSON structure:
    {
      "nodes": [
        { "id": "n1", "serviceType": "ec2", "region": "us-east-1", "config": {} }
      ],
      "connections": [
        { "source": "n1", "target": "n2" }
      ]
    }
    3. BEHAVIOR:
    - If user specifies a region (e.g. "Tokyo"), set "region" to "ap-northeast-1".
    - If user asks for "3 servers", return 3 distinct nodes.
    - Return RAW JSON only. No markdown.
  `;

  // --- RETRY LOOP (For Stability Only) ---
  // We retry on 503 (Server Error) but NOT on 429 (Quota)
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
          // Disable Safety filters to prevent false positives on technical prompts
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
      const tierMap = { 'networking': 0, 'security': 0, 'compute': 1, 'container': 1, 'database': 2, 'storage': 2, 'messaging': 2, 'analytics': 3 };
      const rowTracker = { 0: 0, 1: 0, 2: 0, 3: 0 };

      const nodes = data.nodes.map((aiNode) => {
        const serviceDef = awsServices[aiNode.serviceType];
        if (!serviceDef) return null;

        const tier = tierMap[serviceDef.category] || 1;
        const x = 100 + (tier * 350);
        const y = 100 + (rowTracker[tier]++ * 150);

        return {
          id: aiNode.id,
          type: 'awsService',
          position: { x, y },
          data: {
            label: serviceDef.name, // Force Default Name
            serviceType: serviceDef.id,
            icon: serviceDef.icon,
            color: serviceDef.color,
            region: aiNode.region || 'us-east-1',
            config: { ...serviceDef.defaultConfig, ...(aiNode.config || {}) }
          }
        };
      }).filter(Boolean);

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

      return { nodes, edges }; // Success!

    } catch (error) {
      lastError = error;
      const errorMsg = error.message || '';
      
      // Retry ONLY on 503 (Overloaded) or 500 (Internal Error)
      // We FAIL FAST on 401 (Auth) or 429 (Quota)
      if (errorMsg.includes('503') || errorMsg.includes('overloaded') || errorMsg.includes('500')) {
        console.warn(`Gemini Busy. Retrying in 2s...`);
        retries--;
        await delay(2000); 
      } else {
        throw error; // Throw immediately for other errors
      }
    }
  }

  throw lastError;
};