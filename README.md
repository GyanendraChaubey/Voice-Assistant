# 🎙️ Polyglot Voice Assistant (Perplexity Style)

A premium, high-performance voice assistant with a stunning interface and global language support. Built with **FastAPI**, **React (Vite)**, **Groq**, and **Microsoft Edge TTS**.

![Main UI](/Users/gyanendrachaubey/.gemini/antigravity/brain/f8588652-39ad-405d-ba6c-f6d6b1ae8261/main_page_perplexity_ui_1773997224202.png)

## ✨ Features

- **🧠 Intelligent Reasoning**: Powered by Groq's `llama-3.3-70b-versatile` for lightning-fast, high-quality responses.
- **🎙️ Ultra-Low Latency STT**: Real-time transcription using Groq's hosted Whisper model.
- **🔊 Premium Edge TTS**: Crystal-clear speech synthesis using Microsoft Edge Neural voices.
- **🌍 Polyglot Support**: Supports **74 unique languages** and **140 regional locales** with automatic script detection.
- **✨ Premium UI**: A sleek "Perplexity-inspired" interface with glassmorphism, dark mode, and a dynamic **Particle Sphere** visualization.
- **⚡ Local VAD**: Energy-based Voice Activity Detection happens entirely in your browser for privacy and speed.
- **📺 Terminal Sync**: Real-time logging in the backend terminal for monitoring conversations.

---

## 🛠️ Architecture

The project is split into a streamlined **Backend/Frontend** architecture:

```text
/backend          # FastAPI server, LLM/STT/TTS logic
/frontend         # Vite + React + Tailwind + Particle visualizer
.env              # Shared configuration (API keys, voice settings)
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.9+
- Node.js 18+
- [Groq API Key](https://console.groq.com)

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Configuration
Create a `.env` file in the **root** directory (it is automatically discovered by the backend):
```env
GROQ_API_KEY=your_key_here
EDGE_TTS_VOICE=en-IN-NeerjaNeural
```

### 5. Running the App
Start both services in separate terminals:

**Backend:**
```bash
cd backend
uvicorn server:app --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Visit [http://localhost:5174](http://localhost:5174) and start talking!

---

## 🎙️ Voice Customization
The assistant supports a vast library of voices. You can change the primary voice in your `.env` file. 

| Locale | Voice Name | Gender |
| :--- | :--- | :--- |
| **India** | `en-IN-NeerjaNeural` | Female |
| **India** | `en-IN-PrabhatNeural` | Male |
| **US** | `en-US-AriaNeural` | Female |
| **US** | `en-US-GuyNeural` | Male |
| **UK** | `en-GB-SoniaNeural` | Female |
| **Hindi** | `hi-IN-SwaraNeural` | Female |

The system will **automatically switch** to the correct local voice if the bot replies in a different script (e.g., replying in Hindi code-switches to the Hindi voice automatically).

---

## 🔧 Technical Stack
- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Canvas API (for Particle Sphere).
- **Backend**: FastAPI, NumPy, Python-Dotenv.
- **AI/ML**: Groq Cloud (STT/LLM), Edge-TTS (TTS).

---

*Enjoy building the future of voice interfaces!*
