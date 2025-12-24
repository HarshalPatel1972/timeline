'use client';

import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
import { useExperienceStore } from '@/store/experience';
import { Fragments } from './Fragments';
import { AmbientAudio } from './AmbientAudio';
// Switch to GPU Engine
import { GPUProceduralScene } from './GPUProceduralScene';

// Mouse Handler attached to Canvas
function MouseHandler() {
    const { updateMouse } = useExperienceStore();
    return (
        <group>
             <mesh visible={false} onPointerMove={(e) => updateMouse(e.clientX, e.clientY, 0)}>
                 <planeGeometry args={[100, 100]} />
             </mesh>
        </group>
    )
}

export default function Experience() {
  const { theme } = useExperienceStore();

  return (
    <div className="w-full h-full relative cursor-none">
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        key={theme} 
      >
        <Canvas
          camera={{ position: [0, 0, 30], fov: 60 }} // Further back camera for big GPU scale
          gl={{ 
              antialias: false,
              powerPreference: "high-performance",
              alpha: false,
              stencil: false
          }} 
          dpr={[1, 1.5]} // Limit DPR for mobile performance
        >
          <Suspense fallback={null}>
             <color attach="background" args={['#050510']} />
             <GPUProceduralScene />
          </Suspense>
          <MouseHandler />
        </Canvas>
      </motion.div>
      
      <Fragments />
      <AmbientAudio />
    </div>
  );
}
