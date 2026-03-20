from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import base64
import voicebot

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize global conversation
conversation = [{"role": "system", "content": voicebot.SYSTEM_PROMPT}]

@app.on_event("startup")
def startup():
    voicebot.load_groq()

@app.post("/api/chat")
async def chat(request: Request):
    body = await request.body()
    
    # Ensure body is a multiple of 2 (int16 is 2 bytes)
    if len(body) % 2 != 0:
        body = body[:-1]
        
    # Groq API requires min 0.01 seconds (160 samples at 16kHz = 320 bytes)
    if len(body) < 320:
        return {"transcript": "", "response": "", "audio_b64": ""}
    
    # Body is raw int16 PCM at 16000Hz
    audio_int16 = np.frombuffer(body, dtype=np.int16)
    audio_float32 = audio_int16.astype(np.float32) / 32768.0
    
    # 1. Transcribe audio
    user_text = voicebot.transcribe(audio_float32)
    if not user_text:
        return {"transcript": "", "response": "", "audio_b64": ""}

    # 2. Add to history and get LLM reply
    conversation.append({"role": "user", "content": user_text})
    reply = voicebot.llm_reply(conversation)
    conversation.append({"role": "assistant", "content": reply})
    
    print(f"\n👤 User: {user_text}")
    print(f"🤖 Bot: {reply}\n")
    
    # 3. Synthesize TTS
    import os
    env_voice = os.getenv("EDGE_TTS_VOICE")
    voice = env_voice if env_voice else voicebot._pick_voice(reply)
    audio_bytes = await voicebot._tts_to_bytes(reply, voice)
    
    # 4. Return as JSON
    b64_audio = base64.b64encode(audio_bytes).decode('utf-8')
    return {
        "transcript": user_text,
        "response": reply,
        "audio_b64": b64_audio
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
