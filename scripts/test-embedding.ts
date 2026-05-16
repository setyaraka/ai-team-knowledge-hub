import { embedText } from "../lib/ai/gemini";

async function testEmbeddingSize() {
  console.log("Testing embedding dimension size...");
  try {
    const embedding = await embedText("Hello world");
    console.log(`Embedding dimension: ${embedding.length}`);
    if (embedding.length === 768) {
      console.log("SUCCESS: Embedding dimension matches database (768).");
    } else {
      console.error(`FAILURE: Expected 768, got ${embedding.length}`);
    }
  } catch (error) {
    console.error("Embedding failed:", error);
  }
}

testEmbeddingSize();
