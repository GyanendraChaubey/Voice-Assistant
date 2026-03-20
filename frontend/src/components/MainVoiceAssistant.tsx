import { useEffect, useRef, useState } from 'react';
import ParticleSphere from './ParticleSphere';
import { useVoiceAssistant, type VoiceState } from '../hooks/useVoiceAssistant';
import { Settings } from 'lucide-react';

const STATE_LABELS: Record<VoiceState, string> = {
  idle: 'Tap to speak',
  calibrating: 'Calibrating...',
  listening: 'Listening...',
  processing: 'Processing...',
  speaking: 'Speaking...',
  interrupted: 'Processing...',
};

interface MainVoiceAssistantProps {
  sessionId: string;
}

export default function MainVoiceAssistant({ sessionId }: MainVoiceAssistantProps) {
  const [displayedResponse, setDisplayedResponse] = useState('');
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const charIndexRef = useRef(0);
  const responseContainerRef = useRef<HTMLDivElement>(null);
  const lastResponseRef = useRef('');

  const {
    state,
    transcript,
    response,
    audioLevels,
    error,
    ttsPlaying,
    startListening,
  } = useVoiceAssistant({
    sessionId,
    language: 'english',
    onTranscript: (text) => console.log('Transcript:', text),
    onResponse: (text) => console.log('Response:', text),
    onError: (err) => console.error('Voice error:', err),
  });

  // Typewriter effect
  useEffect(() => {
    if (ttsPlaying && response && response !== lastResponseRef.current) {
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
      if (typewriterRef.current) clearTimeout(typewriterRef.current);
    };
  }, [ttsPlaying, response]);

  // Auto-scroll response
  useEffect(() => {
    if (responseContainerRef.current) {
      responseContainerRef.current.scrollTop = responseContainerRef.current.scrollHeight;
    }
  }, [displayedResponse]);

  // Handle continuous listening
  const prevStateRef = useRef<VoiceState>('idle');
  useEffect(() => {
    if (prevStateRef.current === 'speaking' && state === 'idle') {
      const timer = setTimeout(() => {
        startListening();
      }, 500);
      return () => clearTimeout(timer);
    }
    prevStateRef.current = state;
  }, [state, startListening]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 relative pt-12 md:pt-0">
      {/* Top action button (Settings) */}
      <div className="absolute top-0 right-4 p-4 z-20">
        <button className="p-2 text-[#a0aab4] hover:text-white transition-colors">
          <Settings size={20} />
        </button>
      </div>

      <div className="max-w-4xl w-full flex flex-col items-center space-y-12">
        {/* Response display - Using glass effect for readability if needed */}
        <div 
          ref={responseContainerRef}
          className={`w-full max-h-48 overflow-y-auto text-center px-6 transition-all duration-700 ease-out py-4 ${displayedResponse ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4 h-0'}`}
        >
          <p className="text-lg md:text-xl font-light leading-relaxed text-[#f8fafc] drop-shadow-md">
            {displayedResponse}
          </p>
        </div>

        {/* Sphere visualization */}
        <div 
          className="relative group cursor-pointer" 
          onClick={() => state === 'idle' && startListening()}
        >
          {/* Subtle glow behind sphere */}
          <div className={`absolute inset-0 bg-[#1da1b8]/20 blur-[80px] rounded-full transition-opacity duration-1000 ${state === 'listening' ? 'opacity-100' : 'opacity-0'}`} />
          
          <div className="relative transition-transform duration-500 hover:scale-[1.03] active:scale-[0.98]">
            <ParticleSphere
              state={state}
              audioLevels={audioLevels}
              size={Math.min(window.innerWidth * 0.8, 420)}
            />
          </div>
        </div>

        {/* Main Status & Transcript Area */}
        <div className="flex flex-col items-center space-y-6 w-full max-w-lg">
          {/* User transcript */}
          <div className={`text-[#94a3b8] text-lg font-medium h-8 transition-all duration-300 text-center ${transcript ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            {transcript}
          </div>

          {/* Status indicator with custom color for different states */}
          <div className="flex items-center space-x-2">
            <div className={`w-1.5 h-1.5 rounded-full ${state === 'listening' ? 'bg-[#1da1b8] animate-ping' : state === 'processing' ? 'bg-yellow-500 animate-pulse' : 'bg-[#1da1b8]/40'}`} />
            <span className={`text-[#1da1b8] text-xs font-bold tracking-[0.3em] uppercase transition-opacity duration-300 ${state === 'listening' ? 'opacity-100' : 'opacity-60'}`}>
              {STATE_LABELS[state]}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-2xl text-red-400 text-sm backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <p className="font-medium">⚠️ {error}</p>
        </div>
      )}
    </div>
  );
}
