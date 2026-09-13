import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

const LANE_X = [-4.8, 0, 4.8];
const COIN_COUNT = 25;

export default function Coins() {
  const speed = useGameStore(s => s.speed);
  const speedMultiplier = useGameStore(s => s.speedMultiplier);
  const status = useGameStore(s => s.status);
  const playerLane = useGameStore(s => s.playerLane);
  const isJumping = useGameStore(s => s.isJumping);
  const updateDistanceAndCoins = useGameStore(s => s.updateDistanceAndCoins);

  const isMagnetActive = useGameStore(s => s.isMagnetActive);
  const updateMagnetTimer = useGameStore(s => s.updateMagnetTimer);

  // Store 3D coin positions in a mutable ref
  const coinsDataRef = useRef(
    [...Array(COIN_COUNT)].map((_, i) => ({
      lane: i % 3,
      z: -10 - i * 10,
      baseY: 1.1,
      isArc: false,
      collected: false
    }))
  );

  const meshesRef = useRef<(THREE.Group | null)[]>([]);

  useFrame((_, delta) => {
    if (status !== 'playing') return;

    if (isMagnetActive) {
      updateMagnetTimer(delta);
    }

    const moveDist = speed * speedMultiplier * delta;
    const activeHurdles = useGameStore.getState().activeHurdles;

    coinsDataRef.current.forEach((coin, idx) => {
      const grp = meshesRef.current[idx];
      if (!grp) return;

      // Move coin forward along +Z towards player
      coin.z += moveDist;

      // Check if this coin is positioned near a live hurdle to form a high parabolic arc!
      const matchingHurdle = activeHurdles.find(
        h => h.lane === coin.lane && Math.abs(coin.z - h.z) < 6.5
      );

      if (matchingHurdle && matchingHurdle.hasArc) {
        // Form parabolic arch Y=1.0 -> 2.7 over the hurdle!
        const offsetZ = coin.z - matchingHurdle.z;
        const normZ = (offsetZ + 6.5) / 13.0; // 0.0 to 1.0
        coin.baseY = 1.0 + Math.sin(normZ * Math.PI) * 1.8;
        coin.isArc = true;
      } else {
        coin.baseY = 1.1; // Ground coin
        coin.isArc = false;
      }

      // 🧲 DYNAMIC 3D ELECTRO-MAGNETIC ATTRACTION & ABSORPTION SYSTEM
      if (isMagnetActive && !coin.collected && coin.z > -65 && coin.z < 10) {
        const playerX = LANE_X[playerLane];
        const playerY = isJumping ? 2.6 : 1.4; // Chest / player center height
        const playerZ = 0.0;

        const dx = playerX - grp.position.x;
        const dy = playerY - grp.position.y;
        const dz = playerZ - grp.position.z;
        const dist = Math.hypot(dx, dy, dz);

        // Inverse-Square Magnetic Acceleration Law (Closer coins snap faster!)
        const normDist = Math.max(0.05, dist / 50.0); // 0.05 to 1.0
        const magnetAccel = Math.min(52.0, (1.0 / (normDist * normDist)) * 4.2); 
        const pullFactor = Math.min(1.0, delta * (16.0 + magnetAccel));

        // Spiral Arc Trajectory for juicy magnetic flight path
        const spiralCurve = Math.sin(normDist * Math.PI * 2.5) * (normDist * 2.2);

        grp.position.x += (dx + spiralCurve) * pullFactor;
        grp.position.y += dy * pullFactor + Math.sin(normDist * Math.PI) * delta * 6.0; 
        grp.position.z += dz * pullFactor;

        // Shrink coin scale as it is absorbed into player's chest!
        const absorbScale = Math.max(0.15, Math.min(1.0, normDist * 1.8));
        grp.scale.set(absorbScale, absorbScale, absorbScale);

        // Rapid 3D coin spin in magnetic field
        grp.rotation.y += delta * 16.0;

        // Collection threshold check
        if (dist < 2.2 || grp.position.z >= 0.5) {
          coin.collected = true;
          grp.visible = false;
          grp.scale.set(1, 1, 1);
          updateDistanceAndCoins(0, 1);
        }
      } else {
        grp.position.x = LANE_X[coin.lane];
        grp.position.z = coin.z;
        grp.position.y = coin.baseY;
        grp.scale.set(1, 1, 1);
        grp.rotation.y += delta * 4.2; // Normal 3D gold spin
      }

      // Standard collision check with player line when magnet is not active
      const zClose = Math.abs(coin.z) < 1.4;
      const laneMatch = playerLane === coin.lane;
      const jumpMatch = !coin.isArc || (coin.isArc && isJumping);

      if (!isMagnetActive && !coin.collected && zClose && laneMatch && jumpMatch) {
        coin.collected = true;
        grp.visible = false;
        updateDistanceAndCoins(0, 1); // Award +1 coin
      }

      // Recycle coin to horizon when passed (+Z > 15)
      if (coin.z > 15) {
        coin.z = -170 - Math.random() * 30;
        coin.collected = false;
        grp.visible = true;
      }
    });
  });

  return (
    <group>
      {[...Array(COIN_COUNT)].map((_, i) => {
        const initial = coinsDataRef.current[i];
        return (
          <group
            key={i}
            ref={el => { meshesRef.current[i] = el; }}
            position={[LANE_X[initial.lane], initial.baseY, initial.z]}
          >
            {/* Bright 24K Golden 3D Coin Outer Cylinder */}
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.48, 0.48, 0.12, 28]} />
              <meshStandardMaterial
                color="#facc15"
                metalness={0.92}
                roughness={0.15}
                emissive="#eab308"
                emissiveIntensity={0.35}
              />
            </mesh>

            {/* Inner Golden Core Disc */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.36, 0.36, 0.14, 28]} />
              <meshStandardMaterial
                color="#fde047"
                metalness={0.88}
                roughness={0.2}
              />
            </mesh>

            {/* Front $ Dollar Sign Label */}
            <Text
              position={[0, 0, 0.08]}
              fontSize={0.46}
              color="#854d0e"
              anchorX="center"
              anchorY="middle"
            >
              $
            </Text>

            {/* Back $ Dollar Sign Label */}
            <Text
              position={[0, 0, -0.08]}
              rotation={[0, Math.PI, 0]}
              fontSize={0.46}
              color="#854d0e"
              anchorX="center"
              anchorY="middle"
            >
              $
            </Text>
          </group>
        );
      })}
    </group>
  );
}
