import React, { useState, useEffect } from "react";
import { Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { sampleProducts } from "@/data/products";
import { speechRecognitionService } from "@/utils/speechRecognition";

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

  useEffect(() => {
    if (!speechRecognitionService.isSupported()) {
      toast({
        title: "Voice Search Unavailable",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      speechRecognitionService.startListening(
        (transcript: string, isFinal: boolean) => {
          if (!isFinal) return; // Only process final transcripts
          console.log("Speech recognition result:", transcript);
          const lowerTranscript = transcript.toLowerCase();

          if (
            lowerTranscript.includes("add") &&
            lowerTranscript.includes("cart")
          ) {
            const productName = lowerTranscript
              .replace(/(add|to|cart)/gi, "")
              .trim();
            const product = sampleProducts.find((p) =>
              p.name.toLowerCase().includes(productName)
            );

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
          } else if (
            lowerTranscript.includes("find") ||
            lowerTranscript.includes("search")
          ) {
            const query = lowerTranscript.replace(/(find|search)/gi, "").trim();
            onFilterProducts(query);
            toast({
              title: "Searching products",
              description: `Filtering products for "${query}"`,
            });
          }
        },
        (error: string) => {
          toast({
            title: "Voice Search Error",
            description: error,
            variant: "destructive",
          });
          setIsListening(false);
        }
      );
    } else {
      speechRecognitionService.stopListening();
    }

    return () => speechRecognitionService.stopListening();
  }, [isListening, onAddToCart, onFilterProducts, toast]);

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
        disabled={!speechRecognitionService.isSupported()}
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
