import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: number;
  life: number;
  maxLife: number;
  color: THREE.Color;
}

export default function Particles() {
  const particleBursts = useGameStore(s => s.particleBursts);
  const activeParticlesRef = useRef<Particle[]>([]);
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const maxCapacity = 300;

  // Watch for new particle burst events from store
  const lastProcessedIdRef = useRef<number>(0);

  useFrame((_, delta) => {
    // Process new particle burst triggers
    particleBursts.forEach(evt => {
      if (evt.id > lastProcessedIdRef.current) {
        lastProcessedIdRef.current = evt.id;
        const burstColor = new THREE.Color(evt.color || '#10b981');

        // Spawn 45 dynamic particles per explosion
        for (let i = 0; i < 45; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const speed = 6.0 + Math.random() * 10.0;

          const vx = Math.sin(phi) * Math.cos(theta) * speed;
          const vy = Math.cos(phi) * speed + 3.0; // Upward burst bias
          const vz = Math.sin(phi) * Math.sin(theta) * speed;

          activeParticlesRef.current.push({
            position: new THREE.Vector3(evt.x, evt.y, evt.z),
            velocity: new THREE.Vector3(vx, vy, vz),
            size: 0.12 + Math.random() * 0.18,
            life: 0,
            maxLife: 0.5 + Math.random() * 0.4,
            color: burstColor
          });
        }
      }
    });

    // Trim array if exceeds capacity
    if (activeParticlesRef.current.length > maxCapacity) {
      activeParticlesRef.current = activeParticlesRef.current.slice(-maxCapacity);
    }

    const instancedMesh = meshRef.current;
    if (!instancedMesh) return;

    let activeCount = 0;
    const remaining: Particle[] = [];

    activeParticlesRef.current.forEach(p => {
      p.life += delta;
      if (p.life < p.maxLife) {
        // Physics update: gravity + velocity
        p.velocity.y -= delta * 18.0; // Gravity
        p.position.addScaledVector(p.velocity, delta);

        const progress = p.life / p.maxLife;
        const scale = p.size * (1 - progress);

        dummy.position.copy(p.position);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();

        instancedMesh.setMatrixAt(activeCount, dummy.matrix);
        instancedMesh.setColorAt(activeCount, p.color);
        activeCount++;
        remaining.push(p);
      }
    });

    // Hide extra instances
    for (let i = activeCount; i < maxCapacity; i++) {
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    activeParticlesRef.current = remaining;
    instancedMesh.count = maxCapacity;
    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, maxCapacity]}
    >
      <boxGeometry args={[0.3, 0.3, 0.3]} />
      <meshStandardMaterial
        roughness={0.2}
        metalness={0.8}
        emissive="#ffffff"
        emissiveIntensity={0.6}
      />
    </instancedMesh>
  );
}
