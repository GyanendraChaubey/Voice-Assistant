import { useEffect, useRef, useState } from 'react';
import ParticleSphere from './ParticleSphere';
import { useVoiceAssistant, type VoiceState } from '../hooks/useVoiceAssistant';
import { Settings, X } from 'lucide-react';

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

const VOICES = [
  { id: 'en-US-JennyNeural', name: 'Jenny (US)', gender: 'Female' },
  { id: 'en-US-GuyNeural', name: 'Guy (US)', gender: 'Male' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia (UK)', gender: 'Female' },
  { id: 'hi-IN-SwaraNeural', name: 'Swara (Hindi)', gender: 'Female' },
  { id: 'hi-IN-MadhurNeural', name: 'Madhur (Hindi)', gender: 'Male' },
  { id: 'en-IN-NeerjaNeural', name: 'Neerja (IN)', gender: 'Female' },
  { id: 'en-IN-PrabhatNeural', name: 'Prabhat (IN)', gender: 'Male' },
];

export default function MainVoiceAssistant({ sessionId }: MainVoiceAssistantProps) {
  const [displayedResponse, setDisplayedResponse] = useState('');
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const charIndexRef = useRef(0);
  const responseContainerRef = useRef<HTMLDivElement>(null);
  const lastResponseRef = useRef('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('en-US-JennyNeural');

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
    language: 'english',
    voice: selectedVoice,
    onTranscript: (text) => console.log('Transcript:', text),
    onResponse: (text) => console.log('Response:', text),
    onError: (err) => console.error('Voice error:', err),
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSettingsOpen) setIsSettingsOpen(false);
        else cancel();
      }
      if (e.key === ' ' && state === 'idle' && !isSettingsOpen) {
        e.preventDefault();
        startListening();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, startListening, cancel, isSettingsOpen]);

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
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center w-full">
        {/* Close on left side now */}
        <button 
          onClick={cancel}
          className="p-2 text-[#a0aab4] hover:text-white transition-all transform hover:rotate-90 duration-300"
          title="Reset (Esc)"
        >
          <X size={24} />
        </button>

        {/* Settings on right side */}
        <div className="relative">
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-2 transition-all duration-300 ${isSettingsOpen ? 'text-white rotate-90' : 'text-[#a0aab4] hover:text-white'}`}
            title="Voice Settings"
          >
            <Settings size={24} />
          </button>
          
          {/* Settings Dropdown */}
          {isSettingsOpen && (
            <div className="absolute right-0 mt-4 w-64 bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 z-50">
              <h3 className="text-white font-semibold mb-3 px-2 text-sm uppercase tracking-wider opacity-60">Select Voice</h3>
              <div className="space-y-1">
                {VOICES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVoice(v.id);
                      setIsSettingsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-200 flex items-center justify-between group ${selectedVoice === v.id ? 'bg-[#1da1b8]/20 text-[#1da1b8]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{v.name}</span>
                      <span className="text-[10px] opacity-50">{v.gender}</span>
                    </div>
                    {selectedVoice === v.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1da1b8] shadow-[0_0_8px_#1da1b8]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
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
