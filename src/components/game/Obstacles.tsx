import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

const LANE_X = [-4.8, 0, 4.8];
const OBS_COUNT = 5;

export default function Obstacles() {
  const speed = useGameStore(s => s.speed);
  const speedMultiplier = useGameStore(s => s.speedMultiplier);
  const status = useGameStore(s => s.status);
  const playerLane = useGameStore(s => s.playerLane);
  const isJumping = useGameStore(s => s.isJumping);
  const takeObstacleDamage = useGameStore(s => s.takeObstacleDamage);
  const setActiveHurdles = useGameStore(s => s.setActiveHurdles);

  // Store 3D hurdle positions in a mutable ref
  const obsDataRef = useRef(
    [...Array(OBS_COUNT)].map((_, i) => ({
      lane: (i * 2) % 3,
      z: -35 - i * 40,
      hasArc: i % 2 === 0, // Alternate hurdles have mid-air coin arcs
      hit: false
    }))
  );

  const groupsRef = useRef<(THREE.Group | null)[]>([]);

  useFrame((_, delta) => {
    if (status !== 'playing') return;

    const moveDist = speed * speedMultiplier * delta;
    const gateZ = useGameStore.getState().gateZ; // Read current Z coordinate of translation gate

    const updatedHurdles: Array<{ lane: number; z: number; hasArc: boolean }> = [];

    obsDataRef.current.forEach((obs, idx) => {
      const grp = groupsRef.current[idx];
      if (!grp) return;

      obs.z += moveDist;

      // STRICT 0% OVERLAP GUARANTEE:
      // If hurdle falls inside 22-meter Gate exclusion zone, HIDE HURDLE COMPLETELY!
      const distToGate = Math.abs(obs.z - gateZ);
      if (distToGate < 22) {
        grp.visible = false;
      } else {
        grp.visible = true;
        updatedHurdles.push({ lane: obs.lane, z: obs.z, hasArc: obs.hasArc });
      }

      grp.position.z = obs.z;

      // Check collision with hurdle (only if visible and player is NOT jumping)
      if (grp.visible && !obs.hit && Math.abs(obs.z) < 1.0 && playerLane === obs.lane) {
        if (!isJumping) {
          obs.hit = true;
          takeObstacleDamage(); // DEDUCTS 1 LIFE IMMEDIATELY!
        }
      }

      // Recycle hurdle to horizon when passed (+Z > 15)
      if (obs.z > 15) {
        obs.z = -180 - Math.random() * 40;
        obs.hit = false;
      }
    });

    // Broadcast visible hurdle positions for 100% aligned coin arcs
    setActiveHurdles(updatedHurdles);
  });

  return (
    <group>
      {[...Array(OBS_COUNT)].map((_, i) => {
        const initial = obsDataRef.current[i];
        return (
          <group
            key={i}
            ref={el => { groupsRef.current[i] = el; }}
            position={[LANE_X[initial.lane], 0.5, initial.z]}
          >
            {/* Low Hurdle Barrier Beam */}
            <mesh position={[0, 0.4, 0]} castShadow>
              <boxGeometry args={[4.2, 0.35, 0.4]} />
              <meshStandardMaterial color="#f59e0b" roughness={0.4} />
            </mesh>

            {/* Left & Right Hurdle Legs */}
            <mesh position={[-1.9, 0.2, 0]} castShadow>
              <boxGeometry args={[0.3, 0.4, 0.4]} />
              <meshStandardMaterial color="#475569" />
            </mesh>

            <mesh position={[1.9, 0.2, 0]} castShadow>
              <boxGeometry args={[0.3, 0.4, 0.4]} />
              <meshStandardMaterial color="#475569" />
            </mesh>

            {/* Red Warning Stripe */}
            <mesh position={[0, 0.41, 0.21]}>
              <planeGeometry args={[4.0, 0.25]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
