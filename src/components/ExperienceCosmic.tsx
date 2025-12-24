'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperienceStore } from '@/store/experience';

export function FlowField() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { mousePosition } = useExperienceStore();
  const count = 3000;
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = 4 + Math.random() * 2;
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        temp.push({
            pos: new THREE.Vector3(x, y, z),
            originalPos: new THREE.Vector3(x, y, z),
            noiseOffset: Math.random() * 100,
            size: 0.015 + Math.random() * 0.025
        });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    
    const mouseParams = {
        x: (mousePosition.x / window.innerWidth) * 2 - 1,
        y: -(mousePosition.y / window.innerHeight) * 2 + 1
    };

    particles.forEach((particle, i) => {
      const flowX = Math.sin(time * 0.5 + particle.pos.y * 0.5 + particle.noiseOffset) * 0.005;
      const flowY = Math.cos(time * 0.3 + particle.pos.x * 0.5 + particle.noiseOffset) * 0.005;
      const flowZ = Math.sin(time * 0.4 + particle.pos.z * 0.5) * 0.005;

      particle.pos.add(new THREE.Vector3(flowX, flowY, flowZ));

      const targetX = mouseParams.x * 8;
      const targetY = mouseParams.y * 4;
      const dist = Math.sqrt(Math.pow(particle.pos.x - targetX, 2) + Math.pow(particle.pos.y - targetY, 2));

      if (dist < 3.5) {
          const force = (3.5 - dist) * 0.02;
          particle.pos.x += (targetX - particle.pos.x) * force;
          particle.pos.y += (targetY - particle.pos.y) * force;
      }

      const originDist = particle.pos.distanceTo(new THREE.Vector3(0,0,0));
      if (originDist > 6 || originDist < 2) {
         particle.pos.lerp(particle.originalPos, 0.01);
      }

      dummy.position.copy(particle.pos);
      const breathes = 1 + Math.sin(time * 2 + i) * 0.3;
      dummy.scale.setScalar(particle.size * breathes);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.8} toneMapped={false} />
    </instancedMesh>
  );
}

export function CinematicLighting() {
    return (
        <>
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#4444ff" />
            <pointLight position={[-10, -10, -10]} intensity={1} color="#ff44aa" />
        </>
    )
}
