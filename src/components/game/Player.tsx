import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

const LANE_X = [-4.8, 0, 4.8];

export default function Player() {
  const isJumping = useGameStore(s => s.isJumping);
  const isStumbling = useGameStore(s => s.isStumbling);
  const status = useGameStore(s => s.status);
  const shieldCount = useGameStore(s => s.shieldCount);
  const isMagnetActive = useGameStore(s => s.isMagnetActive);

  const groupRef = useRef<THREE.Group | null>(null);
  const logoMeshRef = useRef<THREE.Mesh | null>(null);
  const jumpProgressRef = useRef(0);

  // Load EduContest logo texture
  const logoTexture = useTexture('/logo.png');

  // Global keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const gameStatus = useGameStore.getState().status;
      if (gameStatus !== 'playing') return;

      const code = e.code;
      const key = e.key ? e.key.toLowerCase() : '';

      if (code === 'ArrowLeft' || code === 'KeyA' || key === 'arrowleft' || key === 'a') {
        e.preventDefault();
        useGameStore.getState().moveLeft();
      } else if (code === 'ArrowRight' || code === 'KeyD' || key === 'arrowright' || key === 'd') {
        e.preventDefault();
        useGameStore.getState().moveRight();
      } else if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW' || key === ' ' || key === 'arrowup' || key === 'w') {
        e.preventDefault();
        useGameStore.getState().triggerJump();
      } else if (['1', '2', '3'].includes(key) || ['Digit1', 'Digit2', 'Digit3'].includes(code)) {
        const laneNum = parseInt(key || code.replace('Digit', ''), 10) - 1;
        if (laneNum >= 0 && laneNum <= 2) {
          useGameStore.getState().setPlayerLane(laneNum);
        }
      } else if (code === 'KeyF' || code === 'KeyM' || key === 'f' || key === 'm') {
        e.preventDefault();
        useGameStore.getState().activateMagnet();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Read exact playerLane directly from store state for instant 60fps frame response
    const currentLane = useGameStore.getState().playerLane;
    const targetX = LANE_X[currentLane];
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, Math.min(1, delta * 28));

    const time = state.clock.getElapsedTime();

    // 3D Parabolic Jump & Stumble Animations
    if (isJumping) {
      jumpProgressRef.current = Math.min(1, jumpProgressRef.current + delta * 2.5);
      const t = jumpProgressRef.current;
      const parabola = 1 - Math.pow(2 * t - 1, 2);
      groupRef.current.position.y = 1.2 + 3.2 * Math.max(0, parabola);
      groupRef.current.rotation.x = -0.2 * Math.sin(t * Math.PI);
      groupRef.current.rotation.z = 0;
    } else if (isStumbling) {
      jumpProgressRef.current = 0;
      groupRef.current.position.y = 1.2;
      groupRef.current.rotation.x = 0.4 * Math.sin(time * 25);
      groupRef.current.rotation.z = 0.25 * Math.cos(time * 25);
    } else {
      jumpProgressRef.current = 0;
      groupRef.current.rotation.x = 0;

      if (status === 'playing') {
        groupRef.current.position.y = 1.2 + Math.abs(Math.sin(time * 14)) * 0.18;
        groupRef.current.rotation.z = Math.sin(time * 7) * 0.05;

        if (logoMeshRef.current) {
          logoMeshRef.current.rotation.y = Math.sin(time * 3) * 0.12;
        }
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 1.2, 0]}>

      {/* ── OFFICIAL EDUCONTEST LOGO AVATAR (CLEAN, NO BLUE CYLINDER CLIPPING) ── */}
      <group>
        {/* Subtle Backdrop Glow Disc placed behind logo */}
        <mesh position={[0, 0, -0.06]}>
          <circleGeometry args={[1.25, 32]} />
          <meshBasicMaterial color="#0f172a" transparent opacity={0.35} />
        </mesh>

        {/* Front Crisp Logo Mesh */}
        <mesh ref={logoMeshRef} position={[0, 0, 0]}>
          <planeGeometry args={[2.4, 2.4]} />
          <meshBasicMaterial map={logoTexture} transparent side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ── ACTIVE SHIELD GLOW RING ── */}
      {shieldCount > 0 && (
        <mesh position={[0, -1.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.3, 1.6, 32]} />
          <meshBasicMaterial color="#3b82f6" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* ── ACTIVE MAGNET ELECTRO-AURA ── */}
      {isMagnetActive && (
        <group position={[0, -1.0, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.6, 2.0, 32]} />
            <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={3.0} transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.0, 2.3, 32]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={2.5} transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* ── DYNAMIC GROUND SHADOW ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]}>
        <planeGeometry args={[1.6, 1.6]} />
        <meshBasicMaterial color="#020617" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}
