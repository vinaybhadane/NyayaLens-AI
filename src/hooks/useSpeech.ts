import { useState, useCallback } from 'react';

/**
 * Speech capabilities interface.
 */
export interface SpeechState {
  isSpeaking: boolean;
  isListening: boolean;
  isSpeechSupported: boolean;
  isRecognitionSupported: boolean;
  speak: (text: string, lang?: string) => void;
  stopSpeaking: () => void;
  startListening: (onResult: (text: string) => void) => void;
  stopListening: () => void;
}

/**
 * Hook providing accessible Web Speech synthesis and recognition.
 */
export function useSpeech(): SpeechState {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const isRecognitionSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const speak = useCallback((text: string, lang = 'en-US') => {
    if (!isSpeechSupported) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [isSpeechSupported]);

  const stopSpeaking = useCallback(() => {
    if (!isSpeechSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSpeechSupported]);

  const startListening = useCallback((onResult: (text: string) => void) => {
    if (!isRecognitionSupported) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        onResult(transcript);
      }
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    setIsListening(true);
    recognition.start();
  }, [isRecognitionSupported]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  return {
    isSpeaking,
    isListening,
    isSpeechSupported,
    isRecognitionSupported,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
  };
}
