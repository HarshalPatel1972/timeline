'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperienceStore, createRNG } from '@/store/experience';
import { Fragments } from './Fragments';
import { AmbientAudio } from './AmbientAudio';

// Floating particles in 3D space
function Particles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { seed, aggressionLevel, isWithdrawing } = useExperienceStore();
  
  const count = 200;
  const rng = useMemo(() => seed ? createRNG(seed) : Math.random, [seed]);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: new THREE.Vector3(
          (rng() - 0.5) * 20,
          (rng() - 0.5) * 20,
          (rng() - 0.5) * 10
        ),
        velocity: new THREE.Vector3(
          (rng() - 0.5) * 0.002,
          (rng() - 0.5) * 0.002,
          (rng() - 0.5) * 0.001
        ),
        scale: 0.02 + rng() * 0.04,
        phase: rng() * Math.PI * 2,
        baseOpacity: 0.3 + rng() * 0.5,
      });
    }
    return temp;
  }, [rng]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    const withdrawFactor = isWithdrawing ? 0.3 : 1;
    
    particles.forEach((particle, i) => {
      // Drift
      particle.position.add(particle.velocity);
      
      // Wrap around
      ['x', 'y', 'z'].forEach((axis) => {
        const a = axis as 'x' | 'y' | 'z';
        if (particle.position[a] > 10) particle.position[a] = -10;
        if (particle.position[a] < -10) particle.position[a] = 10;
      });
      
      // Pulse
      const pulse = 0.7 + Math.sin(time * 0.5 + particle.phase) * 0.3;
      const scale = particle.scale * pulse * withdrawFactor;
      
      dummy.position.copy(particle.position);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial 
        color="#8a7a7a" 
        transparent 
        opacity={0.6} 
      />
    </instancedMesh>
  );
}

// Floating ethereal shapes
function FloatingShapes() {
  const groupRef = useRef<THREE.Group>(null);
  const { seed, isWithdrawing } = useExperienceStore();
  
  const rng = useMemo(() => seed ? createRNG(seed) : Math.random, [seed]);
  
  const shapes = useMemo(() => {
    const temp = [];
    const count = 6 + Math.floor(rng() * 4);
    
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          (rng() - 0.5) * 15,
          (rng() - 0.5) * 15,
          (rng() - 0.5) * 8,
        ] as [number, number, number],
        rotation: rng() * Math.PI * 2,
        rotationSpeed: (rng() - 0.5) * 0.003,
        scale: 0.5 + rng() * 1.5,
        drift: [
          (rng() - 0.5) * 0.005,
          (rng() - 0.5) * 0.005,
          (rng() - 0.5) * 0.002,
        ],
        vertices: 3 + Math.floor(rng() * 5),
        phase: rng() * Math.PI * 2,
      });
    }
    return temp;
  }, [rng]);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    const withdrawFactor = isWithdrawing ? 0.5 : 1;
    
    groupRef.current.children.forEach((child, i) => {
      const shape = shapes[i];
      if (!shape) return;
      
      // Drift
      child.position.x += shape.drift[0];
      child.position.y += shape.drift[1];
      child.position.z += shape.drift[2];
      
      // Wrap
      if (child.position.x > 10) child.position.x = -10;
      if (child.position.x < -10) child.position.x = 10;
      if (child.position.y > 10) child.position.y = -10;
      if (child.position.y < -10) child.position.y = 10;
      
      // Rotate
      child.rotation.z += shape.rotationSpeed;
      
      // Pulse scale
      const pulse = 0.8 + Math.sin(time * 0.3 + shape.phase) * 0.2;
      child.scale.setScalar(shape.scale * pulse * withdrawFactor);
    });
  });

  return (
    <group ref={groupRef}>
      {shapes.map((shape, i) => (
        <mesh key={i} position={shape.position} rotation={[0, 0, shape.rotation]}>
          <circleGeometry args={[1, shape.vertices]} />
          <meshBasicMaterial 
            color="#1a1520" 
            transparent 
            opacity={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// Drifting color background
function DriftingBackground() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { updateColorPhase, colorPhase } = useExperienceStore();

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    updateColorPhase(delta * 0.1);
    
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    const hue = 0.65 + Math.sin(colorPhase) * 0.05;
    const saturation = 0.1 + Math.sin(colorPhase * 0.7) * 0.05;
    const lightness = 0.03 + Math.sin(colorPhase * 0.5) * 0.01;
    
    material.color.setHSL(hue, saturation, lightness);
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -15]}>
      <planeGeometry args={[50, 50]} />
      <meshBasicMaterial color="#0a0a10" />
    </mesh>
  );
}

// Mouse tracking
function MouseTracker() {
  const { camera, gl } = useThree();
  const { updateMouse, setAggression, aggressionLevel, setWithdrawing } = useExperienceStore();
  const lastPos = useRef({ x: 0, y: 0 });
  const clickCount = useRef(0);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      const velocity = Math.sqrt(dx * dx + dy * dy);
      
      updateMouse(e.clientX, e.clientY, velocity);
      lastPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleClick = () => {
      setAggression(aggressionLevel + 0.3);
      clickCount.current++;
      
      if (clickTimer.current) clearTimeout(clickTimer.current);
      clickTimer.current = setTimeout(() => {
        if (clickCount.current > 3) {
          setWithdrawing(true);
          setTimeout(() => setWithdrawing(false), 3000);
        }
        clickCount.current = 0;
      }, 500);
    };

    const canvas = gl.domElement;
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [gl, updateMouse, setAggression, aggressionLevel, setWithdrawing]);

  return null;
}

// Main scene
function Scene() {
  return (
    <>
      <DriftingBackground />
      <Particles />
      <FloatingShapes />
      <MouseTracker />
      
      <EffectComposer>
        <Bloom 
          intensity={0.5} 
          luminanceThreshold={0.2} 
          luminanceSmoothing={0.9} 
        />
        <Noise opacity={0.04} />
        <Vignette darkness={0.7} offset={0.2} />
      </EffectComposer>
    </>
  );
}

export default function Experience() {
  const [emerged, setEmerged] = useState(false);
  const { seed } = useExperienceStore();

  useEffect(() => {
    const timer = setTimeout(() => setEmerged(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div 
      className="w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: emerged ? 1 : 0 }}
      transition={{ duration: 5, ease: 'easeOut' }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: '#050507' }}
      >
        <Scene />
      </Canvas>
      
      {/* Text fragments overlay */}
      <Fragments />
      
      {/* Ambient audio */}
      <AmbientAudio />
    </motion.div>
  );
}
