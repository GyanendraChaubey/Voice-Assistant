import { useRef, useEffect, useCallback } from 'react';

export type ParticleState = 'idle' | 'calibrating' | 'listening' | 'processing' | 'speaking' | 'interrupted';

interface ParticleSphereProps {
  state: ParticleState;
  audioLevels?: number[]; // 0-1 normalized audio frequency data
  size?: number;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  vx: number;
  vy: number;
  vz: number;
}

const PARTICLE_COUNT = 900;
const CONNECTION_DISTANCE = 50; // Max distance to draw edge
const BASE_RADIUS = 100; // Reduced to allow room for expansion

export default function ParticleSphere({
  state,
  audioLevels = [],
  size = 300,
}: ParticleSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const rotationRef = useRef({ x: 0, y: 0 });

  // Initialize particles on a sphere
  const initParticles = useCallback(() => {
    const particles: Particle[] = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Fibonacci sphere distribution for even spacing
      const theta = (2 * Math.PI * i) / goldenRatio;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / PARTICLE_COUNT);

      const x = BASE_RADIUS * Math.sin(phi) * Math.cos(theta);
      const y = BASE_RADIUS * Math.sin(phi) * Math.sin(theta);
      const z = BASE_RADIUS * Math.cos(phi);

      particles.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        vx: 0,
        vy: 0,
        vz: 0,
      });
    }

    particlesRef.current = particles;
  }, []);

  // Rotate point around Y and X axes
  const rotatePoint = (
    x: number,
    y: number,
    z: number,
    rotX: number,
    rotY: number
  ): [number, number, number] => {
    // Rotate around Y
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;

    // Rotate around X
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const y1 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    return [x1, y1, z2];
  };

  // Get average audio level
  const getAudioIntensity = useCallback((): number => {
    if (audioLevels.length === 0) return 0;
    const sum = audioLevels.reduce((a, b) => a + b, 0);
    return sum / audioLevels.length;
  }, [audioLevels]);

  // Color helpers
  const getParticleColor = (
    currentState: ParticleState,
    z: number,
    intensity: number
  ): string => {
    const depthHue = (z + BASE_RADIUS) / (BASE_RADIUS * 2);

    switch (currentState) {
      case 'idle':
        // Warm gold/amber tones
        return `hsl(${35 + depthHue * 15}, 60%, ${55 + depthHue * 20}%)`;
      case 'listening': {
        // Shift to cyan/teal when listening
        const listenHue = 180 + intensity * 30;
        return `hsl(${listenHue}, ${70 + intensity * 20}%, ${50 + intensity * 20}%)`;
      }
      case 'processing':
        // Purple/violet swirl
        return `hsl(${270 + depthHue * 40}, 70%, ${50 + depthHue * 15}%)`;
      case 'speaking': {
        // Bright teal/green
        const speakHue = 165 + intensity * 20;
        return `hsl(${speakHue}, ${75 + intensity * 15}%, ${55 + intensity * 15}%)`;
      }
      default:
        return '#c4a35a';
    }
  };

  const getEdgeColor = (currentState: ParticleState, intensity: number): string => {
    switch (currentState) {
      case 'idle':
        return '#c4a35a'; // Gold
      case 'listening':
        return `hsl(185, ${60 + intensity * 30}%, 50%)`; // Teal
      case 'processing':
        return '#9b59b6'; // Purple
      case 'speaking':
        return `hsl(170, 70%, ${50 + intensity * 20}%)`; // Cyan-green
      default:
        return '#c4a35a';
    }
  };

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles = particlesRef.current;
    const time = timeRef.current;
    const audioIntensity = getAudioIntensity();

    // Clear canvas (use CSS size since context is scaled by DPR)
    ctx.clearRect(0, 0, size, size);

    // Use CSS size for center calculation (not physical pixels)
    const centerX = size / 2;
    const centerY = size / 2;

    // Update rotation based on state
    const rotSpeed = state === 'processing' ? 0.02 : 0.003;
    rotationRef.current.y += rotSpeed;
    rotationRef.current.x = Math.sin(time * 0.001) * 0.2;

    // Update particles based on state
    particles.forEach((p, i) => {
      let targetX = p.baseX;
      let targetY = p.baseY;
      let targetZ = p.baseZ;
      let scale = 1;

      switch (state) {
        case 'idle': {
          // Gentle floating - subtle noise-based movement
          const noiseX = Math.sin(time * 0.001 + i * 0.1) * 5;
          const noiseY = Math.cos(time * 0.0012 + i * 0.15) * 5;
          const noiseZ = Math.sin(time * 0.0008 + i * 0.12) * 5;
          targetX = p.baseX + noiseX;
          targetY = p.baseY + noiseY;
          targetZ = p.baseZ + noiseZ;
          break;
        }

        case 'listening': {
          // Expand and pulse with audio
          const pulseScale = 1 + audioIntensity * 0.5;
          const breathe = 1 + Math.sin(time * 0.003) * 0.05;
          scale = pulseScale * breathe;

          // Audio-reactive displacement
          const freqIndex = i % (audioLevels.length || 1);
          const freqLevel = audioLevels[freqIndex] || 0;
          const displacement = freqLevel * 30;

          const dirX = p.baseX / BASE_RADIUS;
          const dirY = p.baseY / BASE_RADIUS;
          const dirZ = p.baseZ / BASE_RADIUS;

          targetX = p.baseX * scale + dirX * displacement;
          targetY = p.baseY * scale + dirY * displacement;
          targetZ = p.baseZ * scale + dirZ * displacement;
          break;
        }

        case 'processing': {
          // Swirl inward - spiral motion
          const angle = time * 0.005 + i * 0.02;
          const shrink = 0.7 + Math.sin(time * 0.004) * 0.15;
          const spiralX = Math.cos(angle) * 10;
          const spiralZ = Math.sin(angle) * 10;

          targetX = p.baseX * shrink + spiralX;
          targetY = p.baseY * shrink + Math.sin(time * 0.006 + i * 0.1) * 8;
          targetZ = p.baseZ * shrink + spiralZ;
          break;
        }

        case 'speaking': {
          // Wave/pulse outward with audio
          const wavePhase = time * 0.004 + (p.baseY / BASE_RADIUS) * Math.PI;
          const waveScale = 1 + Math.sin(wavePhase) * 0.15;
          const audioScale = 1 + audioIntensity * 0.3;

          scale = waveScale * audioScale;

          // Ripple effect from center
          const dist = Math.sqrt(p.baseX ** 2 + p.baseZ ** 2);
          const ripple = Math.sin(time * 0.005 - dist * 0.05) * 10 * audioIntensity;

          targetX = p.baseX * scale;
          targetY = p.baseY * scale + ripple;
          targetZ = p.baseZ * scale;
          break;
        }
      }

      // Smooth interpolation
      const lerp = 0.08;
      p.x += (targetX - p.x) * lerp;
      p.y += (targetY - p.y) * lerp;
      p.z += (targetZ - p.z) * lerp;
    });

    // Project and sort particles by Z for proper depth ordering
    const projected = particles.map((p, i) => {
      const [rx, ry, rz] = rotatePoint(
        p.x,
        p.y,
        p.z,
        rotationRef.current.x,
        rotationRef.current.y
      );

      const perspective = 400;
      const projScale = perspective / (perspective + rz);
      const screenX = centerX + rx * projScale;
      const screenY = centerY + ry * projScale;

      return {
        index: i,
        x: screenX,
        y: screenY,
        z: rz,
        scale: projScale,
        particle: p,
      };
    });

    // Sort by Z (back to front)
    projected.sort((a, b) => a.z - b.z);

    // Draw edges between nearby particles
    ctx.strokeStyle = getEdgeColor(state, audioIntensity);
    ctx.lineWidth = 0.5;

    for (let i = 0; i < projected.length; i++) {
      for (let j = i + 1; j < projected.length; j++) {
        const p1 = projected[i];
        const p2 = projected[j];

        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECTION_DISTANCE) {
          const opacity = (1 - dist / CONNECTION_DISTANCE) * 0.4;
          const depthFade = Math.min(p1.scale, p2.scale);

          ctx.globalAlpha = opacity * depthFade;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

    // Draw particles
    projected.forEach((p) => {
      const { x, y, scale, z } = p;

      // Depth-based opacity and size
      const depthOpacity = 0.3 + scale * 0.7;
      const radius = 1.5 + scale * 1.5;

      ctx.globalAlpha = depthOpacity;
      ctx.fillStyle = getParticleColor(state, z, audioIntensity);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    timeRef.current += 16;
    animationRef.current = requestAnimationFrame(animate);
  }, [state, size, getAudioIntensity, audioLevels]);

  // Initialize
  useEffect(() => {
    initParticles();
  }, [initParticles]);

  // Start/stop animation
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Reset transform before scaling to avoid accumulation
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      className="particle-sphere"
      style={{
        width: size,
        height: size,
        display: 'block',
      }}
    />
  );
}
