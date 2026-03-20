#!/usr/bin/env python3
"""
Low-latency terminal voice bot  (100 % cloud – no local models)
STT: Groq Whisper API
TTS: Edge-TTS (Microsoft)
LLM: Groq API (llama-3.3-70b-versatile)
"""

import asyncio
import io
import os
import sys
import tempfile
import time
import wave

import numpy as np
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())  # search for .env in current and parent directories

# ── colours ────────────────────────────────────────────────────────────────────
CYAN   = "\033[96m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
DIM    = "\033[2m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

# ── config ──────────────────────────────────────────────────────────────────────
GROQ_API_KEY     = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL       = "llama-3.3-70b-versatile"
WHISPER_MODEL    = "whisper-large-v3"   # Groq-hosted Whisper (free tier)
EDGE_TTS_VOICE   = "en-US-AriaNeural"  # default / fallback voice
SAMPLE_RATE      = 16000               # recording sample rate
VAD_SILENCE_SEC  = 1.2                 # seconds of silence before STT fires
CHUNK_FRAMES     = 512                 # PyAudio chunk size
MAX_RECORD_SEC   = 30                  # safety cap

SYSTEM_PROMPT = (
    "You are a fast, helpful, and friendly voice assistant. "
    "Keep answers concise (1–4 sentences unless more depth is asked for). "
    "Avoid markdown, bullet lists, or special characters – plain speech only."
)


# ══════════════════════════════════════════════════════════════════════════════
# Client init (lazy, reused)
# ══════════════════════════════════════════════════════════════════════════════

_groq_client = None

def load_groq():
    global _groq_client
    if _groq_client is None:
        if not GROQ_API_KEY:
            print(f"{RED}[ERR] GROQ_API_KEY is not set.{RESET}")
            print(f"  1. Get a free key at https://console.groq.com")
            print(f"  2. Add it to .env or export GROQ_API_KEY=gsk_…")
            sys.exit(1)
        from groq import Groq
        _groq_client = Groq(api_key=GROQ_API_KEY)
        print(f"{GREEN}[LLM] Groq client ready ✓{RESET}")
        print(f"{GREEN}[STT] Groq Whisper ready ✓{RESET}")
    return _groq_client


# ══════════════════════════════════════════════════════════════════════════════
# Audio helpers
# ══════════════════════════════════════════════════════════════════════════════

def record_until_silence() -> np.ndarray:
    """Record from the default microphone until VAD_SILENCE_SEC of silence."""
    import pyaudio

    pa = pyaudio.PyAudio()
    stream = pa.open(
        rate=SAMPLE_RATE,
        channels=1,
        format=pyaudio.paInt16,
        input=True,
        frames_per_buffer=CHUNK_FRAMES,
    )

    frames = []
    silent_chunks = 0
    started = False
    max_chunks = int(MAX_RECORD_SEC * SAMPLE_RATE / CHUNK_FRAMES)
    silence_threshold_chunks = int(VAD_SILENCE_SEC * SAMPLE_RATE / CHUNK_FRAMES)

    ENERGY_THRESHOLD = 300

    print(f"\n{YELLOW}🎤 Listening …{RESET}  (speak, then pause)", end="", flush=True)

    for _ in range(max_chunks):
        data = stream.read(CHUNK_FRAMES, exception_on_overflow=False)
        frames.append(data)
        audio_chunk = np.frombuffer(data, dtype=np.int16)
        energy = np.abs(audio_chunk).mean()

        if energy > ENERGY_THRESHOLD:
            started = True
            silent_chunks = 0
        elif started:
            silent_chunks += 1
            if silent_chunks >= silence_threshold_chunks:
                break

    stream.stop_stream()
    stream.close()
    pa.terminate()

    audio = np.frombuffer(b"".join(frames), dtype=np.int16).astype(np.float32) / 32768.0
    return audio


def save_wav(audio: np.ndarray, path: str):
    """Save float32 audio array to a 16-bit mono WAV file."""
    pcm = (audio * 32768).clip(-32768, 32767).astype(np.int16)
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm.tobytes())


def play_audio(audio_bytes: bytes):
    """Play MP3/audio bytes through the default output device."""
    import sounddevice as sd
    import soundfile as sf
    data, sr = sf.read(io.BytesIO(audio_bytes))
    sd.play(data, samplerate=sr)
    sd.wait()


# ══════════════════════════════════════════════════════════════════════════════
# Core pipeline stages
# ══════════════════════════════════════════════════════════════════════════════

def transcribe(audio: np.ndarray) -> str:
    """STT: float32 16 kHz audio → text via Groq Whisper API."""
    client = load_groq()
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = tmp.name
    save_wav(audio, tmp_path)
    try:
        with open(tmp_path, "rb") as f:
            result = client.audio.transcriptions.create(
                model=WHISPER_MODEL,
                file=("audio.wav", f),
                response_format="text",
            )
        return result.strip() if isinstance(result, str) else result.text.strip()
    finally:
        os.unlink(tmp_path)


def llm_reply(messages: list) -> str:
    """LLM: conversation history → assistant reply text."""
    client = load_groq()
    t0 = time.time()
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        max_tokens=512,
        temperature=0.7,
    )
    elapsed = time.time() - t0
    reply = response.choices[0].message.content.strip()
    tokens = response.usage.completion_tokens
    print(f"  {DIM}[LLM] {tokens} tokens in {elapsed:.2f}s{RESET}")
    return reply


# Maps Unicode script ranges to edge-tts voice names
_VOICE_MAP = [
    ((0x1100, 0x11FF), "ko-KR-SunHiNeural"),   # Korean Jamo
    ((0xAC00, 0xD7AF), "ko-KR-SunHiNeural"),   # Korean Syllables
    ((0x3040, 0x309F), "ja-JP-NanamiNeural"),   # Hiragana
    ((0x30A0, 0x30FF), "ja-JP-NanamiNeural"),   # Katakana
    ((0x4E00, 0x9FFF), "zh-CN-XiaoxiaoNeural"), # CJK Unified (Chinese fallback)
    ((0x0900, 0x097F), "hi-IN-SwaraNeural"),    # Devanagari (Hindi)
    ((0x0600, 0x06FF), "ar-SA-ZariyahNeural"),  # Arabic
    ((0x0400, 0x04FF), "ru-RU-SvetlanaNeural"), # Cyrillic
    ((0x00C0, 0x00FF), "fr-FR-DeniseNeural"),   # Latin Extended (French fallback)
]


def _pick_voice(text: str) -> str:
    """Pick an edge-tts voice based on the dominant script in the text."""
    for ch in text:
        cp = ord(ch)
        for (lo, hi), voice in _VOICE_MAP:
            if lo <= cp <= hi:
                return voice
    return EDGE_TTS_VOICE  # default English


async def _tts_to_bytes(text: str, voice: str) -> bytes:
    """Use edge-tts to synthesize text → MP3 bytes."""
    import edge_tts
    communicate = edge_tts.Communicate(text, voice)
    chunks = []
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            chunks.append(chunk["data"])
    return b"".join(chunks)


def synthesize_and_play(text: str):
    """TTS: text → synthesize with Edge-TTS, play immediately."""
    voice = _pick_voice(text)
    try:
        audio_bytes = asyncio.run(_tts_to_bytes(text, voice))
        if audio_bytes:
            play_audio(audio_bytes)
    except Exception as e:
        print(f"\r{DIM}[TTS] Could not speak: {e}{RESET}")


# ══════════════════════════════════════════════════════════════════════════════
# Main conversation loop
# ══════════════════════════════════════════════════════════════════════════════

def banner():
    print(f"""
{BOLD}{CYAN}╔══════════════════════════════════════════════════╗
║          🎙  Terminal Voice Bot  🤖              ║
║  STT: Groq Whisper │ LLM: Groq │ TTS: Edge-TTS  ║
╚══════════════════════════════════════════════════╝{RESET}
{DIM}Type  Ctrl-C  to quit.{RESET}
""")


def main():
    banner()

    load_groq()

    conversation = [{"role": "system", "content": SYSTEM_PROMPT}]

    print(f"\n{GREEN}Ready. Starting conversation …{RESET}\n")

    while True:
        try:
            # ── 1. Record speech ───────────────────────────────────────────
            audio = record_until_silence()

            # ── 2. STT ─────────────────────────────────────────────────────
            print(f"\r{CYAN}🔍 Transcribing …{RESET}          ", end="", flush=True)
            t0 = time.time()
            user_text = transcribe(audio)
            stt_time = time.time() - t0

            if not user_text:
                print(f"\r{DIM}(nothing heard, try again){RESET}            ")
                continue

            print(f"\r{BOLD}You:{RESET} {user_text}  {DIM}[STT {stt_time:.2f}s]{RESET}")

            # ── 3. LLM ─────────────────────────────────────────────────────
            conversation.append({"role": "user", "content": user_text})
            print(f"{YELLOW}🤔 Thinking …{RESET}", end="", flush=True)
            t0 = time.time()
            reply = llm_reply(conversation)
            llm_time = time.time() - t0
            conversation.append({"role": "assistant", "content": reply})

            print(f"\r{GREEN}{BOLD}Bot:{RESET} {reply}  {DIM}[LLM {llm_time:.2f}s]{RESET}")

            # ── 4. TTS ─────────────────────────────────────────────────────
            print(f"{DIM}🔊 Speaking …{RESET}", end="", flush=True)
            t0 = time.time()
            synthesize_and_play(reply)
            tts_time = time.time() - t0
            print(f"\r{DIM}[TTS {tts_time:.2f}s]{RESET}              ")

        except KeyboardInterrupt:
            print(f"\n\n{CYAN}👋 Goodbye!{RESET}\n")
            break
        except Exception as exc:
            print(f"\n{RED}[ERROR] {exc}{RESET}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    main()
