'use client';

import { useExperienceStore } from '@/store/experience';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';

export function CustomCursor() {
  const { mousePosition, dna } = useExperienceStore();
  
  // Spring physics for smooth follow (addresses "teleport" issue)
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorX = useSpring(0, springConfig);
  const cursorY = useSpring(0, springConfig);

  useEffect(() => {
    cursorX.set(mousePosition.x - 10);
    cursorY.set(mousePosition.y - 10);
  }, [mousePosition, cursorX, cursorY]);

  // DNA-based cursor style
  const color = dna ? dna.colors.accent : '#fff';

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-5 h-5 rounded-full border border-white pointer-events-none z-[100] mix-blend-difference"
        style={{
          x: cursorX,
          y: cursorY,
          backgroundColor: 'transparent',
        }}
      />
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none z-[100]"
        style={{
          x: cursorX,
          y: cursorY,
          marginLeft: 6,
          marginTop: 6,
          backgroundColor: color,
        }}
      />
    </>
  );
}
