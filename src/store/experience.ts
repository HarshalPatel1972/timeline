import { create } from 'zustand';

interface ExperienceState {
  seed: string | null;
  birthTime: number | null;
  isBurned: boolean;
  aggressionLevel: number;
  hesitationTime: number;
  fragmentsRevealed: number;
  mousePosition: { x: number; y: number };
  mouseVelocity: number;
  isWithdrawing: boolean;
  colorPhase: number;
  
  // Actions
  initSession: (seed: string) => void;
  burnSession: () => void;
  updateMouse: (x: number, y: number, velocity: number) => void;
  addHesitation: (ms: number) => void;
  setAggression: (level: number) => void;
  revealFragment: () => void;
  setWithdrawing: (withdrawing: boolean) => void;
  updateColorPhase: (delta: number) => void;
}

// Simple seeded RNG
function createRNG(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return function() {
    h = Math.imul(h ^ h >>> 15, h | 1);
    h ^= h + Math.imul(h ^ h >>> 7, h | 61);
    return ((h ^ h >>> 14) >>> 0) / 4294967296;
  };
}

export const useExperienceStore = create<ExperienceState>((set) => ({
  seed: null,
  birthTime: null,
  isBurned: false,
  aggressionLevel: 0,
  hesitationTime: 0,
  fragmentsRevealed: 0,
  mousePosition: { x: 0, y: 0 },
  mouseVelocity: 0,
  isWithdrawing: false,
  colorPhase: 0,
  
  initSession: (seed: string) => set({
    seed,
    birthTime: Date.now(),
    isBurned: false,
  }),
  
  burnSession: () => set({ isBurned: true }),
  
  updateMouse: (x: number, y: number, velocity: number) => set((state) => ({
    mousePosition: { x, y },
    mouseVelocity: velocity,
    aggressionLevel: velocity > 50 
      ? Math.min(1, state.aggressionLevel + 0.15)
      : Math.max(0, state.aggressionLevel - 0.02),
  })),
  
  addHesitation: (ms: number) => set((state) => ({
    hesitationTime: state.hesitationTime + ms,
  })),
  
  setAggression: (level: number) => set({ aggressionLevel: Math.min(1, Math.max(0, level)) }),
  
  revealFragment: () => set((state) => ({
    fragmentsRevealed: state.fragmentsRevealed + 1,
  })),
  
  setWithdrawing: (withdrawing: boolean) => set({ isWithdrawing: withdrawing }),
  
  updateColorPhase: (delta: number) => set((state) => ({
    colorPhase: state.colorPhase + delta,
  })),
}));

export { createRNG };
