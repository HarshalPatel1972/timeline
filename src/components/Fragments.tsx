'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperienceStore, createRNG } from '@/store/experience';

const fragmentTexts = [
  "you were here",
  "once",
  "this moment",
  "cannot",
  "be held",
  "the space between",
  "seeing and",
  "forgetting",
  "is where",
  "you",
  "exist",
  "briefly",
  "like breath",
  "on glass",
  "already",
  "fading",
  "what you",
  "almost",
  "understood",
  "stays",
  "unnamed",
  "between one",
  "and none",
  "there was",
  "this"
];

interface FragmentData {
  text: string;
  x: number;
  y: number;
  rotation: number;
  skew: number;
  fontSize: number;
  threshold: number;
  revealed: boolean;
  id: number;
}

export function Fragments() {
  const { seed, mousePosition, isWithdrawing, revealFragment, hesitationTime, addHesitation } = useExperienceStore();
  const [fragments, setFragments] = useState<FragmentData[]>([]);
  const [localDwell, setLocalDwell] = useState(0);
  const lastMoveTime = useRef(Date.now());

  // Create fragments on mount
  useEffect(() => {
    if (!seed) return;
    
    const rng = createRNG(seed);
    const shuffled = [...fragmentTexts].sort(() => rng() - 0.5);
    const count = Math.floor(shuffled.length * 0.65);
    
    const newFragments: FragmentData[] = [];
    const usedPositions: { x: number; y: number }[] = [];
    
    for (let i = 0; i < count; i++) {
      let x: number, y: number, attempts = 0;
      
      do {
        x = 8 + rng() * 84;
        y = 8 + rng() * 84;
        attempts++;
      } while (
        attempts < 25 &&
        usedPositions.some(p => Math.abs(p.x - x) < 12 && Math.abs(p.y - y) < 12)
      );
      
      usedPositions.push({ x, y });
      
      newFragments.push({
        text: shuffled[i],
        x,
        y,
        rotation: (rng() - 0.5) * 4,
        skew: (rng() - 0.5) * 3,
        fontSize: 16 + rng() * 12,
        threshold: 800 + rng() * 3000,
        revealed: false,
        id: i,
      });
    }
    
    setFragments(newFragments);
  }, [seed]);

  // Track mouse dwell time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceMove = now - lastMoveTime.current;
      
      if (timeSinceMove > 400) {
        setLocalDwell(d => d + 100);
        addHesitation(100);
      } else {
        setLocalDwell(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [addHesitation]);

  // Update last move time on mouse movement
  useEffect(() => {
    lastMoveTime.current = Date.now();
  }, [mousePosition]);

  // Check fragment reveals
  useEffect(() => {
    if (localDwell < 500) return;

    setFragments(prev => prev.map(fragment => {
      if (fragment.revealed) return fragment;
      
      const fragX = (fragment.x / 100) * window.innerWidth;
      const fragY = (fragment.y / 100) * window.innerHeight;
      
      const dist = Math.sqrt(
        Math.pow(mousePosition.x - fragX, 2) +
        Math.pow(mousePosition.y - fragY, 2)
      );
      
      if (dist < 180 && localDwell > fragment.threshold) {
        revealFragment();
        return { ...fragment, revealed: true };
      }
      
      return fragment;
    }));
  }, [localDwell, mousePosition, revealFragment]);

  return (
    <div className="fixed inset-0 pointer-events-none z-20">
      <AnimatePresence>
        {fragments.map(fragment => (
          <motion.div
            key={fragment.id}
            className="absolute fragment-text whitespace-nowrap"
            style={{
              left: `${fragment.x}%`,
              top: `${fragment.y}%`,
              fontSize: `${fragment.fontSize}px`,
              transform: `rotate(${fragment.rotation}deg) skewX(${fragment.skew}deg)`,
            }}
            initial={{ opacity: 0.12 }}
            animate={{
              opacity: isWithdrawing ? 0 : fragment.revealed ? 0.85 : 0.12,
              scale: isWithdrawing ? 0.9 : 1,
              y: isWithdrawing ? 15 : 0,
              fontWeight: fragment.revealed ? 400 : 300,
            }}
            transition={{ 
              duration: fragment.revealed ? 2.5 : 0.8,
              ease: 'easeOut'
            }}
          >
            {fragment.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
