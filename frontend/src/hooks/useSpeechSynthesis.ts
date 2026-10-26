import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [femaleVoice, setFemaleVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);

      // Look for natural female English voices
      const preferred = available.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Zira') ||
            v.name.includes('Samantha') ||
            v.name.includes('Victoria') ||
            v.name.includes('Female') ||
            v.name.includes('Natural') ||
            v.name.includes('Google UK English Female') ||
            v.name.includes('Jenny') ||
            v.name.includes('Aria'))
      ) || available.find((v) => v.lang.startsWith('en')) || available[0];

      if (preferred) {
        setFemaleVoice(preferred);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback(
    (text: string, rate = 1.0, onEnd?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      window.speechSynthesis.cancel(); // Stop any active speech

      // Clean markdown tags or bullets from text for natural speech
      const cleaned = text
        .replace(/[*#_~`]/g, '')
        .replace(/\b(https?:\/\/\S+)/g, '')
        .trim();

      if (!cleaned) return;

      const utterance = new SpeechSynthesisUtterance(cleaned);
      const hasHindi = /[\u0900-\u097F]/.test(cleaned);

      let selectedVoice = femaleVoice;
      if (hasHindi) {
        const hindiVoice =
          voices.find((v) => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')) ||
          voices.find((v) => v.lang.includes('IN')) ||
          femaleVoice;
        if (hindiVoice) {
          selectedVoice = hindiVoice;
          utterance.lang = 'hi-IN';
        }
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = rate;
      utterance.pitch = 1.05; // Slightly warm feminine pitch

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [femaleVoice, voices]
  );

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isSpeaking,
    voices,
    femaleVoice,
    setFemaleVoice,
    speak,
    stop,
  };
}
