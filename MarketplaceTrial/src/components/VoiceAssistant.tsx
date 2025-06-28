import React, { useState, useEffect, useRef } from "react";
import { Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VoiceAssistantProps {
  onAddToCart: (product: {
    id: string;
    name: string;
    price: number;
    image: string;
    rating: number;
    reviews: number;
    category: string;
    description: string;
  }) => void;
  onFilterProducts: (query: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onAddToCart,
  onFilterProducts,
  isOpen,
  onClose,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [realTimeTranscript, setRealTimeTranscript] = useState<string>("");
  const [serverResponse, setServerResponse] = useState<string>("");
  const [error, setError] = useState<string>("");
  const { toast } = useToast();
  // Add SpeechRecognition type for TypeScript
  type SpeechRecognitionType = typeof window.SpeechRecognition extends undefined
    ? typeof window.webkitSpeechRecognition
    : typeof window.SpeechRecognition;
  const recognitionRef = useRef<InstanceType<SpeechRecognitionType> | null>(
    null
  );
  const wsRef = useRef<WebSocket | null>(null);
  const isManuallyStopped = useRef<boolean>(false);
  const isStarting = useRef<boolean>(false);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 3;

  useEffect(() => {
    if (!isOpen) {
      setIsListening(false);
      setTranscript("");
      setRealTimeTranscript("");
      setServerResponse("");
      setError("");
      stopLiveSession();
      return;
    }

    if (isListening) {
      startLiveSession();
    } else {
      stopLiveSession();
    }

    return () => {
      stopLiveSession();
    };
  }, [isListening, isOpen]);

  const checkMicrophonePermission = async (): Promise<boolean> => {
    try {
      const permissionStatus = await navigator.permissions.query({
        name: "microphone",
      });
      return permissionStatus.state === "granted";
    } catch (err) {
      console.error("Error checking microphone permission:", err);
      return false;
    }
  };

  const connectWebSocket = () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setError("Unable to connect to voice server after multiple attempts");
      toast({
        title: "Voice Error",
        description:
          "Unable to connect to voice server after multiple attempts",
        variant: "destructive",
      });
      setIsListening(false);
      return;
    }

    wsRef.current = new WebSocket("ws://localhost:7861");
    wsRef.current.onopen = () => {
      console.log("WebSocket connected for voice assistant");
      reconnectAttempts.current = 0;
    };

    wsRef.current.onmessage = async (event) => {
      try {
        const response = JSON.parse(event.data);
        console.log("Received WebSocket message:", response);
        if (response.transcript) {
          setServerResponse(response.transcript);
        } else if (response.error) {
          setError(`Server error: ${response.error}`);
          toast({
            title: "Voice Error",
            description: `Server error: ${response.error}`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
        setError("Invalid response from server");
        toast({
          title: "Voice Error",
          description: "Invalid response from server",
          variant: "destructive",
        });
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("Failed to connect to voice server");
      reconnectAttempts.current += 1;
      setTimeout(connectWebSocket, 2000 * reconnectAttempts.current);
    };

    wsRef.current.onclose = (event) => {
      console.log("WebSocket closed:", event.code, event.reason);
      reconnectAttempts.current += 1;
      setTimeout(connectWebSocket, 2000 * reconnectAttempts.current);
    };
  };

  const startRecognition = () => {
    if (isStarting.current || !recognitionRef.current) return;
    isStarting.current = true;
    try {
      recognitionRef.current.start();
      console.log("Speech recognition started");
      setError("");
      isStarting.current = false;
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setError(`Failed to start speech recognition: ${error.message}`);
      isStarting.current = false;
      if (isListening && !isManuallyStopped.current) {
        setTimeout(startRecognition, 2000);
      }
    }
  };

  const startLiveSession = async () => {
    try {
      // Check microphone permission
      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) {
        setError("Please allow microphone access in your browser settings.");
        toast({
          title: "Voice Error",
          description:
            "Please allow microphone access in your browser settings.",
          variant: "destructive",
        });
        setIsListening(false);
        return;
      }

      // Initialize SpeechRecognition
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error("Speech recognition not supported in this browser");
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      let finalTranscript = "";

      recognitionRef.current.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
            setRealTimeTranscript(finalTranscript.trim());
            console.log("Speech recognition result:", transcript);
            // Send to server
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ text: transcript }));
              console.log("Sent transcript to server:", transcript);
            }
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setError(`Speech recognition: ${event.error}`);
        if (
          event.error === "not-allowed" ||
          event.error === "service-not-allowed"
        ) {
          toast({
            title: "Voice Error",
            description: `Speech recognition failed: ${event.error}. Please check microphone permissions.`,
            variant: "destructive",
          });
          setIsListening(false);
          stopLiveSession();
        } else if (isListening && !isManuallyStopped.current) {
          console.log(`Retrying speech recognition due to ${event.error}...`);
          setTimeout(startRecognition, 2000);
        }
      };

      recognitionRef.current.onend = () => {
        if (isListening && !isManuallyStopped.current) {
          console.log("Speech recognition ended unexpectedly, restarting...");
          setTimeout(startRecognition, 2000);
        } else if (finalTranscript) {
          setTranscript(finalTranscript.trim());
          console.log("Final transcript:", finalTranscript.trim());
        }
      };

      isManuallyStopped.current = false;
      startRecognition();
      connectWebSocket();
    } catch (error) {
      console.error("Error starting live session:", error);
      setError(`Could not start live session: ${error.message}`);
      toast({
        title: "Voice Error",
        description: `Could not start live session: ${error.message}`,
        variant: "destructive",
      });
      setIsListening(false);
    }
  };

  const stopLiveSession = () => {
    if (recognitionRef.current) {
      isManuallyStopped.current = true;
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
      recognitionRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsListening(false);
    isStarting.current = false;
    console.log("Live session stopped");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 w-80">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-dark-primary">
          Voice Assistant
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>
      <Button
        onClick={() => setIsListening((prev) => !prev)}
        className={`w-full ${
          isListening
            ? "bg-red-500 hover:bg-red-600"
            : "bg-orange-primary hover:bg-orange-primary/90"
        }`}
      >
        <Mic className="w-5 h-5 mr-2" />
        {isListening ? "Stop Listening" : "Start Voice Search"}
      </Button>
      <p className="text-sm text-gray-600 mt-2">
        Try saying: "Add headphones to cart" or "Find electronics"
      </p>
      {isListening && (
        <p className="text-sm text-gray-800 mt-2">Listening...</p>
      )}
      {isListening && realTimeTranscript && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-dark-primary">Hearing:</h4>
          <p className="text-sm text-gray-800">{realTimeTranscript}</p>
        </div>
      )}
      {!isListening && transcript && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-dark-primary">Heard:</h4>
          <p className="text-sm text-gray-800">{transcript}</p>
        </div>
      )}
      {serverResponse && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-dark-primary">
            Server Response:
          </h4>
          <p className="text-sm text-gray-800">{serverResponse}</p>
        </div>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default VoiceAssistant;
