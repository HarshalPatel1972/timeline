'use client';

import { useState } from 'react';
import { useExperienceStore } from '@/store/experience';
import { motion, AnimatePresence } from 'framer-motion';

export function Overlay() {
  const { isAudioEnabled, enableAudio } = useExperienceStore();
  const [clicked, setClicked] = useState(false);

  const handleStart = () => {
    enableAudio();
    setClicked(true);
  };

  return (
    <AnimatePresence>
      {!clicked && (
        <motion.div
           className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md cursor-pointer"
           onClick={handleStart}
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0, transition: { duration: 1 } }}
        >
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
             className="text-white font-light tracking-[0.3em] text-sm md:text-base cinematic-text"
           >
             [ TOUCH TO EXIST ]
           </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
