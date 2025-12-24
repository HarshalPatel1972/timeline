'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useExperienceStore } from '@/store/experience';

export function AmbientAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const initialized = useRef(false);
  const { dna } = useExperienceStore(); 

  const initAudio = useCallback(() => {
    if (initialized.current || !dna) return;
    initialized.current = true;

    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    masterRef.current = master;

    // Generate Scale based on DNA
    const base = dna.audio.baseFreq;
    const type = dna.audio.scaleType;
    let ratios: number[] = [];

    // Simple Ratio intervals
    switch (type) {
        case 'major': ratios = [1, 1.25, 1.5, 1.875, 2]; break;
        case 'minor': ratios = [1, 1.2, 1.5, 1.6, 2]; break;
        case 'pentatonic': ratios = [1, 1.125, 1.25, 1.5, 1.66]; break;
        case 'lydian': ratios = [1, 1.25, 1.41, 1.5, 2]; break;
        case 'phrygian': ratios = [1, 1.06, 1.5, 1.6, 2]; break;
        case 'chromatic': ratios = [1, 1.059, 1.12, 1.5, 2]; break;
        default: ratios = [1, 1.5, 2];
    }
    
    // Create Oscillators
    ratios.forEach((ratio, i) => {
        const osc = ctx.createOscillator();
        osc.type = Math.random() > 0.8 ? 'triangle' : 'sine'; // Mostly sine
        osc.frequency.value = base * ratio;
        osc.detune.value = (Math.random() - 0.5) * dna.audio.detune;

        const gain = ctx.createGain();
        gain.gain.value = 0.05 / (i + 1);
        
        // LFO for movement using DNA properties
        const lfo = ctx.createOscillator();
        lfo.frequency.value = dna.audio.tempo * (0.5 + Math.random());
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.5;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();

        const panner = ctx.createStereoPanner();
        panner.pan.value = (Math.random() - 0.5) * 0.9;

        osc.connect(gain);
        gain.connect(panner);
        panner.connect(master);
        osc.start();
    });

    // Fade in
    master.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 5);
  }, [dna]);

  const { isAudioEnabled } = useExperienceStore();

  useEffect(() => {
    if (isAudioEnabled && !initialized.current) {
        initAudio();
        if (ctxRef.current?.state === 'suspended') {
            ctxRef.current.resume();
        }
    }
  }, [isAudioEnabled, initAudio]);

  return null;
}
