'use client';

import { create } from 'zustand';

export interface UniverseDNA {
  seed: string;
  colors: {
    background: string;
    foreground: string;
    accent: string;
    glow: string;
  };
  geometry: {
    layout: 'sphere' | 'grid' | 'tunnel' | 'spiral' | 'cloud' | 'ring'; // New layouts
    shape: 'sphere' | 'box' | 'tetrahedon' | 'torus' | 'cone';
    count: number;
    scale: number;
    roughness: number;
    metalness: number;
    wireframe: boolean;
  };
  physics: {
    speed: number;
    flowType: 'sine' | 'noise' | 'vortex' | 'explosion';
    gravity: number;
  };
  postProcessing: {
    bloomIntensity: number;
    noiseOpacity: number;
    glitch: boolean;
    pixelate: boolean;
    vignetteDarkness: number;
    focusDistance: number;
  };
  audio: {
    baseFreq: number;
    scaleType: 'major' | 'minor' | 'pentatonic' | 'lydian' | 'phrygian' | 'chromatic';
    tempo: number;
    detune: number;
  };
}

// Deterministic Random Number Generator
function createRNG(seed: string): () => number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return function() {
    h = Math.imul(h ^ h >>> 15, h | 1);
    h ^= h + Math.imul(h ^ h >>> 7, h | 61);
    return ((h ^ h >>> 14) >>> 0) / 4294967296;
  };
}

function generateUniverse(seed: string): UniverseDNA {
  const rng = createRNG(seed);
  
  // Colors (HSV to Hex for consistency)
  const hue = rng();
  const sat = 0.5 + rng() * 0.5;
  
  // Helper to standard hex (simplified for brevity)
  const color = (h: number, s: number, l: number) => {
     // Very simple placeholder color gen, normally we'd do full HSL conversion
     // Using HSL strings directly in Three.js is often easier
     return `hsl(${h * 360}, ${s * 100}%, ${l * 100}%)`;
  };

  return {
    seed,
    colors: {
      background: color(hue, 0.2, 0.05), // Dark varied background
      foreground: color((hue + 0.5) % 1, 0.1, 0.9), // Contrast text
      accent: color((hue + 0.3) % 1, 0.8, 0.6), // Bright accent
      glow: color(hue, 0.9, 0.5), // Glow/Bloom color
    },
    geometry: {
      layout: ['sphere', 'grid', 'tunnel', 'spiral', 'cloud', 'ring'][Math.floor(rng() * 6)] as any,
      shape: ['sphere', 'box', 'tetrahedon', 'torus', 'cone'][Math.floor(rng() * 5)] as any,
      count: Math.floor(200 + rng() * 1500), // optimized count
      scale: 0.2 + rng() * 1.5,
      roughness: rng(),
      metalness: rng(),
      wireframe: rng() > 0.6,
    },
    physics: {
      speed: 0.05 + rng() * 0.4,
      flowType: ['sine', 'noise', 'vortex', 'explosion'][Math.floor(rng() * 4)] as any,
      gravity: (rng() - 0.5) * 5,
    },
    postProcessing: {
      bloomIntensity: 0.5 + rng() * 2,
      noiseOpacity: 0.05 + rng() * 0.2, // increased noise visibility
      glitch: rng() > 0.9,
      pixelate: rng() > 0.95,
      vignetteDarkness: 0.4 + rng() * 0.6,
      focusDistance: rng(),
    },
    audio: {
      baseFreq: 60 + rng() * 100, // lower frequencies for ambience
      scaleType: ['major', 'minor', 'pentatonic', 'lydian', 'phrygian', 'chromatic'][Math.floor(rng() * 6)] as any,
      tempo: 0.1 + rng() * 0.5,
      detune: rng() * 20,
    }
  };
}

interface ExperienceState {
  dna: UniverseDNA | null;
  mousePosition: { x: number; y: number };
  isAudioEnabled: boolean;
  
  // Actions
  initDNA: (seed: string) => void;
  updateMouse: (x: number, y: number) => void;
  burnSession: () => void;
  enableAudio: () => void;
}

export const useExperienceStore = create<ExperienceState>((set) => ({
  dna: null,
  mousePosition: { x: 0, y: 0 },
  isAudioEnabled: false,
  
  initDNA: (seed: string) => {
    const dna = generateUniverse(seed);
    // ... rest of initDNA ...
    if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--color-background', dna.colors.background);
        document.documentElement.style.setProperty('--color-foreground', dna.colors.foreground);
    }
    set({ dna });
  },

  enableAudio: () => set({ isAudioEnabled: true }),
  
  updateMouse: (x: number, y: number) => set({ mousePosition: { x, y } }),
  
  burnSession: () => set((state) => ({ /* In Multiverse mode, burn might just mean reset or nothing, but interface expects it */ })), 
}));
