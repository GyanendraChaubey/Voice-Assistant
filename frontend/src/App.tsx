import { useState } from 'react';
import { Search, Compass, Library, PlusCircle, User } from 'lucide-react';
import MainVoiceAssistant from './components/MainVoiceAssistant';

export default function App() {
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));

  return (
    <div className="flex h-screen w-full bg-[#0f1419] text-white font-sans overflow-hidden">
      {/* Sidebar - Perplexity Style */}
      <aside className="w-64 border-r border-[#2f363c] flex flex-col justify-between hidden md:flex shrink-0 bg-[#0f1419] z-10">
        <div>
          <div className="p-6 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1da1b8] to-[#0d8a9e] flex items-center justify-center font-bold text-white shadow-lg shadow-[#1da1b8]/20">
              V
            </div>
            <span className="text-xl font-semibold tracking-tight">VoiceBot</span>
          </div>
          
          <div className="px-4 mb-6">
            <button className="flex items-center space-x-2 w-full bg-[#1e242a] hover:bg-[#2f363c] transition-colors rounded-full py-2.5 px-4 border border-[#2f363c]">
              <PlusCircle size={18} className="text-[#a0aab4]" />
              <span className="text-sm font-medium">New Thread</span>
            </button>
          </div>

          <nav className="px-3 space-y-1">
            <a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg bg-[#1e242a] text-[#1da1b8] font-medium transition-all hover:scale-[1.02]">
              <Search size={20} />
              <span>Home</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[#a0aab4] hover:bg-[#1e242a]/50 hover:text-white transition-colors">
              <Compass size={20} />
              <span>Discover</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[#a0aab4] hover:bg-[#1e242a]/50 hover:text-white transition-colors">
              <Library size={20} />
              <span>Library</span>
            </a>
          </nav>
        </div>

        <div className="p-4">
          <div className="flex items-center space-x-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[#1e242a]/50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#2f363c] flex items-center justify-center">
              <User size={16} className="text-[#a0aab4]" />
            </div>
            <span className="text-sm font-medium">Profile</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-full bg-main-gradient overflow-hidden">
        {/* Background Subtle Elements */}
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#1da1b8]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#0d8a9e]/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="flex-1 flex flex-col">
          {/* Main Integrated Voice Assistant */}
          <MainVoiceAssistant sessionId={sessionId} />
        </div>

        {/* Footer Hint */}
        <div className="absolute bottom-10 left-0 right-0 pointer-events-none flex justify-center">
          <p className="text-[#a0aab4] text-xs font-medium uppercase tracking-[0.2em] opacity-40">
            Powered by Groq & Microsoft Edge TTS
          </p>
        </div>
      </main>
    </div>
  );
}

