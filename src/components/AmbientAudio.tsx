'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useExperienceStore } from '@/store/experience';

export function AmbientAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{
    master?: GainNode;
    drone?: OscillatorNode;
    drone2?: OscillatorNode;
    sub?: OscillatorNode;
    filter?: BiquadFilterNode;
    lfo?: OscillatorNode;
  }>({});
  const isInitializedRef = useRef(false);

  const { mousePosition, aggressionLevel, isWithdrawing } = useExperienceStore();

  const initAudio = useCallback(() => {
    if (isInitializedRef.current || typeof window === 'undefined') return;

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;

      // Master gain
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      nodesRef.current.master = master;

      // Low drone
      const drone = ctx.createOscillator();
      drone.type = 'sine';
      drone.frequency.value = 55;
      nodesRef.current.drone = drone;

      // Second harmonic
      const drone2 = ctx.createOscillator();
      drone2.type = 'sine';
      drone2.frequency.value = 82.5;
      nodesRef.current.drone2 = drone2;

      // Sub bass
      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.value = 27.5;
      nodesRef.current.sub = sub;

      // Gains
      const droneGain = ctx.createGain();
      droneGain.gain.value = 0.12;

      const drone2Gain = ctx.createGain();
      drone2Gain.gain.value = 0.06;

      const subGain = ctx.createGain();
      subGain.gain.value = 0.1;

      // LFO for drift
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.04;
      nodesRef.current.lfo = lfo;

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 1.5;

      lfo.connect(lfoGain);
      lfoGain.connect(drone.frequency);

      // Filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 180;
      filter.Q.value = 0.8;
      nodesRef.current.filter = filter;

      // Connect
      drone.connect(droneGain);
      drone2.connect(drone2Gain);
      sub.connect(subGain);

      droneGain.connect(filter);
      drone2Gain.connect(filter);
      subGain.connect(filter);

      filter.connect(master);

      // Start
      drone.start();
      drone2.start();
      sub.start();
      lfo.start();

      // Fade in
      const now = ctx.currentTime;
      master.gain.setValueAtTime(0, now);
      master.gain.linearRampToValueAtTime(0.025, now + 6);

      isInitializedRef.current = true;
    } catch (e) {
      console.log('Audio not available');
    }
  }, []);

  // Init on first interaction
  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('mousemove', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('mousemove', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('mousemove', handleInteraction);
    };
  }, [initAudio]);

  // React to mouse proximity
  useEffect(() => {
    if (!audioContextRef.current || !nodesRef.current.filter) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const dist = Math.sqrt(
      Math.pow(mousePosition.x - centerX, 2) +
      Math.pow(mousePosition.y - centerY, 2)
    );
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
    const proximity = 1 - (dist / maxDist);

    const freq = 150 + proximity * 80;
    const now = audioContextRef.current.currentTime;
    nodesRef.current.filter.frequency.linearRampToValueAtTime(freq, now + 0.3);
  }, [mousePosition]);

  // React to aggression
  useEffect(() => {
    if (!audioContextRef.current || !nodesRef.current.master) return;

    const targetVol = 0.025 * (1 - aggressionLevel * 0.6);
    const now = audioContextRef.current.currentTime;
    nodesRef.current.master.gain.linearRampToValueAtTime(targetVol, now + 0.2);
  }, [aggressionLevel]);

  // Fade out on withdraw
  useEffect(() => {
    if (!audioContextRef.current || !nodesRef.current.master) return;

    const now = audioContextRef.current.currentTime;
    if (isWithdrawing) {
      nodesRef.current.master.gain.linearRampToValueAtTime(0.005, now + 0.5);
    } else {
      nodesRef.current.master.gain.linearRampToValueAtTime(0.025, now + 1);
    }
  }, [isWithdrawing]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return null;
}
