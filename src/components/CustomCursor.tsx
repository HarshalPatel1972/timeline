'use client';

import { useEffect, useRef } from 'react';
import { useExperienceStore } from '@/store/experience';
import { motion } from 'framer-motion';

export function CustomCursor() {
  const { mousePosition, theme } = useExperienceStore();
  
  // Theme-specific cursor styles
  const getCursorStyle = () => {
    switch (theme) {
      case 'matrix': return 'bg-[#00ff41] shadow-[0_0_10px_#00ff41]';
      case 'noir': return 'bg-white mix-blend-difference';
      case 'pixar': return 'bg-yellow-400 shadow-lg scale-125';
      case 'retro': return 'bg-[#ff00ff] border-2 border-cyan-400 rounded-none';
      default: return 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]';
    }
  };

  return (
    <motion.div
      className={`fixed top-0 left-0 w-4 h-4 rounded-full pointer-events-none z-[100] ${getCursorStyle()}`}
      animate={{
        x: mousePosition.x - 8,
        y: mousePosition.y - 8,
        scale: 1,
      }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 200,
        mass: 0.5
      }}
    />
  );
}
