import { env } from "../lib/env";

/**
 * Script to call ModelService.ListModels via the Gemini REST API.
 * This lists all available models for the provided GEMINI_API_KEY.
 */
async function listModels() {
  const apiKey = env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  console.log("Fetching models from Gemini API...");
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", JSON.stringify(errorData, null, 2));
      return;
    }

    const data = await response.json() as { models: any[] };
    
    console.log("\n--- Available Gemini Models ---");
    data.models.forEach((model: any) => {
      console.log(`- Name: ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(`  Description: ${model.description}`);
      console.log(`  Supported Actions: ${model.supportedGenerationMethods.join(", ")}`);
      console.log("-------------------------------");
    });

  } catch (error) {
    console.error("Failed to call ListModels:", error);
  }
}

listModels();
