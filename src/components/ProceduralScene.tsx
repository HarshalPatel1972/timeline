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
  const target = useMemo(() => new THREE.Vector3(), []); // Reuse vector

  const particles = useMemo(() => {
    if (!dna) return [];
    const temp = [];
    const count = dna.geometry.count;

    for (let i = 0; i < count; i++) {
        const p = new THREE.Vector3();
        const r = Math.random();
        
        // --- LAYOUT ENGINE ---
        switch (dna.geometry.layout) {
            case 'grid':
                p.set(
                    (Math.random() - 0.5) * 40,
                    (Math.random() - 0.5) * 40,
                    (Math.random() - 0.5) * 10
                );
                break;
            case 'tunnel':
                const rad = 5 + Math.random() * 2;
                const ang = Math.random() * Math.PI * 2;
                p.set(
                    Math.cos(ang) * rad,
                    Math.sin(ang) * rad,
                    (Math.random() - 0.5) * 60
                );
                break;
            case 'spiral':
                const t = Math.random() * 20;
                p.set(
                    Math.cos(t) * t * 0.5,
                    Math.sin(t) * t * 0.5,
                    (Math.random() - 0.5) * 10
                );
                break;
            case 'cloud':
                p.set(
                    (Math.random() - 0.5) * 15,
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10
                );
                break;
            case 'ring':
                const ra = 8 + Math.random();
                const an = Math.random() * Math.PI * 2;
                 p.set(
                    Math.cos(an) * ra,
                    Math.sin(an) * ra,
                    (Math.random() - 0.5) * 2
                );
                break;
            case 'sphere':
            default:
                 const phi = Math.acos(2 * Math.random() - 1);
                 const theta = Math.random() * Math.PI * 2;
                 const rad2 = 5 + Math.random() * 5;
                 p.set(
                    rad2 * Math.sin(phi) * Math.cos(theta),
                    rad2 * Math.sin(phi) * Math.sin(theta),
                    rad2 * Math.cos(phi)
                 );
                 break;
        }

        temp.push({
            pos: p,
            originalPos: p.clone(),
            offset: Math.random() * 100,
            scale: dna.geometry.scale * (0.5 + Math.random()) * (Math.random() > 0.9 ? 3 : 1), // Occasional large shapes
        });
    }
    return temp;
  }, [dna]);

  useFrame((state) => {
    if (!meshRef.current || !dna) return;
    const time = state.clock.elapsedTime * dna.physics.speed;

    const mx = (mousePosition.x / window.innerWidth) * 2 - 1;
    const my = -(mousePosition.y / window.innerHeight) * 2 + 1;
    target.set(mx * 12, my * 7, 0);

    particles.forEach((p, i) => {
        // --- PHYSICS ENGINE ---
        // Optimization: Mutate p.pos directly
        switch(dna.physics.flowType) {
            case 'sine':
                p.pos.y = p.originalPos.y + Math.sin(time + p.pos.x * 0.5) * 0.5;
                break;
            case 'noise':
                p.pos.x += Math.sin(time * 0.5 + p.offset) * 0.01;
                p.pos.y += Math.cos(time * 0.5 + p.offset) * 0.01;
                // Soft tether
                // if (p.pos.distanceTo(p.originalPos) > 2) p.pos.lerp(p.originalPos, 0.05);
                break;
            case 'vortex':
                const angle = time + p.offset * 0.1;
                // Rotate around Z
                const x = p.originalPos.x;
                const y = p.originalPos.y;
                p.pos.x = x * Math.cos(time) - y * Math.sin(time);
                p.pos.y = x * Math.sin(time) + y * Math.cos(time);
                break;
            case 'explosion':
                // Just drift outward
                const distCenter = p.pos.length();
                if (distCenter < 30) {
                     p.pos.multiplyScalar(1.002);
                } else {
                     p.pos.copy(p.originalPos); // Reset
                }
                break;
        }

        // Attraction logic (Universally requested)
        const dist = p.pos.distanceTo(target);
        if (dist < 5) {
            // Swarm behavior
            p.pos.lerp(target, 0.05);
        } else {
            // Return logic
            if (dna.physics.flowType !== 'explosion' && dna.physics.flowType !== 'vortex') {
                p.pos.lerp(p.originalPos, 0.02);
            }
        }

        dummy.position.copy(p.pos);
        
        // Gentle rotation for every piece
        dummy.rotation.set(time * 0.5 + p.offset, time * 0.3, 0);
        
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
        {dna.geometry.shape === 'sphere' && <sphereGeometry args={[0.5, 12, 12]} />}
        {dna.geometry.shape === 'box' && <boxGeometry args={[0.8, 0.8, 0.8]} />}
        {dna.geometry.shape === 'tetrahedon' && <tetrahedronGeometry args={[0.8]} />}
        {dna.geometry.shape === 'torus' && <torusGeometry args={[0.6, 0.2, 12, 24]} />}
        {dna.geometry.shape === 'cone' && <coneGeometry args={[0.5, 1, 6]} />}
        
        <meshStandardMaterial 
            color={dna.colors.foreground}
            emissive={dna.colors.glow}
            emissiveIntensity={0.5}
            roughness={dna.geometry.roughness}
            metalness={dna.geometry.metalness}
            wireframe={dna.geometry.wireframe}
            toneMapped={false}
        />
      </instancedMesh>

      <EffectComposer>
        <Bloom 
            luminanceThreshold={0.2} 
            intensity={dna.postProcessing.bloomIntensity} 
            radius={0.5} 
        />
        <Noise opacity={dna.postProcessing.noiseOpacity} />
        <Vignette darkness={dna.postProcessing.vignetteDarkness} />
        {dna.postProcessing.pixelate ? <Pixelation granularity={5} /> : null}
        {dna.postProcessing.glitch ? <Glitch delay={[2, 6] as any} duration={[0.1, 0.4] as any} strength={[0.1, 0.2] as any} /> : null}
      </EffectComposer>
    </>
  );
}
