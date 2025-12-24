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
  
  // Optimization: Pre-allocate reusable variable to avoid GC
  const tempPos = useMemo(() => new THREE.Vector3(), []);
  const tempTarget = useMemo(() => new THREE.Vector3(), []);

  const particles = useMemo(() => {
    if (!dna) return [];
    const temp = [];
    const count = dna.geometry.count;

    for (let i = 0; i < count; i++) {
        const p = new THREE.Vector3();
        
        switch (dna.geometry.layout) {
            case 'grid':
                p.set((Math.random()-0.5)*40, (Math.random()-0.5)*40, (Math.random()-0.5)*10); break;
            case 'tunnel':
                const rad = 5 + Math.random()*2;
                const ang = Math.random() * Math.PI * 2;
                p.set(Math.cos(ang)*rad, Math.sin(ang)*rad, (Math.random()-0.5)*60); break;
            case 'spiral':
                const t = Math.random() * 20;
                p.set(Math.cos(t)*t*0.5, Math.sin(t)*t*0.5, (Math.random()-0.5)*10); break;
            case 'cloud':
                p.set((Math.random()-0.5)*15, (Math.random()-0.5)*10, (Math.random()-0.5)*10); break;
            case 'ring':
                const ra = 8 + Math.random();
                const an = Math.random() * Math.PI * 2;
                p.set(Math.cos(an)*ra, Math.sin(an)*ra, (Math.random()-0.5)*2); break;
            case 'sphere':
            default:
                 const phi = Math.acos(2 * Math.random() - 1);
                 const theta = Math.random() * Math.PI * 2;
                 const rad2 = 5 + Math.random() * 5;
                 p.set(rad2*Math.sin(phi)*Math.cos(theta), rad2*Math.sin(phi)*Math.sin(theta), rad2*Math.cos(phi)); break;
        }

        temp.push({
            pos: p,
            // Store original coordinates as simple numbers to avoid .clone() overhead
            ox: p.x, oy: p.y, oz: p.z,
            offset: Math.random() * 100,
            scale: dna.geometry.scale * (0.5 + Math.random()),
            // Pre-calculate random speeds to avoid Math.random() in loop
            speed: 0.005 + Math.random() * 0.01 
        });
    }
    return temp;
  }, [dna]);

  useFrame((state) => {
    if (!meshRef.current || !dna) return;
    const time = state.clock.elapsedTime * dna.physics.speed;

    // Mouse calc outside loop
    const mx = (mousePosition.x / window.innerWidth) * 2 - 1;
    const my = -(mousePosition.y / window.innerHeight) * 2 + 1;
    tempTarget.set(mx * 12, my * 7, 0);

    const count = particles.length;
    // Manual loop is faster than forEach
    for(let i = 0; i < count; i++) {
        const p = particles[i];
        
        // --- OPTIMIZED PHYSICS ENGINE ---
        // Direct property mutation, minimal object creation
        
        if (dna.physics.flowType === 'explosion') {
             // Explosion Logic Optimized: 
             // Just add a fraction of position to itself (expand outwards)
             // No trig functions needed here.
             p.pos.x += p.pos.x * 0.01;
             p.pos.y += p.pos.y * 0.01;
             p.pos.z += p.pos.z * 0.01; // 3D expansion

             // Quick magnitude check (x*x + y*y + z*z) avoids sqrt
             const magSq = p.pos.x*p.pos.x + p.pos.y*p.pos.y + p.pos.z*p.pos.z;
             if (magSq > 900) { // 30^2 = 900 limit
                 p.pos.set(p.ox, p.oy, p.oz); // Reset
             }

        } else if (dna.physics.flowType === 'sine') {
             p.pos.y = p.oy + Math.sin(time + p.pos.x * 0.5) * 0.5;
        } else if (dna.physics.flowType === 'vortex') {
             const angle = time + p.offset * 0.1;
             p.pos.x = p.ox * Math.cos(time) - p.oy * Math.sin(time);
             p.pos.y = p.ox * Math.sin(time) + p.oy * Math.cos(time);
        } else { // Noise/Standard
             p.pos.x += Math.sin(time * 0.5 + p.offset) * 0.01;
             p.pos.y += Math.cos(time * 0.5 + p.offset) * 0.01;
        }

        // Attraction Logic (Simple linear interpolation)
        // Only if mouse is active/on screen
        if (mx !== -1 || my !== 1) {
            const dx = tempTarget.x - p.pos.x;
            const dy = tempTarget.y - p.pos.y;
            const dz = tempTarget.z - p.pos.z;
            const distSq = dx*dx + dy*dy + dz*dz;
            
            if (distSq < 25) { // < 5 distance
                p.pos.x += dx * 0.05;
                p.pos.y += dy * 0.05;
                p.pos.z += dz * 0.05;
            } else if (dna.physics.flowType !== 'explosion' && dna.physics.flowType !== 'vortex') {
                // Return home logic
                p.pos.x += (p.ox - p.pos.x) * 0.02;
                p.pos.y += (p.oy - p.pos.y) * 0.02;
                p.pos.z += (p.oz - p.pos.z) * 0.02;
            }
        }

        dummy.position.copy(p.pos);
        dummy.rotation.set(time * 0.5 + p.offset, time * 0.3, 0);
        dummy.scale.setScalar(p.scale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
    }
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
        {dna.geometry.shape === 'sphere' && <sphereGeometry args={[0.5, 8, 8]} />} {/* Lower Poly */}
        {dna.geometry.shape === 'box' && <boxGeometry args={[0.6, 0.6, 0.6]} />}
        {dna.geometry.shape === 'tetrahedon' && <tetrahedronGeometry args={[0.7]} />}
        {dna.geometry.shape === 'torus' && <torusGeometry args={[0.5, 0.2, 8, 16]} />}
        {dna.geometry.shape === 'cone' && <coneGeometry args={[0.4, 0.8, 5]} />} 
        
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
