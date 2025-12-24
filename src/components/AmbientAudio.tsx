'use client';

import { useEffect, useRef, useCallback } from 'react';

export function AmbientAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const initialized = useRef(false);

  const initAudio = useCallback(() => {
    if (initialized.current) return;
    initialized.current = true;

    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    masterRef.current = master;

    // Create a beautiful major 7th chord pad (Ethereal)
    // Root, 3rd, 5th, 7th in different octaves
    const freqs = [
        130.81, // C3
        196.00, // G3
        246.94, // B3
        261.63, // C4
        329.63, // E4
        392.00  // G4
    ];

    freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine'; // Sine is smooth
        osc.frequency.value = f;

        // Individual gain for balance
        const gain = ctx.createGain();
        gain.gain.value = 0.03 / (i + 1); // Higher notes quieter
        
        // Slight detune for richness
        osc.detune.value = (Math.random() - 0.5) * 10; 

        // Panning for stereo width
        const panner = ctx.createStereoPanner();
        panner.pan.value = (Math.random() - 0.5) * 0.8;

        osc.connect(gain);
        gain.connect(panner);
        panner.connect(master);
        
        osc.start();

        // Subtle LFO on gain for breathing effect
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1 + Math.random() * 0.1; // Slow breath
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.5; // Depth
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain); // Modulate amplitude
        lfo.start();
    });

    // Fade in master
    master.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 10);
  }, []);

  useEffect(() => {
    const start = () => {
        initAudio();
        window.removeEventListener('click', start);
        window.removeEventListener('mousemove', start);
    };
    window.addEventListener('click', start);
    window.addEventListener('mousemove', start);
    return () => {
        window.removeEventListener('click', start);
        window.removeEventListener('mousemove', start);
        ctxRef.current?.close();
    }
  }, [initAudio]);

  return null;
}
