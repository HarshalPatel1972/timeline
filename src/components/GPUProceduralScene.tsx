'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperienceStore } from '@/store/experience';

// ZERO LAG SHADER
// Moves all physics calculation to the GPU.
const vertexShader = `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uDistortion;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uSize;
  
  attribute float aScale;
  attribute float aRandom;
  attribute vec3 aVelocity;
  
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float time = uTime * uSpeed;
    vec3 pos = position;
    
    // --- PHYSICS ON GPU ---
    // 1. Noise Flow
    pos.x += sin(time * 0.5 + pos.z * 0.2 + aRandom * 10.0) * uDistortion;
    pos.y += cos(time * 0.3 + pos.x * 0.2 + aRandom * 10.0) * uDistortion;
    
    // 2. Pulse
    float pulse = 1.0 + sin(time * 2.0 + aRandom * 6.0) * 0.2;
    
    // 3. Movement (Explosion/Drift) based on velocity attribute
    // pos += aVelocity * sin(time); // Simple drift

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation (closer items are bigger)
    gl_PointSize = uSize * aScale * pulse * (100.0 / -mvPosition.z);
    
    // Color mixing based on depth/random
    float mixFactor = (sin(time + aRandom) + 1.0) / 2.0;
    vColor = mix(uColor1, uColor2, mixFactor);
    
    // Fade distant particles
    float dist = length(pos);
    vAlpha = 1.0 - smoothstep(10.0, 40.0, dist);
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    // Round particle shape with soft edge
    vec2 xy = gl_PointCoord.xy - vec2(0.5);
    float ll = length(xy);
    if(ll > 0.5) discard;
    
    // Glow effect
    float glow = 1.0 - (ll * 2.0);
    glow = pow(glow, 1.5); // sharpen
    
    gl_FragColor = vec4(vColor, vAlpha * glow);
  }
`;

export function GPUProceduralScene() {
  const { dna } = useExperienceStore();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Optimization: Pre-calculate counts based on device capability?
  // For now, 2000 is extremely safe for Points (can go to 100k easily)
  const count = 5000;
  
  const [positions, scales, randomness, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sca = new Float32Array(count);
    const rnd = new Float32Array(count);
    const vel = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
        // Init logic similar to previous but static
        const r = 10 + Math.random() * 20;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        
        pos[i*3] = x;
        pos[i*3+1] = y;
        pos[i*3+2] = z;
        
        sca[i] = 0.5 + Math.random();
        rnd[i] = Math.random();
        
        vel[i*3] = (Math.random()-0.5) * 0.1;
        vel[i*3+1] = (Math.random()-0.5) * 0.1;
        vel[i*3+2] = (Math.random()-0.5) * 0.1;
    }
    
    return [pos, sca, rnd, vel];
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
        materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  if (!dna) return null;

  return (
    <>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aScale"
            count={count}
            array={scales}
            itemSize={1}
          />
           <bufferAttribute
            attach="attributes-aRandom"
            count={count}
            array={randomness}
            itemSize={1}
          />
           <bufferAttribute
            attach="attributes-aVelocity"
            count={count}
            array={velocities}
            itemSize={3}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{
            uTime: { value: 0 },
            uSpeed: { value: dna.physics.speed || 1.0 },
            uDistortion: { value: 1.0 }, // Control via DNA
            uColor1: { value: new THREE.Color(dna.colors.foreground) },
            uColor2: { value: new THREE.Color(dna.colors.accent) },
            uSize: { value: 8.0 * (dna.geometry.scale || 1.0) }
          }}
        />
      </points>
      
      {/* We removed Post-Processing for max performance, 
          but we can keep a very cheap bloom given the AdditiveBlending */}
    </>
  );
}
