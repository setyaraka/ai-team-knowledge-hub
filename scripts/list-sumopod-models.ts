import OpenAI from "openai";
import { env } from "../lib/env";

/**
 * Script to list available models on SumoPod AI.
 */
async function listModels() {
  const client = new OpenAI({
    apiKey: env.SUMOPOD_API_KEY || "sk-Pv8A3N7myoQBeUe5ifr7fQ",
    baseURL: "https://ai.sumopod.com/v1",
  });

  console.log("Fetching models from SumoPod AI...");
  
  try {
    const list = await client.models.list();
    
    console.log("\n--- Available SumoPod Models ---");
    list.data.forEach((model) => {
      console.log(`- ID: ${model.id} (Owner: ${model.owned_by})`);
    });

  } catch (error) {
    console.error("Failed to list models:", error);
  }
}

listModels();
