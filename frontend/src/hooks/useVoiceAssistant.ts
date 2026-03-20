import { useState, useRef, useCallback, useEffect } from 'react';

export type VoiceState = 'idle' | 'calibrating' | 'listening' | 'processing' | 'speaking' | 'interrupted';

interface UseVoiceAssistantOptions {
  sessionId: string;
  language?: string;
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceAssistant({
  onTranscript,
  onResponse,
  onError,
}: UseVoiceAssistantOptions) {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(32).fill(0));
  const [error, setError] = useState<string | null>(null);
  const [ttsPlaying, setTtsPlaying] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chunksRef = useRef<Int16Array[]>([]);
  
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  const cleanupRecording = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(()=> {});
    }
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    
    streamRef.current = null;
    audioContextRef.current = null;
    processorRef.current = null;
    analyserRef.current = null;
    setAudioLevels(new Array(32).fill(0));
  }, []);

  const cleanupPlayback = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = '';
      audioPlayerRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    isCancelledRef.current = true;
    cleanupRecording();
    cleanupPlayback();
  }, [cleanupRecording, cleanupPlayback]);

  const stopAndSend = useCallback(async (chunks: Int16Array[]) => {
    cleanupRecording();
    setState('processing');
    
    // Combine chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combined = new Int16Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    try {
      console.log("[Voice] Sending audio blob of length " + totalLength);
      const resp = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: combined.buffer
      });
      if (!resp.ok) throw new Error('API Error');
      
      const data = await resp.json();
      
      if (data.transcript) {
        setTranscript(data.transcript);
        onTranscript?.(data.transcript);
      }
      if (data.response) {
        setResponse(data.response);
        onResponse?.(data.response);
      }
      
      if (data.audio_b64) {
        setState('speaking');
        playAudio(data.audio_b64);
      } else {
        setState('idle');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      onError?.(err.message);
      setState('idle');
    }
  }, [cleanupRecording, onTranscript, onResponse, onError]);

  const playAudio = (b64: string) => {
    const audioUrl = `data:audio/mpeg;base64,${b64}`;
    const audio = new Audio(audioUrl);
    audioPlayerRef.current = audio;
    
    let simInterval: number;

    audio.onplay = () => {
      setTtsPlaying(true);
      // Simulate audio levels for ParticleSphere synchronization
      simInterval = window.setInterval(() => {
         const levels = new Array(32).fill(0).map(() => Math.random() * 0.4 + 0.1);
         setAudioLevels(levels);
      }, 50);
    };

    const finish = () => {
      if (simInterval) clearInterval(simInterval);
      setAudioLevels(new Array(32).fill(0));
      setTtsPlaying(false);
      
      if (!isCancelledRef.current && audioPlayerRef.current === audio) {
          setState('listening');
          setTimeout(() => {
             if (!isCancelledRef.current) startListening();
          }, 500);
      }
    };

    audio.onended = finish;
    audio.onerror = (e) => {
       console.error('Audio playback error', e);
       finish();
    };

    audio.play().catch(e => {
       console.error('Audio play error', e);
       finish();
    });
  };

  const startListening = useCallback(async () => {
    isCancelledRef.current = false;
    setError(null);
    setTranscript('');
    setResponse('');
    chunksRef.current = [];
    cleanupPlayback();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
         audio: { echoCancellation: true, noiseSuppression: true } 
      });
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      let silenceDurationSec = 0;
      let hasStartedSpeaking = false;
      const ENERGY_THRESHOLD = 0.01;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        let sum = 0;
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          sum += Math.abs(inputData[i]);
        }
        
        chunksRef.current.push(pcmData);
        
        const energy = sum / inputData.length;
        if (energy > ENERGY_THRESHOLD) {
           hasStartedSpeaking = true;
           silenceDurationSec = 0;
        } else if (hasStartedSpeaking) {
           silenceDurationSec += e.inputBuffer.duration;
           if (silenceDurationSec > 1.2) {
              // Note: using stopAndSend directly here handles cleanup properly.
              stopAndSend(chunksRef.current);
           }
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setState('listening');

      const updateVisuals = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const levels = [];
        const step = Math.floor(dataArray.length / 32);
        for (let i = 0; i < 32; i++) {
          levels.push((dataArray[i * step] || 0) / 255);
        }
        setAudioLevels(levels);
        animationFrameRef.current = requestAnimationFrame(updateVisuals);
      };
      updateVisuals();

    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setState('idle');
    }
  }, [cleanupPlayback, stopAndSend]);

  const stopListening = useCallback(() => {
     if (state === 'listening' && chunksRef.current.length > 0) {
        stopAndSend(chunksRef.current);
     } else {
        cleanup();
        setState('idle');
     }
  }, [state, stopAndSend, cleanup]);

  const cancel = useCallback(() => {
    cleanup();
    setState('idle');
    setTranscript('');
    setResponse('');
  }, [cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const speak = async (_text: string) => {};

  return {
    state, transcript, response, audioLevels, error,
    ttsPlaying, startListening, stopListening, speak, cancel
  };
}
