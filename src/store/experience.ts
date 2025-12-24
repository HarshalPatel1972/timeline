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
    type: 'sphere' | 'box' | 'tetrahedon' | 'torus' | 'particles' | 'shards';
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
    scaleType: 'major' | 'minor' | 'lydian' | 'dorian';
    tempo: number;
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
      type: ['sphere', 'box', 'tetrahedon', 'torus', 'particles', 'shards'][Math.floor(rng() * 6)] as any,
      count: Math.floor(50 + rng() * 4000), // Massive variance
      scale: 0.1 + rng() * 2,
      roughness: rng(),
      metalness: rng(),
      wireframe: rng() > 0.7,
    },
    physics: {
      speed: 0.01 + rng() * 0.2, // From calm to frantic
      flowType: ['sine', 'noise', 'vortex', 'explosion'][Math.floor(rng() * 4)] as any,
      gravity: (rng() - 0.5) * 2,
    },
    postProcessing: {
      bloomIntensity: rng() * 2.5,
      noiseOpacity: rng() * 0.15,
      glitch: rng() > 0.85, // Rare glitch universes
      pixelate: rng() > 0.9, // Rare retro universes
      vignetteDarkness: 0.5 + rng() * 0.6,
      focusDistance: rng(),
    },
    audio: {
      baseFreq: 50 + rng() * 200,
      scaleType: ['major', 'minor', 'lydian', 'dorian'][Math.floor(rng() * 4)] as any,
      tempo: 0.5 + rng() * 1.5,
    }
  };
}

interface ExperienceState {
  dna: UniverseDNA | null;
  mousePosition: { x: number; y: number };
  
  // Actions
  initDNA: (seed: string) => void;
  updateMouse: (x: number, y: number) => void;
  burnSession: () => void;
}

export const useExperienceStore = create<ExperienceState>((set) => ({
  dna: null,
  mousePosition: { x: 0, y: 0 },
  
  initDNA: (seed: string) => {
    const dna = generateUniverse(seed);
    console.log("Universe Generated:", dna);
    // Update CSS variables for UI
    if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--color-background', dna.colors.background);
        document.documentElement.style.setProperty('--color-foreground', dna.colors.foreground);
    }
    set({ dna });
  },
  
  updateMouse: (x: number, y: number) => set({ mousePosition: { x, y } }),
  
  burnSession: () => set((state) => ({ /* In Multiverse mode, burn might just mean reset or nothing, but interface expects it */ })), 
}));
