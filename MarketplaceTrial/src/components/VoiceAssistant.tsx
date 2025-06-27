import React, { useState, useEffect } from "react";
import { Mic, MicOff, MessageSquare, X, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { speechRecognitionService } from "@/utils/speechRecognition";
import { sampleProducts } from "@/data/products";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  description: string;
}

interface VoiceAssistantProps {
  onAddToCart: (product: Product) => void;
  onFilterProducts: (query: string) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onAddToCart,
  onFilterProducts,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your mock AI shopping assistant. Try saying 'Add headphones to cart' or 'Find electronics'!",
    },
  ]);
  const { toast } = useToast();

  useEffect(() => {
    if (!speechRecognitionService.isSupported()) {
      toast({
        title: "Speech Recognition Not Supported",
        description:
          "Your browser doesn't support speech recognition. Please try Chrome or Edge.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleStartListening = async () => {
    if (!speechRecognitionService.isSupported()) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    const hasPermission =
      await speechRecognitionService.requestMicrophonePermission();
    if (!hasPermission) {
      toast({
        title: "Permission Denied",
        description: "Microphone access is required for speech recognition.",
        variant: "destructive",
      });
      return;
    }

    setIsListening(true);
    setCurrentTranscript("");

    speechRecognitionService.startListening(
      (transcript: string, isFinal: boolean) => {
        console.log(
          "Speech recognition result:",
          transcript,
          "Final:",
          isFinal
        );

        if (isFinal) {
          handleSpeechResult(transcript);
          setCurrentTranscript("");
        } else {
          setCurrentTranscript(transcript);
        }
      },
      (error: string) => {
        console.error("Speech recognition error:", error);
        setIsListening(false);
        setCurrentTranscript("");
        toast({
          title: "Speech Recognition Error",
          description: `Error: ${error}`,
          variant: "destructive",
        });
      }
    );
  };

  const handleStopListening = () => {
    speechRecognitionService.stopListening();
    setIsListening(false);
    setCurrentTranscript("");
  };

  const handleSpeechResult = async (transcript: string) => {
    if (transcript.trim()) {
      setMessages((prev) => [...prev, { role: "user", content: transcript }]);
      const lowerTranscript = transcript.toLowerCase();

      // Mock cart-related commands
      if (
        lowerTranscript.includes("add") &&
        (lowerTranscript.includes("cart") ||
          lowerTranscript.includes("to cart"))
      ) {
        const productName = lowerTranscript
          .replace(/add\s*(to\s*cart)?/, "")
          .trim();
        const product = sampleProducts.find((p) =>
          p.name.toLowerCase().includes(productName)
        );
        if (product) {
          onAddToCart(product);
          const response = `Added ${product.name} to your cart!`;
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: response },
          ]);
          toast({
            title: "Added to Cart",
            description: `${product.name} has been added to your cart.`,
          });
          if ("speechSynthesis" in window) {
            const utterance = new SpeechSynthesisUtterance(response);
            utterance.rate = 0.8;
            utterance.pitch = 1;
            utterance.lang = "en-US";
            speechSynthesis.speak(utterance);
          }
          return;
        } else {
          const response = `Sorry, I couldn't find "${productName}" in the products. Try saying the product name clearly or browse manually.`;
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: response },
          ]);
          toast({
            title: "Product Not Found",
            description: `No product matches "${productName}".`,
            variant: "destructive",
          });
          if ("speechSynthesis" in window) {
            const utterance = new SpeechSynthesisUtterance(response);
            utterance.rate = 0.8;
            utterance.pitch = 1;
            utterance.lang = "en-US";
            speechSynthesis.speak(utterance);
          }
          return;
        }
      }

      // Mock search/filter commands
      if (
        lowerTranscript.includes("find") ||
        lowerTranscript.includes("search") ||
        lowerTranscript.includes("show")
      ) {
        const query = lowerTranscript.replace(/(find|search|show)/, "").trim();
        onFilterProducts(query);
        const response = `Filtering products for "${query}". Check the product grid!`;
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response },
        ]);
        toast({
          title: "Search Applied",
          description: `Showing products for "${query}".`,
        });
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(response);
          utterance.rate = 0.8;
          utterance.pitch = 1;
          utterance.lang = "en-US";
          speechSynthesis.speak(utterance);
        }
        return;
      }

      // Mock general query response
      const responseText = `Mock response: I heard "${transcript}". Try adding to cart or searching for products!`;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: responseText },
      ]);
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(responseText);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.lang = "en-US";
        speechSynthesis.speak(utterance);
      }
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleQuickCommand = (command: string) => {
    handleSpeechResult(command);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleExpanded}
          className="w-16 h-16 rounded-full bg-orange-primary hover:bg-orange-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        >
          <MessageSquare className="w-6 h-6 text-white" />
        </Button>
      </div>

      {isExpanded && (
        <div className="fixed bottom-24 right-6 w-80 z-50 animate-fade-in">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-dark-primary">
                  Mock AI Assistant
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleExpanded}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="max-h-40 overflow-y-auto space-y-2">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-sm ${
                      message.role === "assistant"
                        ? "bg-light-primary text-dark-primary"
                        : "bg-gray-50 text-dark-primary"
                    }`}
                  >
                    {message.role === "assistant" ? "Assistant: " : "You: "}
                    {message.content}
                  </div>
                ))}
                {currentTranscript && (
                  <div className="p-3 rounded-lg text-sm bg-blue-50 text-blue-700 border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-3 h-3" />
                      <span className="italic">
                        Listening: {currentTranscript}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center space-x-4">
                <Button
                  onClick={
                    isListening ? handleStopListening : handleStartListening
                  }
                  disabled={!speechRecognitionService.isSupported()}
                  className={`w-12 h-12 rounded-full transition-all duration-200 ${
                    isListening
                      ? "bg-red-500 hover:bg-red-600 animate-pulse"
                      : "bg-orange-primary hover:bg-orange-primary/90"
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-5 h-5 text-white" />
                  ) : (
                    <Mic className="w-5 h-5 text-white" />
                  )}
                </Button>
                <span className="text-sm text-gray-primary">
                  {isListening ? "Listening..." : "Click to speak"}
                </span>
              </div>

              {!speechRecognitionService.isSupported() && (
                <div className="text-xs text-red-500 text-center">
                  Speech recognition not supported in this browser
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs text-gray-primary font-medium">
                  Quick commands:
                </p>
                <div className="flex flex-wrap gap-1">
                  {[
                    "Find headphones",
                    "Show deals",
                    "Add headphones to cart",
                  ].map((command) => (
                    <Button
                      key={command}
                      variant="outline"
                      size="sm"
                      className="text-xs px-2 py-1 h-auto text-dark-primary border-gray-primary hover:bg-light-primary"
                      onClick={() => handleQuickCommand(command)}
                    >
                      {command}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default VoiceAssistant;
