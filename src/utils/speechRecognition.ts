import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
}

export const useSpeechRecognition = (): SpeechRecognitionHook & { error: string | null } => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const shouldKeepListeningRef = useRef(false);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      console.log("Silence timeout reached (2 minutes). Stopping recognition.");
      shouldKeepListeningRef.current = false;
      if (recognitionRef.current) recognitionRef.current.stop();
    }, 120000); // 2 minutes
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setIsSupported(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true; // Enable interim results for faster feedback
      recognition.lang = 'id-ID'; // Default to Indonesian as the app is in Indonesian

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        resetSilenceTimer();
      };
      
      recognition.onend = () => {
        if (shouldKeepListeningRef.current) {
            // Restart if it stopped unexpectedly (e.g. browser silence timeout) but our timer hasn't fired
            try {
                recognition.start();
            } catch (e) {
                console.error("Failed to restart speech recognition", e);
                setIsListening(false);
            }
        } else {
            setIsListening(false);
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        
        // Don't restart on fatal errors
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            shouldKeepListeningRef.current = false;
            setIsListening(false);
            if (event.error === 'not-allowed') {
                setError('Izin mikrofon ditolak. Harap izinkan akses mikrofon di browser Anda.');
            } else {
                setError('Layanan pengenalan suara tidak tersedia.');
            }
        } else {
             // For 'no-speech' or other transient errors, we might want to keep trying if shouldKeepListening is true
             if (event.error !== 'no-speech' && event.error !== 'aborted') {
                 setError(`Error: ${event.error}`);
             }
        }
      };

      recognition.onresult = (event: any) => {
        resetSilenceTimer(); // Reset timer on activity
        const lastResult = event.results[event.results.length - 1];
        const text = lastResult[0].transcript.trim();
        setTranscript(text);
      };

      recognitionRef.current = recognition;
    }
    
    return () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [resetSilenceTimer]);

  const startListening = useCallback(() => {
    setError(null);
    if (recognitionRef.current && !isListening) {
      try {
        shouldKeepListeningRef.current = true;
        recognitionRef.current.start();
      } catch (e) {
        console.error("Failed to start speech recognition", e);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return { isListening, transcript, startListening, stopListening, resetTranscript, isSupported, error };
};
