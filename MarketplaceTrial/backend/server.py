import asyncio
import websockets
import json
import os
from dotenv import load_dotenv
import aiohttp
from aiohttp import web

# Check for google-cloud-aiplatform availability
try:
    from google.cloud import aiplatform
except ImportError:
    print("Error: google-cloud-aiplatform not installed. Run 'pip install google-cloud-aiplatform'")
    exit(1)

# Load environment variables
load_dotenv()

# Verify required environment variables
required_env_vars = ["GEMINI_API_KEY", "GOOGLE_CLOUD_PROJECT"]
for var in required_env_vars:
    if not os.getenv(var):
        print(f"Error: Environment variable {var} is not set in .env file")
        exit(1)

# Initialize Google AI Platform client
try:
    aiplatform.init(
        project=os.getenv("GOOGLE_CLOUD_PROJECT"),
        location="us-central1",
        credentials=None  # Use API key from environment
    )
except Exception as e:
    print(f"Error initializing Google AI Platform: {e}")
    exit(1)

async def handle_websocket(websocket, path):
    print("Client connected to WebSocket")
    
    # Configure Gemini Live session (placeholder, as Gemini Live API is in preview)
    endpoint = f"projects/{os.getenv('GOOGLE_CLOUD_PROJECT')}/locations/us-central1/endpoints/gemini-2.0-flash-live-preview-04-09"
    config = {
        "response_modalities": ["AUDIO", "TEXT"],
        "speech_config": {
            "voice_config": {
                "prebuilt_voice_config": {"voice_name": "Aoede"}
            }
        }
    }

    async def send_to_gemini(message):
        # Placeholder for Gemini Live API call
        # Replace with actual API call once Gemini Live SDK documentation is available
        try:
            response = {
                "serverContent": {
                    "outputTranscription": {"text": message.get("text", "")},
                    "modelTurn": {
                        "parts": [
                            {"inlineData": {"data": "", "mime_type": "audio/webm"}}  # Placeholder for audio response
                        ]
                    },
                    "turnComplete": True
                }
            }
            return response
        except Exception as e:
            print(f"Error processing Gemini API request: {e}")
            return {"error": str(e)}

    try:
        async for message in websocket:
            data = json.loads(message)
            audio_data = data.get("audio")
            text_input = data.get("text", "")

            # Prepare message for Gemini Live
            msg = {
                "client_content": {
                    "turns": [{
                        "role": "user",
                        "parts": [
                            {"inline_data": {"data": audio_data, "mime_type": "audio/webm"}} if audio_data else None,
                            {"text": text_input} if text_input else None
                        ]
                    }],
                    "turn_complete": True
                }
            }
            msg["client_content"]["turns"][0]["parts"] = [p for p in msg["client_content"]["turns"][0]["parts"] if p]

            # Send to Gemini Live (simulated)
            response = await send_to_gemini(msg)

            # Process response
            output_transcriptions = []
            responses = []

            if response.get("serverContent"):
                server_content = response["serverContent"]
                if server_content.get("outputTranscription", {}).get("text"):
                    output_transcriptions.append(server_content["outputTranscription"]["text"])
                if server_content.get("modelTurn", {}).get("parts"):
                    for part in server_content["modelTurn"]["parts"]:
                        if part.get("inlineData", {}).get("data"):
                            responses.append(part["inlineData"]["data"])

                if server_content.get("turnComplete"):
                    await websocket.send(json.dumps({
                        "transcript": " ".join(output_transcriptions),
                        "audio": responses[0] if responses else None
                    }))

    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")
    except Exception as e:
        print(f"Error in WebSocket: {e}")
        await websocket.send(json.dumps({"error": "Failed to process request"}))

async def main():
    # Start WebSocket server
    websocket_server = await websockets.serve(handle_websocket, "localhost", 7861)
    print("WebSocket server started on ws://localhost:7861")

    # Start HTTP server
    app = web.Application()
    async def health_check(request):
        return web.Response(text="Server is running")
    app.router.add_get('/health', health_check)
    
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 3001)
    await site.start()
    print("HTTP server started on http://localhost:3001")

    # Keep the event loop running
    await asyncio.Event().wait()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Server shut down")
    except Exception as e:
        print(f"Error starting server: {e}")
