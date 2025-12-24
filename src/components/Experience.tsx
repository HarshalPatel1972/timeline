'use client';

import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, DepthOfField, Noise } from '@react-three/postprocessing';
import { motion } from 'framer-motion';
import { useExperienceStore } from '@/store/experience';
import { Fragments } from './Fragments';
import { AmbientAudio } from './AmbientAudio';
import { SceneMatrix, SceneNoir, ScenePixar, SceneRetro } from './Themes';
import { FlowField, CinematicLighting } from './ExperienceCosmic'; // Refactored Cosmic scene

// Scene Director
function SceneDirector() {
  const { theme } = useExperienceStore();

  switch (theme) {
    case 'matrix':
      return <SceneMatrix />;
    case 'noir':
      return <SceneNoir />;
    case 'pixar':
      return <ScenePixar />;
    case 'retro':
      return <SceneRetro />;
    case 'cosmic':
    default:
      return (
        <>
          <CinematicLighting />
          <FlowField />
          <EffectComposer>
            <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.2} radius={0.6} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
            <DepthOfField target={[0, 0, 0]} focalLength={0.5} bokehScale={2} height={480} />
          </EffectComposer>
        </>
      );
  }
}

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
    <div className="w-full h-full relative cursor-none"> {/* Hide default cursor */}
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        key={theme} // Re-animate on theme change
      >
        <Canvas
          camera={{ position: [0, 0, 10], fov: 45 }}
          gl={{ 
              antialias: false,
              powerPreference: "high-performance",
              alpha: false,
              stencil: false
          }} 
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
             <SceneDirector />
          </Suspense>
          <MouseHandler />
        </Canvas>
      </motion.div>
      
      <Fragments />
      <AmbientAudio />
    </div>
  );
}
