import asyncio
import websockets
import json
import os
from dotenv import load_dotenv
import aiohttp
from aiohttp import web
from supabase import create_client, Client
from google.cloud import aiplatform_v1
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Verify required environment variables
required_env_vars = ["GEMINI_API_KEY", "GOOGLE_CLOUD_PROJECT", "SUPABASE_URL", "SUPABASE_ANON_KEY"]
for var in required_env_vars:
    if not os.getenv(var):
        logger.error(f"Environment variable {var} is not set in .env file")
        exit(1)

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_ANON_KEY")
)

# Initialize Google AI Platform client
try:
    from google.cloud import aiplatform
    aiplatform.init(
        project=os.getenv("GOOGLE_CLOUD_PROJECT"),
        location="us-central1",
        credentials=None  # Use API key from environment
    )
except ImportError:
    logger.error("google-cloud-aiplatform not installed. Run 'pip install google-cloud-aiplatform'")
    exit(1)
except Exception as e:
    logger.error(f"Error initializing Google AI Platform: {e}")
    exit(1)

async def generate_embedding(text: str) -> list:
    """Generate embedding for text using Vertex AI Embeddings API."""
    try:
        client = aiplatform_v1.PredictionServiceClient()
        endpoint = client.endpoint_path(
            project=os.getenv("GOOGLE_CLOUD_PROJECT"),
            location="us-central1",
            endpoint="textembedding-gecko"
        )
        instance = {"content": text}
        response = client.predict(endpoint=endpoint, instances=[instance])
        return response.predictions[0]['embeddings']
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        return []

async def fetch_relevant_products(embedding: list, limit: int = 5) -> list:
    """Fetch relevant products from Supabase using pgvector similarity search."""
    try:
        response = await supabase.table("products").select(
            "id, name, price, image, rating, reviews, category, description"
        ).order("embedding <-> :embedding", params={"embedding": embedding}).limit(limit).execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Error fetching products from Supabase: {e}")
        return []

async def handle_websocket(websocket):
    logger.info("Client connected to WebSocket")

    async def process_text(text: str):
        """Process text input and return a transcript with RAG context."""
        try:
            if not text:
                raise ValueError("No text input provided")

            # Generate embedding for the input text
            embedding = await generate_embedding(text)
            if not embedding:
                raise ValueError("Failed to generate embedding")

            # Fetch relevant products for RAG
            products = await fetch_relevant_products(embedding)
            context = "\n".join([f"{p['name']}: {p['description']}" for p in products])

            # Return transcript with context
            response = {
                "serverContent": {
                    "outputTranscription": {
                        "text": f"User input: {text}\nRelevant products:\n{context}"
                    },
                    "turnComplete": True
                }
            }
            return response
        except Exception as e:
            logger.error(f"Error processing request: {e}")
            return {"error": str(e)}

    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                logger.info(f"Received message: {data}")
                text_input = data.get("text", "")

                response = await process_text(text_input)

                # Process response
                output_transcriptions = []

                if response.get("serverContent"):
                    server_content = response["serverContent"]
                    if server_content.get("outputTranscription", {}).get("text"):
                        output_transcriptions.append(server_content["outputTranscription"]["text"])

                    if server_content.get("turnComplete"):
                        await websocket.send(json.dumps({
                            "transcript": " ".join(output_transcriptions)
                        }))
                        logger.info(f"Sent response: {output_transcriptions}")
                elif response.get("error"):
                    await websocket.send(json.dumps({"error": response["error"]}))
                    logger.error(f"Sent error: {response['error']}")

            except json.JSONDecodeError:
                logger.error("Invalid JSON received")
                await websocket.send(json.dumps({"error": "Invalid JSON format"}))
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                await websocket.send(json.dumps({"error": str(e)}))
                
    except websockets.exceptions.ConnectionClosed as e:
        logger.info(f"Client disconnected: {e.code} {e.reason}")
    except Exception as e:
        logger.error(f"Error in WebSocket: {e}")
        try:
            await websocket.send(json.dumps({"error": "Failed to process request"}))
        except:
            pass  # WebSocket may already be closed

async def main():
    # Start WebSocket server with handshake timeout
    websocket_server = await websockets.serve(
        handle_websocket,
        "localhost",
        7861,
        ping_interval=30,
        ping_timeout=30,
        close_timeout=10
    )
    logger.info("WebSocket server started on ws://localhost:7861")

    # Start HTTP server
    app = web.Application()
    async def health_check(request):
        return web.Response(text="Server is running")
    app.router.add_get('/health', health_check)
    
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 3001)
    await site.start()
    logger.info("HTTP server started on http://localhost:3001")

    # Keep the event loop running
    await asyncio.Event().wait()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server shut down")
    except Exception as e:
        logger.error(f"Error starting server: {e}")