import { useState } from 'react';
import { Search, Compass, Library, PlusCircle, Settings, User } from 'lucide-react';
import VoiceAssistantButton from './components/VoiceAssistantButton';
import VoiceAssistantModal from './components/VoiceAssistantModal';

export default function App() {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));

  // Placeholder handler for when the voice assistant gets a response
  const handleVoiceMessageSent = (userMessage: string, assistantResponse: string) => {
    console.log('Voice interaction complete:', { userMessage, assistantResponse });
    // In a full app, you might add this to the chat history
  };

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
            <a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg bg-[#1e242a] text-[#1da1b8] font-medium">
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

        <div className="p-4 space-y-2">
          <button className="flex items-center space-x-3 px-3 py-2.5 rounded-lg w-full text-left text-[#a0aab4] hover:bg-[#1e242a]/50 hover:text-white transition-colors">
            <Settings size={20} />
            <span className="text-sm font-medium">Settings</span>
          </button>
          <div className="flex items-center space-x-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[#1e242a]/50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#2f363c] flex items-center justify-center">
              <User size={16} className="text-[#a0aab4]" />
            </div>
            <span className="text-sm font-medium">Profile</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full">
        <div className="flex-1 overflow-y-auto pb-40">
          <div className="max-w-3xl mx-auto pt-24 px-6 md:px-8">
            <h1 className="text-4xl md:text-5xl font-semibold text-center mb-12 tracking-tight">
              Where knowledge begins
            </h1>
            
            {/* Some placeholder content to make the page look full */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-16 blur-[1px] opacity-60 pointer-events-none">
              <div className="glass-panel p-5 rounded-xl">
                <h3 className="text-sm font-medium text-[#a0aab4] mb-2 cursor-pointer hover:text-white">Recent: Quantum computing</h3>
                <p className="text-gray-300 text-sm">Explain how qubits work without all the complex math.</p>
              </div>
              <div className="glass-panel p-5 rounded-xl">
                <h3 className="text-sm font-medium text-[#a0aab4] mb-2 cursor-pointer hover:text-white">Recent: Healthy recipes</h3>
                <p className="text-gray-300 text-sm">What are some quick, high-protein vegetarian meals?</p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Centered Voice Button */}
        <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 flex justify-center bg-gradient-to-t from-[#0f1419] via-[#0f1419] to-transparent pt-24 pointer-events-none">
          <div className="flex flex-col items-center pointer-events-auto">
            <VoiceAssistantButton 
              onClick={() => setIsVoiceModalOpen(true)} 
              className="w-16 h-16 shadow-2xl"
            />
            <span className="text-sm text-[#a0aab4] mt-6 font-medium tracking-wide">
              Tap to start VoiceBot
            </span>
          </div>
        </div>
      </main>

      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        sessionId={sessionId}
        language="english"
        onMessageSent={handleVoiceMessageSent}
      />
    </div>
  );
}
