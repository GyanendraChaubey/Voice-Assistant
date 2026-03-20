/**
 * VoiceAssistantModal
 * 
 * Full-screen voice assistant modal with:
 * - Particle sphere visualization
 * - Real-time transcription display
 * - Assistant response display
 * - State-aware animations
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { X } from 'lucide-react';
import ParticleSphere from './ParticleSphere';
import { useVoiceAssistant, type VoiceState } from '../hooks/useVoiceAssistant';
import './VoiceAssistantModal.css';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  language: string;
  onMessageSent?: (userMessage: string, assistantResponse: string) => void;
}

const STATE_LABELS: Record<VoiceState, string> = {
  idle: 'Tap to speak',
  calibrating: 'Calibrating...',
  listening: 'Listening...',
  processing: 'Processing...',
  speaking: 'Speaking...',
  interrupted: 'Processing...',
};

export default function VoiceAssistantModal({
  isOpen,
  onClose,
  sessionId,
  language,
  onMessageSent,
}: VoiceAssistantModalProps) {
  // Track if message was already sent to prevent duplicates
  const messageSentRef = useRef(false);
  const lastResponseRef = useRef('');

  // Typewriter effect state
  const [displayedResponse, setDisplayedResponse] = useState('');
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const charIndexRef = useRef(0);
  const responseContainerRef = useRef<HTMLDivElement>(null);

  const {
    state,
    transcript,
    response,
    audioLevels,
    error,
    ttsPlaying,
    startListening,
    cancel,
  } = useVoiceAssistant({
    sessionId,
    language,
    onTranscript: (text: string) => {
      console.log('Transcript:', text);
    },
    onResponse: (text: string) => {
      console.log('Response:', text);
    },
    onError: (err: string) => {
      console.error('Voice error:', err);
    },
  });

  // Audio-synced typewriter effect
  // Starts only when ttsPlaying becomes true (audio.onplay fired)
  // Paces to finish slightly before audio ends
  // Audio-synced typewriter effect
  // Starts only when ttsPlaying becomes true (audio.onplay fired)
  useEffect(() => {
    if (ttsPlaying && response && response !== lastResponseRef.current) {
      // Calculate per-character delay based on text length
      const totalDuration = response.length * 0.05 * 1000;
      const delay = Math.max(10, Math.min(60, totalDuration / response.length));

      charIndexRef.current = 0;
      setDisplayedResponse('');

      const typeNextChar = () => {
        if (charIndexRef.current < response.length) {
          setDisplayedResponse(response.slice(0, charIndexRef.current + 1));
          charIndexRef.current++;
          typewriterRef.current = setTimeout(typeNextChar, delay);
        }
      };

      typeNextChar();
      lastResponseRef.current = response;
    }

    return () => {
      if (typewriterRef.current) {
        clearTimeout(typewriterRef.current);
      }
    };
  }, [ttsPlaying, response]);

  // Auto-scroll response container to show latest text
  useEffect(() => {
    if (responseContainerRef.current) {
      responseContainerRef.current.scrollTop = responseContainerRef.current.scrollHeight;
    }
  }, [displayedResponse]);

  // Reset typewriter when listening starts
  useEffect(() => {
    if (state === 'listening') {
      setDisplayedResponse('');
      charIndexRef.current = 0;
      if (typewriterRef.current) {
        clearTimeout(typewriterRef.current);
      }
    }
  }, [state]);

  // Reset message sent flag when starting new listening
  useEffect(() => {
    if (state === 'listening') {
      messageSentRef.current = false;
    }
  }, [state]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Auto-start listening when modal opens
  useEffect(() => {
    if (isOpen && state === 'idle') {
      // Small delay to let modal animation complete
      const timer = setTimeout(() => {
        startListening();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]); // Only trigger on isOpen change, not state

  // Auto-restart listening after speaking completes (continuous conversation)
  const prevStateRef = useRef<VoiceState>('idle');
  useEffect(() => {
    // If we just finished speaking (prev was speaking, now idle), restart listening
    if (prevStateRef.current === 'speaking' && state === 'idle' && isOpen) {
      console.log('[Voice] Speaking complete, restarting listening...');
      const timer = setTimeout(() => {
        startListening();
      }, 500); // Small delay before next turn
      prevStateRef.current = state;
      return () => clearTimeout(timer);
    }
    prevStateRef.current = state;
  }, [state, isOpen, startListening]);

  // Handle message sent callback when response is complete (only once per conversation)
  useEffect(() => {
    if (
      state === 'idle' &&
      transcript &&
      response &&
      !messageSentRef.current &&
      response !== lastResponseRef.current
    ) {
      messageSentRef.current = true;
      lastResponseRef.current = response;
      onMessageSent?.(transcript, response);
    }
  }, [state, transcript, response, onMessageSent]);

  const handleClose = useCallback(() => {
    // Reset tracking refs and typewriter
    messageSentRef.current = false;
    lastResponseRef.current = '';
    setDisplayedResponse('');
    charIndexRef.current = 0;
    if (typewriterRef.current) {
      clearTimeout(typewriterRef.current);
    }
    cancel();
    onClose();
  }, [cancel, onClose]);

  if (!isOpen) return null;

  return (
    <div className="voice-modal-overlay" onClick={handleClose}>
      <div className="voice-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          className="voice-modal-close"
          onClick={handleClose}
          aria-label="Close voice assistant"
        >
          <X size={24} />
        </button>

        {/* Settings button (placeholder for future) */}
        <button className="voice-modal-settings" aria-label="Voice settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* Main content area */}
        <div className="voice-modal-content">
          {/* Response text with typewriter effect */}
          {displayedResponse && (
            <div 
              ref={responseContainerRef}
              className={`voice-response ${state === 'speaking' || state === 'idle' ? 'visible' : ''}`}
            >
              <p>{displayedResponse}</p>
            </div>
          )}

          {/* Particle sphere */}
          <div className="voice-sphere-container">
            <ParticleSphere
              state={state}
              audioLevels={audioLevels}
              size={380}
            />
          </div>

          {/* Transcript display (user's speech) */}
          {transcript && (
            <div className="voice-transcript">
              <p>{transcript}</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="voice-error">
              <p>{error}</p>
            </div>
          )}

          {/* Status text */}
          <div className="voice-status">
            <span className={`status-text ${state}`}>
              {STATE_LABELS[state]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
