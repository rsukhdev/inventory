
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeFabricImage(base64Image: string) {
  const model = 'gemini-3-flash-preview';
  
  const prompt = "Analyze this fabric image. Provide a detailed description including potential material composition, weave pattern, and color. Format the response as a JSON object with properties: 'name', 'estimatedComposition', 'weaveType', 'suggestedColor', and 'description'.";

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] || base64Image
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          estimatedComposition: { type: Type.STRING },
          weaveType: { type: Type.STRING },
          suggestedColor: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["name", "estimatedComposition", "weaveType", "suggestedColor", "description"]
      }
    }
  });

  return JSON.parse(response.text);
}
