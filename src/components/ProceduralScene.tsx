'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperienceStore } from '@/store/experience';
import { EffectComposer, Bloom, Vignette, Noise, Pixelation, Glitch } from '@react-three/postprocessing';

export function ProceduralScene() {
  const { dna, mousePosition } = useExperienceStore();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    if (!dna) return [];
    const temp = [];
    const count = dna.geometry.count;

    for (let i = 0; i < count; i++) {
        const r = 5 + Math.random() * 5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        temp.push({
            pos: new THREE.Vector3(x, y, z),
            originalPos: new THREE.Vector3(x, y, z),
            offset: Math.random() * 100,
            scale: dna.geometry.scale * (0.5 + Math.random()),
        });
    }
    return temp;
  }, [dna]);

  useFrame((state) => {
    if (!meshRef.current || !dna) return;
    const time = state.clock.elapsedTime * dna.physics.speed;

    const mx = (mousePosition.x / window.innerWidth) * 2 - 1;
    const my = -(mousePosition.y / window.innerHeight) * 2 + 1;
    const target = new THREE.Vector3(mx * 10, my * 5, 0);

    particles.forEach((p, i) => {
        switch(dna.physics.flowType) {
            case 'sine':
                p.pos.y += Math.sin(time + p.pos.x) * 0.01;
                break;
            case 'noise':
                p.pos.x += Math.sin(time + p.offset) * 0.02;
                p.pos.y += Math.cos(time + p.offset) * 0.02;
                break;
            case 'vortex':
                const angle = time * 0.5 + p.offset;
                p.pos.x = Math.cos(angle) * 5;
                p.pos.z = Math.sin(angle) * 5;
                break;
            case 'explosion':
                const dir = p.pos.clone().normalize();
                p.pos.add(dir.multiplyScalar(0.01));
                if (p.pos.length() > 20) p.pos.copy(p.originalPos);
                break;
        }

        const dist = p.pos.distanceTo(target);
        if (dist < 4) {
            p.pos.lerp(target, 0.05);
        } else {
             if (dna.physics.flowType !== 'explosion') {
                 p.pos.lerp(p.originalPos, 0.01);
             }
        }

        dummy.position.copy(p.pos);
        dummy.rotation.set(time, time * 0.5, 0);
        dummy.scale.setScalar(p.scale);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!dna) return null;

  return (
    <>
      <color attach="background" args={[dna.colors.background]} />
      
      <ambientLight intensity={0.5} color={dna.colors.accent} />
      <pointLight position={[10, 10, 10]} intensity={2} color={dna.colors.glow} />
      <pointLight position={[-10, -10, -5]} intensity={1} color={dna.colors.foreground} />

      <instancedMesh ref={meshRef} args={[undefined, undefined, dna.geometry.count]}>
        {dna.geometry.type === 'sphere' && <sphereGeometry args={[1, 16, 16]} />}
        {dna.geometry.type === 'box' && <boxGeometry args={[1, 1, 1]} />}
        {dna.geometry.type === 'tetrahedon' && <tetrahedronGeometry args={[1]} />}
        {dna.geometry.type === 'torus' && <torusGeometry args={[0.7, 0.3, 16, 32]} />}
        {dna.geometry.type === 'shards' && <coneGeometry args={[0.5, 1, 3]} />} 
        {/* Fallback to sphere if unhandled type or particles */}
        {(dna.geometry.type === 'particles' || !['sphere','box','tetrahedon','torus','shards'].includes(dna.geometry.type)) && <sphereGeometry args={[0.5, 8, 8]} />}

        <meshStandardMaterial 
            color={dna.colors.foreground}
            emissive={dna.colors.glow}
            emissiveIntensity={0.5}
            roughness={dna.geometry.roughness}
            metalness={dna.geometry.metalness}
            wireframe={dna.geometry.wireframe}
        />
      </instancedMesh>

      <EffectComposer disableNormalPass>
        <Bloom 
            luminanceThreshold={0.2} 
            intensity={dna.postProcessing.bloomIntensity} 
            radius={0.5} 
        />
        <Noise opacity={dna.postProcessing.noiseOpacity} />
        <Vignette darkness={dna.postProcessing.vignetteDarkness} />
        {dna.postProcessing.pixelate ? <Pixelation granularity={10} /> : null}
        {dna.postProcessing.glitch ? <Glitch delay={[1, 3] as any} duration={[0.1, 0.3] as any} /> : null}
      </EffectComposer>
    </>
  );
}
