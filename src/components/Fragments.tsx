'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperienceStore } from '@/store/experience';

// A scripted narrative instead of random fragments
const narrative = [
  "This is not a product.",
  "It is a moment.",
  "You are the only one seeing this version.",
  "Once you leave...",
  "It will be gone forever.",
  "No archives.",
  "No history.",
  "Just this.",
  "Breathe.",
  "Watch.",
  "And let go."
];

export function Fragments() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const { theme } = useExperienceStore(); // Get theme
  
  // Theme-specific text styles
  const getTextStyle = () => {
    switch (theme) {
      case 'matrix': return 'font-mono text-[#00ff41] bg-black/50 px-4';
      case 'retro': return 'font-bold italic text-[#ff00ff] drop-shadow-[2px_2px_0_#00ffff]';
      case 'noir': return 'font-serif text-white uppercase tracking-[0.5em] font-black border-y-2 border-white py-2';
      case 'pixar': return 'font-sans text-white font-extrabold drop-shadow-lg tracking-normal';
      default: return 'font-light tracking-[0.2em] uppercase text-white/90 cinematic-text'; // Cosmic
    }
  };
  useEffect(() => {
    const timer = setInterval(() => {
        setVisible(false); // Fade out
        setTimeout(() => {
            setIndex((prev) => (prev + 1) % narrative.length); // Next line
            setVisible(true); // Fade in
        }, 2000); // Wait for fade out
    }, 6000); // Read time

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <AnimatePresence mode='wait'>
          {visible && (
            <motion.div
                key={index}
                initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-center"
            >
                <p className={`fragment-text text-2xl md:text-3xl ${getTextStyle()}`}>
                    {narrative[index]}
                </p>
                {/* Subtle progress bar or decoration could go here, but minimal is better */}
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}
