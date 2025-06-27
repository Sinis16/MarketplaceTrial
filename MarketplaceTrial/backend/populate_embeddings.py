import asyncio
from supabase import create_client
from google.generative_ai import GenerativeModel
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize Supabase and Google AI clients
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_ANON_KEY"))
model = GenerativeModel("text-embedding-004")

async def populate_embeddings():
    # Fetch products without embeddings
    response = await supabase.table("products").select(
        "id, name, description"
    ).execute()
    products = response.data or []

    for product in products:
        # Generate embedding
        text = f"{product['name']}: {product['description']}"
        result = await model.embed_content_async(text)
        embedding = result.embedding.values

        # Update product with embedding
        await supabase.table("products").update({
            "embedding": embedding
        }).eq("id", product["id"]).execute()
        print(f"Stored embedding for product: {product['name']}")

# Run the script
asyncio.run(populate_embeddings())