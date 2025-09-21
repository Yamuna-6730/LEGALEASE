export {};

declare global {
  interface SpeechRecognitionEvent extends Event {
    results: ArrayLike<{
      0: { transcript: string };
    }>;
  }

  interface SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: (event: SpeechRecognitionEvent) => void;
    onend: (() => void) | null;
    onerror: ((event: Event) => void) | null;
    start(): void;
    stop(): void;
  }

  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}
