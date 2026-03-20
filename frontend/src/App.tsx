import { useState } from 'react';
import MainVoiceAssistant from './components/MainVoiceAssistant';

export default function App() {
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));

  return (
    <div className="flex h-screen w-full bg-[#0f1419] text-white font-sans overflow-hidden">
      {/* Main Content Area - Full Screen Voice Assistant */}
      <main className="flex-1 flex flex-col relative h-full bg-main-gradient overflow-hidden">
        {/* Background Subtle Elements for Immersion */}
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-[#1da1b8]/10 blur-[150px] rounded-full pointer-events-none animate-pulse duration-[10s]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-[#0d8a9e]/10 blur-[150px] rounded-full pointer-events-none animate-pulse duration-[8s]" />
        
        <div className="flex-1 flex flex-col z-10">
          {/* Main Integrated Voice Assistant */}
          <MainVoiceAssistant sessionId={sessionId} />
        </div>

        {/* Footer Hint */}
        <div className="absolute bottom-10 left-0 right-0 pointer-events-none flex justify-center z-10">
          <p className="text-[#a0aab4] text-[10px] font-bold uppercase tracking-[0.4em] opacity-30">
            Powered by Groq & Microsoft Edge TTS
          </p>
        </div>
      </main>
    </div>
  );
}


