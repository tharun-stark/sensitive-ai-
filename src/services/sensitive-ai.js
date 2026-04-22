/* global process, console */
import { GoogleGenAI, Type } from "@google/genai";

const DEFAULT_API_KEY = process.env.SENSITIVE_AI_API_KEY || "";

export const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    emotion: {
      type: Type.STRING,
      description: "The detected facial emotion (happy, sad, angry, neutral, surprised, etc.)",
    },
    activity: {
      type: Type.STRING,
      description: "The detected physical activity (walking, running, talking, exercising, hand gestures, sitting, etc.)",
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence score from 0 to 1",
    },
    details: {
      type: Type.STRING,
      description: "Brief description of the visual cues observed",
    },
  },
  required: ["emotion", "activity", "confidence", "details"],
};

export async function analyzeFrame(base64Image, customApiKey) {
  const apiKey = customApiKey || DEFAULT_API_KEY;
  if (!apiKey) {
    console.error("No Sensitive AI API key provided.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            { text: "Analyze this frame for human emotion and physical activity. Return the result in JSON format." },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image.split(",")[1],
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Sensitive AI Analysis Error:", error);
    return null;
  }
}
