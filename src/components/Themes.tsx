'use client';

import { useExperienceStore } from '@/store/experience';

// Matrix: Digital Rain
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

export function SceneMatrix() {
  const { mousePosition } = useExperienceStore();
  const count = 50;
  
  const columns = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => ({
      x: (Math.random() - 0.5) * 20,
      y: (Math.random() - 0.5) * 20,
      z: (Math.random() - 0.5) * 10,
      speed: 0.05 + Math.random() * 0.1,
      chars: "01"
    }));
  }, []);

  return (
    <>
      <color attach="background" args={['#000500']} />
      <ambientLight intensity={0.5} />
      
      {columns.map((col, i) => (
        <MatrixColumn key={i} data={col} />
      ))}
      
      <EffectComposer>
        <Bloom luminanceThreshold={0} mipmapBlur intensity={0.5} radius={0.8} />
      </EffectComposer>
    </>
  );
}

function MatrixColumn({ data }: { data: any }) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y -= data.speed;
    if (ref.current.position.y < -10) ref.current.position.y = 10;
  });

  return (
    <group ref={ref} position={[data.x, data.y, data.z]}>
      {Array.from({ length: 10 }).map((_, i) => (
        <Text
          key={i}
          position={[0, i * 0.5, 0]}
          fontSize={0.4}
          color="#00ff41"
          font="https://fonts.gstatic.com/s/robotomono/v22/L0x5DF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_3v_7.ttf"
        >
          {Math.random() > 0.5 ? "1" : "0"}
        </Text>
      ))}
    </group>
  );
}

// Noir: Stark Light and Shadow
export function SceneNoir() {
  const { mousePosition } = useExperienceStore();
  
  // Spotlight follows mouse
  const lightPos = [
    (mousePosition.x / window.innerWidth - 0.5) * 20,
    -(mousePosition.y / window.innerHeight - 0.5) * 10,
    5
  ] as [number, number, number];

  return (
    <>
      <color attach="background" args={['#111']} />
      
      {/* Dynamic Spotlight */}
      <spotLight 
        position={lightPos} 
        angle={0.3} 
        penumbra={0.5} 
        intensity={20} 
        color="white" 
        castShadow 
      />
      
      {/* Fog for atmosphere */}
      <fog attach="fog" args={['#000', 5, 20]} />
      
      {/* Abstract geometric forms */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh 
          key={i} 
          position={[
            (Math.random() - 0.5) * 15, 
            (Math.random() - 0.5) * 15, 
            (Math.random() - 0.5) * 10
          ]}
          rotation={[Math.random(), Math.random(), 0]}
        >
          <boxGeometry args={[1, 4, 1]} />
          <meshStandardMaterial color="#333" roughness={0.2} metalness={0.8} />
        </mesh>
      ))}
    </>
  );
}

// Pixar: Bouncy, Colorful, Soft
export function ScenePixar() {
  const { mousePosition } = useExperienceStore();

  useFrame((state) => {
    // Gentle bobbing camera
    state.camera.position.y = Math.sin(state.clock.elapsedTime) * 0.5;
  });

  return (
    <>
      <color attach="background" args={['#87CEEB']} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      
      {/* Clouds */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[(Math.random()-0.5)*20, (Math.random()-0.5)*10, -5]}>
          <sphereGeometry args={[2, 32, 32]} />
          <meshStandardMaterial color="white" roughness={0.8} />
        </mesh>
      ))}
      
      {/* Bouncy colorful balls that react to mouse */}
      {Array.from({ length: 15 }).map((_, i) => (
        <BouncyBall key={i} color={`hsl(${Math.random() * 360}, 70%, 50%)`} mouse={mousePosition} />
      ))}
    </>
  );
}

function BouncyBall({ color, mouse }: { color: string, mouse: {x: number, y: number} }) {
  const ref = useRef<THREE.Mesh>(null);
  const offset = Math.random() * 100;
  
  useFrame((state) => {
    if(!ref.current) return;
    const t = state.clock.elapsedTime + offset;
    ref.current.position.y += Math.sin(t * 3) * 0.02;
    // Simple lookAt mouse logic could go here
  });

  return (
    <mesh ref={ref} position={[(Math.random()-0.5)*15, (Math.random()-0.5)*15, 0]}>
      <sphereGeometry args={[0.8, 32, 32]} />
      <meshStandardMaterial color={color} roughness={0.1} metalness={0.1} />
    </mesh>
  );
}

// Retro: Vaporwave Grid
export function SceneRetro() {
  const gridRef = useRef<THREE.GridHelper>(null);
  
  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.position.z = (state.clock.elapsedTime * 2) % 2;
    }
  });

  return (
    <>
      <color attach="background" args={['#200020']} />
      <fog attach="fog" args={['#200020', 5, 20]} />
      
      <ambientLight intensity={0.5} />
      
      {/* Sun */}
      <mesh position={[0, 2, -15]}>
        <circleGeometry args={[5, 32]} />
        <meshBasicMaterial color="#ff00ff" />
      </mesh>
      
      {/* Moving Grid */}
      <gridHelper 
        ref={gridRef}
        args={[40, 40, 0xff00ff, 0x00ffff]} 
        position={[0, -2, 0]} 
        rotation={[0, 0, 0]} 
      />
      
      {/* Wireframe Mountains */}
      {Array.from({length: 5}).map((_, i) => (
          <mesh key={i} position={[(i-2)*8, -1, -5]} rotation={[-Math.PI/2, 0, 0]}>
              <coneGeometry args={[4, 6, 4, 1]} />
              <meshBasicMaterial color="#00ffff" wireframe />
          </mesh>
      ))}
    </>
  );
}
