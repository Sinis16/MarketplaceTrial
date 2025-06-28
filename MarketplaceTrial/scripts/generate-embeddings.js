import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  "https://kwtdbcbrqlmytwisgqil.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3dGRiY2JycWxteXR3aXNncWlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMzg5NjUsImV4cCI6MjA2NjYxNDk2NX0.a3CbVKSIEDk64uuqSOmDCj4TntSCp4gL6sBFg6y1XDU"
);

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyAG2MRt8Ttdgd0sBH0ouy5_giqyYhrTAS0");
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

async function generateEmbeddings() {
  try {
    // Fetch all products from Supabase
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, description");

    if (error) {
      console.error("Error fetching products from Supabase:", error);
      return;
    }

    if (!products || products.length === 0) {
      console.log("No products found in Supabase.");
      return;
    }

    console.log(`Found ${products.length} products to process.`);

    // Generate embeddings for each product
    for (const product of products) {
      try {
        const result = await embeddingModel.embedContent({
          content: { parts: [{ text: `${product.name} ${product.description}` }] },
          taskType: "RETRIEVAL_DOCUMENT",
        });
        const embedding = result.embedding.values;

        // Update the product with the generated embedding
        const { error: updateError } = await supabase
          .from("products")
          .update({ embedding })
          .eq("id", product.id);

        if (updateError) {
          console.error(`Error updating embedding for ${product.name}:`, updateError);
        } else {
          console.log(`Embedded and stored: ${product.name}`);
        }
      } catch (embedError) {
        console.error(`Error embedding ${product.name}:`, embedError);
      }
    }

    console.log("Embedding process completed.");
  } catch (error) {
    console.error("Error in generateEmbeddings:", error);
  }
}

// Run the function
generateEmbeddings().catch(console.error);