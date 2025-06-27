import React, { useState, useEffect } from "react";
import { Mic, MicOff, MessageSquare, X, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { speechRecognitionService } from "@/utils/speechRecognition";

const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI shopping assistant. Ask me anything about products or let me help you find what you're looking for!",
    },
  ]);
  const { toast } = useToast();

  useEffect(() => {
    // Check if speech recognition is supported
    if (!speechRecognitionService.isSupported()) {
      toast({
        title: "Speech Recognition Not Supported",
        description:
          "Your browser doesn't support speech recognition. Please try Chrome or Edge.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleStartListening = () => {
    if (!speechRecognitionService.isSupported()) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
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
          // Process the final transcript
          handleSpeechResult(transcript);
          setCurrentTranscript("");
        } else {
          // Update interim results
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

  const handleSpeechResult = (transcript: string) => {
    if (transcript.trim()) {
      // Add user message
      setMessages((prev) => [...prev, { role: "user", content: transcript }]);

      // Simulate AI response based on the transcript
      setTimeout(() => {
        const response = generateAIResponse(transcript);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response },
        ]);

        // Speak the response if speech synthesis is available
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(response);
          utterance.rate = 0.8;
          utterance.pitch = 1;
          speechSynthesis.speak(utterance);
        }
      }, 1000);
    }
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (input.includes("headphones") || input.includes("headphone")) {
      return "I found some great headphones for you! We have wireless noise-canceling headphones, gaming headsets, and premium audio options. Would you like me to show you the best-rated ones?";
    } else if (
      input.includes("deals") ||
      input.includes("discount") ||
      input.includes("sale")
    ) {
      return "Great news! We have several ongoing deals. Check out our electronics section for up to 30% off, and our clothing category has a buy-one-get-one offer. Would you like me to show you specific deals?";
    } else if (input.includes("recommend") || input.includes("suggestion")) {
      return "Based on popular items, I'd recommend checking out our wireless earbuds, smart home devices, and fitness trackers. They're trending and have excellent reviews. What type of product interests you most?";
    } else if (
      input.includes("price") ||
      input.includes("cost") ||
      input.includes("expensive")
    ) {
      return "I can help you find products within your budget! We have options ranging from budget-friendly to premium. What's your price range, and what type of product are you looking for?";
    } else if (
      input.includes("hello") ||
      input.includes("hi") ||
      input.includes("hey")
    ) {
      return "Hello! I'm here to help you find the perfect products. You can ask me about specific items, deals, recommendations, or anything else shopping-related. What can I help you with today?";
    } else {
      return `I heard you say: "${userInput}". I'm here to help you find products! You can ask me about specific items, current deals, or get personalized recommendations. What would you like to explore?`;
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
      {/* Floating Voice Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleExpanded}
          className="w-16 h-16 rounded-full bg-orange-primary hover:bg-orange-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        >
          <MessageSquare className="w-6 h-6 text-white" />
        </Button>
      </div>

      {/* Expanded Voice Assistant Panel */}
      {isExpanded && (
        <div className="fixed bottom-24 right-6 w-80 z-50 animate-fade-in">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-dark-primary">
                  AI Assistant
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
              {/* Messages */}
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
                    {message.content}
                  </div>
                ))}

                {/* Current transcript */}
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

              {/* Voice Controls */}
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

              {/* Quick Actions */}
              <div className="space-y-2">
                <p className="text-xs text-gray-primary font-medium">
                  Quick commands:
                </p>
                <div className="flex flex-wrap gap-1">
                  {["Find headphones", "Show deals", "Recommend for me"].map(
                    (command) => (
                      <Button
                        key={command}
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1 h-auto text-dark-primary border-gray-primary hover:bg-light-primary"
                        onClick={() => handleQuickCommand(command)}
                      >
                        {command}
                      </Button>
                    )
                  )}
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
