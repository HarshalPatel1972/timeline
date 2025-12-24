'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, DepthOfField } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { useExperienceStore } from '@/store/experience';
import { Fragments } from './Fragments';
import { AmbientAudio } from './AmbientAudio';
import { Trail } from '@react-three/drei';

// Elegant Flow Field Particles
function FlowField() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { mousePosition } = useExperienceStore();
  const count = 3000; // High density
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Initialize particles in a sphere formation
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = 4 + Math.random() * 2; // Radius
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        temp.push({
            pos: new THREE.Vector3(x, y, z),
            originalPos: new THREE.Vector3(x, y, z),
            velocity: new THREE.Vector3(0, 0, 0),
            // Unique offsets for fluid motion
            noiseOffset: Math.random() * 100,
            speed: 0.05 + Math.random() * 0.1,
            size: 0.015 + Math.random() * 0.025
        });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    
    // Normalize mouse to -1 to 1 space
    const mouseParams = {
        x: (mousePosition.x / window.innerWidth) * 2 - 1,
        y: -(mousePosition.y / window.innerHeight) * 2 + 1
    };

    particles.forEach((particle, i) => {
      // 1. Organic Flow (Sine waves)
      const flowX = Math.sin(time * 0.5 + particle.pos.y * 0.5 + particle.noiseOffset) * 0.005;
      const flowY = Math.cos(time * 0.3 + particle.pos.x * 0.5 + particle.noiseOffset) * 0.005;
      const flowZ = Math.sin(time * 0.4 + particle.pos.z * 0.5) * 0.005;

      particle.pos.add(new THREE.Vector3(flowX, flowY, flowZ));

      // 2. Mouse Attraction (Premium Feel)
      // Project mouse to 3D roughly
      const targetX = mouseParams.x * 8;
      const targetY = mouseParams.y * 4;
      
      const dist = Math.sqrt(
          Math.pow(particle.pos.x - targetX, 2) + 
          Math.pow(particle.pos.y - targetY, 2)
      );

      // Smooth attraction if close
      if (dist < 3.5) {
          const force = (3.5 - dist) * 0.02;
          particle.pos.x += (targetX - particle.pos.x) * force;
          particle.pos.y += (targetY - particle.pos.y) * force;
      }

      // 3. Gentle Return to Sphere
      const originDist = particle.pos.distanceTo(new THREE.Vector3(0,0,0));
      if (originDist > 6 || originDist < 2) {
         particle.pos.lerp(particle.originalPos, 0.01);
      }

      // Update Instance
      dummy.position.copy(particle.pos);
      
      // Scale breathes slightly
      const breathes = 1 + Math.sin(time * 2 + i) * 0.3;
      dummy.scale.setScalar(particle.size * breathes);
      
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 12, 12]} />{/* Higher resolution spheres */}
      <meshBasicMaterial 
        color="#ffffff"
        transparent
        opacity={0.8}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

function CinematicLighting() {
    return (
        <>
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#4444ff" />
            <pointLight position={[-10, -10, -10]} intensity={1} color="#ff44aa" />
        </>
    )
}

function Scene() {
  return (
    <>
      <CinematicLighting />
      <FlowField />
      
      {/* High-End Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom 
            luminanceThreshold={0.2} 
            mipmapBlur 
            intensity={1.2} 
            radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
        {/* Subtle Depth of Field for cinematic look */}
        <DepthOfField target={[0, 0, 0]} focalLength={0.5} bokehScale={2} height={480} /> 
      </EffectComposer>
    </>
  );
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
  const [ready, setReady] = useState(false);

  useEffect(() => {
     // Immediate start, transition handled by css/motion
     setReady(true); 
  }, []);

  return (
    <div className="w-full h-full relative">
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        <Canvas
          camera={{ position: [0, 0, 10], fov: 45 }}
          gl={{ 
              antialias: false, // Better performance with postprocessing
              powerPreference: "high-performance",
              alpha: false,
              stencil: false
          }} 
          dpr={[1, 2]} // Quality scaling
        >
          <color attach="background" args={['#050505']} />
          <Scene />
          <MouseHandler />
        </Canvas>
      </motion.div>
      
      {/* Narrative Layer */}
      <Fragments />
      <AmbientAudio />
    </div>
  );
}
