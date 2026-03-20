# 🎙️ Polyglot Voice Assistant (Perplexity Style)

A premium, high-performance voice assistant with a stunning interface and global language support. Built with **FastAPI**, **React (Vite)**, **Groq**, and **Microsoft Edge TTS**.

![Main UI](frontend/src/assets/pure_voice_ui.png)

## ✨ Features

- **🧠 Intelligent Reasoning**: Powered by Groq's `llama-3.3-70b-versatile` for lightning-fast, high-quality responses.
- **🎙️ Ultra-Low Latency STT**: Real-time transcription using Groq's hosted Whisper model.
- **🔊 Premium Edge TTS**: Crystal-clear speech synthesis using Microsoft Edge Neural voices.
- **🌍 Polyglot Support**: Supports **74 unique languages** and **140 regional locales** with automatic script detection.
- **✨ Pure Voice UI**: A distraction-free, full-screen "Pure Voice" interface with glassmorphism and a dynamic **Particle Sphere**.
- **🎛️ Voice Selection**: Switch between multiple premium voices (including Hindi and Indian English) in real-time via the in-app settings menu.
- **⌨️ Keyboard Shortcuts**: High-speed control with `Spacebar` to speak and `Escape` to reset.
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

**Backend (from root):**
```bash
uv run uvicorn backend.server:app --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Visit [http://localhost:5174](http://localhost:5174) and start talking!

---

## 🎙️ Voice Customization
While you can set a default voice in `.env`, the app now features an **in-app settings menu** for real-time switching between premium voices:

- **Hindi**: Swara (Female), Madhur (Male)
- **English (India)**: Neerja (Female), Prabhat (Male)
- **Global / US**: Jenny, Guy, Aria, etc.

The system still supports **automatic script detection**—if the assistant replies in a different language, it will switch to an appropriate local voice automatically.

---

## ⌨️ Keyboard Controls
For a frictionless experience, use these shortcuts:
- **`Spacebar`**: Start listening / Record (when idle).
- **`Escape`**: Stop speaking / Reset the session.

---

---

## 🔧 Technical Stack
- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Canvas API (for Particle Sphere).
- **Backend**: FastAPI, NumPy, Python-Dotenv.
- **AI/ML**: Groq Cloud (STT/LLM), Edge-TTS (TTS).

---

*Enjoy building the future of voice interfaces!*
