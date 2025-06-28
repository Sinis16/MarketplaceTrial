import { GoogleGenerativeAI } from "@google/generative-ai";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class SpeechRecognitionService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI("");
  }

  isSupported(): boolean {
    return !!this.genAI;
  }

  async startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void
  ): Promise<void> {
    // Handled by Gemini Live in VoiceAssistant
    onError("Use Gemini Live for transcription.");
  }

  stopListening(): void {
    // No-op, handled by Gemini Live
  }

  getIsListening(): boolean {
    return false; // Managed by VoiceAssistant
  }
}

export const speechRecognitionService = new SpeechRecognitionService();