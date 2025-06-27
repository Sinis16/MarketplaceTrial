declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognition) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognition = ISpeechRecognition;

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;

  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    console.log("SpeechRecognition available:", !!SpeechRecognition);
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      console.log("SpeechRecognition initialized:", this.recognition);
    } else {
      console.log("SpeechRecognition not supported in this browser");
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      console.log("Microphone permission granted");
      return true;
    } catch (error) {
      console.error("Microphone permission denied:", error);
      return false;
    }
  }

  async startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (!this.recognition || this.isListening) {
      onError("Speech recognition not available or already listening");
      return;
    }

    const hasPermission = await this.requestMicrophonePermission();
    if (!hasPermission) {
      onError("Microphone permission denied");
      return;
    }

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript, true);
      } else if (interimTranscript) {
        onResult(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log("Speech recognition ended");
    };

    try {
      this.recognition.start();
      this.isListening = true;
      console.log("Speech recognition started");
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      onError('Failed to start speech recognition');
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      console.log("Speech recognition stopped");
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechRecognitionService = new SpeechRecognitionService();