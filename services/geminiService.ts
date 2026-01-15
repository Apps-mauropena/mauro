
import { GoogleGenAI, Type } from "@google/genai";
import { ProjectConfig, AIUpdates } from "../types";

export const processNaturalLanguage = async (prompt: string, currentConfig: ProjectConfig): Promise<AIUpdates | null> => {
  // Always initialize GoogleGenAI inside the function to use the latest API key from process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    Eres el asistente técnico de "Renueva Koba". Extrae cambios de presupuesto de forma lógica.
    
    REGLA DE RENDIMIENTO MATERIAL: El rendimiento del impermeabilizante es siempre 34 m2 por cubeta.
    
    REGLA DE RENDIMIENTO TRABAJO: El rendimiento es de 33.3 m2 por día. 
    Fórmula: Días = Math.ceil(m2 / 33.3). Mínimo 1 día.
    Cada vez que el usuario cambie los m2, debes calcular y sugerir los días de trabajo correspondientes.
    
    REGLA DE ALBAÑILERÍA: Detecta si el usuario menciona paredes rotas, grietas profundas o daños estructurales para activar "masonryRepairEnabled" y asignar un "masonryRepairCost".
    
    Campos: m2, selectedMaterial (Impermeabilizante/Pintura), yield, price, brand, profitRate, numWorkers, workerDailyRate, workDays, scaffoldCount, scaffoldDailyRate, scaffoldDays, masonryRepairEnabled, masonryRepairCost.
  `;

  try {
    const response = await ai.models.generateContent({
      // Use gemini-3-pro-preview for tasks involving logic and specific reasoning rules
      model: "gemini-3-pro-preview",
      contents: `Contexto actual: ${JSON.stringify(currentConfig)}. Petición: ${prompt}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            m2: { type: Type.NUMBER },
            selectedMaterial: { type: Type.STRING },
            yield: { type: Type.NUMBER },
            price: { type: Type.NUMBER },
            brand: { type: Type.STRING },
            profitRate: { type: Type.NUMBER },
            numWorkers: { type: Type.NUMBER },
            workerDailyRate: { type: Type.NUMBER },
            workDays: { type: Type.NUMBER },
            scaffoldCount: { type: Type.NUMBER },
            scaffoldDailyRate: { type: Type.NUMBER },
            scaffoldDays: { type: Type.NUMBER },
            masonryRepairEnabled: { type: Type.BOOLEAN },
            masonryRepairCost: { type: Type.NUMBER }
          }
        }
      }
    });

    // Access the .text property directly as it is a getter (not a method)
    return response.text ? JSON.parse(response.text.trim()) : null;
  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
};
