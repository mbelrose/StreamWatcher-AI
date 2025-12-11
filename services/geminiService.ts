import { GoogleGenAI } from "@google/genai";
import { ChannelStatus } from "../types";

const apiKey = process.env.API_KEY;

// We use a singleton pattern for the AI client to avoid re-initialization
let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiClient) {
    if (!apiKey) {
      throw new Error("API Key is missing. Please ensure process.env.API_KEY is available.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

export const checkChannelStatus = async (channelName: string): Promise<Partial<ChannelStatus>> => {
  const ai = getAiClient();
  const modelId = "gemini-2.5-flash"; // Efficient for this task

  // Prompt designed to leverage Google Search grounding for real-time status
  const prompt = `
    I need to know if the Twitch channel '${channelName}' is currently live streaming right now.
    Search for "is ${channelName} live on twitch right now" or "current stream status ${channelName} twitch".
    
    If they are live, try to find the stream title and game being played.
    
    Return a strictly valid JSON object with the following keys:
    - isLive: boolean (true if currently live, false otherwise)
    - title: string (the stream title if live, else empty)
    - game: string (the game/category being played if live, else empty)
    
    Do not return markdown formatting, just the raw JSON string.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // We use a low temperature for deterministic data extraction
        temperature: 0.1, 
      },
    });

    const text = response.text || "{}";
    
    // Clean up markdown code blocks if present
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const data = JSON.parse(cleanText);
      return {
        name: channelName,
        isLive: !!data.isLive,
        title: data.title || "Unknown Title",
        game: data.game || "Unknown Game",
        lastChecked: Date.now()
      };
    } catch (parseError) {
      console.warn(`Failed to parse JSON for ${channelName}:`, text);
      // Fallback: simple heuristic check on text if JSON parsing fails
      const isLiveText = text.toLowerCase().includes("is live") || text.toLowerCase().includes("currently streaming");
      return {
        name: channelName,
        isLive: isLiveText,
        lastChecked: Date.now()
      };
    }

  } catch (error) {
    console.error(`Error checking status for ${channelName}:`, error);
    return {
      name: channelName,
      isLive: false,
      lastChecked: Date.now()
    };
  }
};
