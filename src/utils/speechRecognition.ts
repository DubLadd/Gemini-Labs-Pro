/**
 * Web Speech API Integration for JulesApp
 * Provides Speech Recognition (Voice-to-Text) and Speech Synthesis (Voice Feedback)
 */

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string, errorType?: string) => void;
  onEnd?: () => void;
}

export interface SpeechRecognitionSession {
  start: () => void;
  stop: () => void;
  abort: () => void;
  isListening: () => boolean;
}

/**
 * Checks whether the browser supports the Web Speech Recognition API
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

/**
 * Checks whether the browser supports the Web Speech Synthesis API
 */
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof window.speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
}

/**
 * Creates and configures a Speech Recognition session
 */
export function createSpeechRecognizer(
  callbacks: SpeechRecognitionCallbacks,
  options: {
    lang?: string;
    continuous?: boolean;
    interimResults?: boolean;
  } = {}
): SpeechRecognitionSession {
  if (!isSpeechRecognitionSupported()) {
    callbacks.onError?.('Web Speech API is not supported in this browser.', 'not-supported');
    return {
      start: () => {},
      stop: () => {},
      abort: () => {},
      isListening: () => false,
    };
  }

  const SpeechRecognitionClass =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  const recognition = new SpeechRecognitionClass();
  recognition.lang = options.lang || 'en-US';
  recognition.continuous = options.continuous !== undefined ? options.continuous : true;
  recognition.interimResults = options.interimResults !== undefined ? options.interimResults : true;
  recognition.maxAlternatives = 1;

  let listening = false;
  let finalTranscript = '';

  recognition.onstart = () => {
    listening = true;
    callbacks.onStart?.();
  };

  recognition.onresult = (event: any) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0]?.transcript || '';
      if (result.isFinal) {
        finalTranscript += (finalTranscript ? ' ' : '') + text.trim();
        callbacks.onResult(finalTranscript, true);
      } else {
        interim += text;
        const combined = finalTranscript ? `${finalTranscript} ${interim}` : interim;
        callbacks.onResult(combined, false);
      }
    }
  };

  recognition.onerror = (event: any) => {
    const errorType = event.error;
    let friendlyMessage = 'Speech recognition error occurred.';

    switch (errorType) {
      case 'not-allowed':
        friendlyMessage = 'Microphone permission denied. Please allow microphone access.';
        break;
      case 'no-speech':
        friendlyMessage = 'No speech detected. Please speak into your microphone.';
        break;
      case 'audio-capture':
        friendlyMessage = 'No microphone device was detected.';
        break;
      case 'network':
        friendlyMessage = 'Network error while contacting speech recognition service.';
        break;
      case 'aborted':
        friendlyMessage = 'Speech input stopped.';
        break;
      default:
        friendlyMessage = `Speech error: ${errorType}`;
    }

    callbacks.onError?.(friendlyMessage, errorType);
  };

  recognition.onend = () => {
    listening = false;
    callbacks.onEnd?.();
  };

  return {
    start: () => {
      finalTranscript = '';
      try {
        recognition.start();
      } catch (err: any) {
        if (err.name !== 'InvalidStateError') {
          console.warn('SpeechRecognition start error:', err);
        }
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (err) {
        console.warn('SpeechRecognition stop error:', err);
      }
    },
    abort: () => {
      try {
        recognition.abort();
      } catch (err) {
        console.warn('SpeechRecognition abort error:', err);
      }
    },
    isListening: () => listening,
  };
}

/**
 * Text-to-Speech feedback for Jules coding directives
 */
export function speakDirectiveResponse(text: string, onDone?: () => void): void {
  if (!isSpeechSynthesisSupported()) return;

  try {
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    utterance.volume = 0.85;

    // Pick best English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    if (onDone) {
      utterance.onend = () => onDone();
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

/**
 * Clean voice command helper (formats common spoken coding terminology)
 */
export function formatSpokenDirective(text: string): string {
  if (!text) return '';
  let formatted = text.trim();

  // Common spoken coding aliases
  formatted = formatted
    .replace(/\bweak map\b/gi, 'WeakMap')
    .replace(/\bmap\b/gi, 'Map')
    .replace(/\btype script\b/gi, 'TypeScript')
    .replace(/\bjava script\b/gi, 'JavaScript')
    .replace(/\basync\b/gi, 'async')
    .replace(/\bvi test\b/gi, 'Vitest')
    .replace(/\bjest\b/gi, 'Jest')
    .replace(/\bweb hook\b/gi, 'webhook')
    .replace(/\bpull request\b/gi, 'Pull Request')
    .replace(/\bpr\b/gi, 'PR')
    .replace(/\bast\b/gi, 'AST');

  return formatted;
}
