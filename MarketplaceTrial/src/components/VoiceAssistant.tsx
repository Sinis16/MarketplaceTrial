import React, { useState, useEffect, useRef } from "react";
import { Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { sampleProducts } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";

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
  const { toast } = useToast();
  const genAI = new GoogleGenerativeAI(
    import.meta.env.VITE_GEMINI_API_KEY || "your_actual_gemini_api_key"
  );
  const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsListening(false);
      return;
    }

    if (isListening) {
      startLiveSession();
    } else if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isListening, isOpen]);

  const startLiveSession = async () => {
    try {
      wsRef.current = new WebSocket("ws://localhost:7861");
      wsRef.current.onopen = () => {
        console.log("WebSocket connected for voice assistant");
      };

      wsRef.current.onmessage = async (event) => {
        const response = JSON.parse(event.data);
        if (response.transcript) {
          const transcript = response.transcript.toLowerCase();
          await handleTranscript(transcript);
        } else if (response.error) {
          toast({
            title: "Voice Error",
            description: response.error,
            variant: "destructive",
          });
          setIsListening(false);
        }
      };

      wsRef.current.onerror = () => {
        toast({
          title: "Voice Error",
          description: "Failed to connect to voice server.",
          variant: "destructive",
        });
        setIsListening(false);
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket closed");
        setIsListening(false);
      };
    } catch (error) {
      toast({
        title: "Voice Error",
        description: "Could not start live session.",
        variant: "destructive",
      });
      setIsListening(false);
    }
  };

  const handleTranscript = async (transcript: string) => {
    if (transcript.includes("add") && transcript.includes("cart")) {
      const productName = transcript.replace(/(add|to|cart)/gi, "").trim();
      let product = sampleProducts.find((p) =>
        p.name.toLowerCase().includes(productName)
      );
      if (!product) {
        product = await performRagSearch(productName);
      }
      if (product) {
        onAddToCart(product);
        toast({
          title: "Added to BAS cart",
          description: `${product.name} added to your BAS cart.`,
        });
      } else {
        toast({
          title: "Product not found",
          description: "Sorry, I couldn’t find that product.",
          variant: "destructive",
        });
      }
    } else if (transcript.includes("find") || transcript.includes("search")) {
      const query = transcript.replace(/(find|search)/gi, "").trim();
      onFilterProducts(query);
      toast({
        title: "Searching products",
        description: `Filtering products for "${query}"`,
      });
      const suggestion = await getRecommendation(query);
      if (suggestion) {
        toast({
          title: "Suggestion",
          description: `Try ${suggestion.name} based on your query!`,
        });
      }
    }
  };

  const performRagSearch = async (query: string): Promise<any> => {
    try {
      const result = await embeddingModel.embedContent({
        content: { role: "user", parts: [{ text: query }] },
        taskType: TaskType.RETRIEVAL_QUERY,
      });
      const embedding: number[] = result.embedding.values;
      const { data, error } = await supabase.rpc("match_products", {
        query_embedding: embedding,
        match_count: 1,
      });
      if (error) throw error;
      return data[0] || null;
    } catch (error) {
      console.error("Error in performRagSearch:", error);
      return null;
    }
  };

  const getRecommendation = async (query: string): Promise<any> => {
    try {
      const result = await embeddingModel.embedContent({
        content: { role: "user", parts: [{ text: query }] },
        taskType: TaskType.RETRIEVAL_QUERY,
      });
      const embedding: number[] = result.embedding.values;
      const { data, error } = await supabase.rpc("match_products", {
        query_embedding: embedding,
        match_count: 1,
      });
      if (error) throw error;
      return data[0] || null;
    } catch (error) {
      console.error("Error in getRecommendation:", error);
      return null;
    }
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
        disabled={!genAI}
      >
        <Mic className="w-5 h-5 mr-2" />
        {isListening ? "Stop Listening" : "Start Voice Search"}
      </Button>
      <p className="text-sm text-gray-600 mt-2">
        Try saying: "Add headphones to cart" or "Find electronics"
      </p>
    </div>
  );
};

export default VoiceAssistant;
