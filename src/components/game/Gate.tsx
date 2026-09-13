import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

const LANE_X = [-4.8, 0, 4.8];

export default function Gate() {
  const currentWord = useGameStore(s => s.currentWord);
  const gates = useGameStore(s => s.gates);
  const speed = useGameStore(s => s.speed);
  const speedMultiplier = useGameStore(s => s.speedMultiplier);
  const status = useGameStore(s => s.status);
  const playerLane = useGameStore(s => s.playerLane);
  const selectedLane = useGameStore(s => s.selectedLane);
  const feedbackState = useGameStore(s => s.feedbackState);
  const evaluateCollision = useGameStore(s => s.evaluateCollision);
  const setGateZ = useGameStore(s => s.setGateZ);

  const gateGroupRef = useRef<THREE.Group | null>(null);
  const isFirstGateRef = useRef(true);
  const zPosRef = useRef(-50);

  // Reset 3D Gate Z position when a new word / question loads
  useEffect(() => {
    if (isFirstGateRef.current) {
      zPosRef.current = -50;
      isFirstGateRef.current = false;
    } else {
      zPosRef.current = -95;
    }

    setGateZ(zPosRef.current);

    if (gateGroupRef.current) {
      gateGroupRef.current.position.z = zPosRef.current;
    }
  }, [currentWord, gates, setGateZ]);

  useFrame((_, delta) => {
    if (status !== 'playing') return;

    // Advance 3D Gate continuously down the track towards player line (Z = 0)
    const moveDist = speed * speedMultiplier * delta;
    zPosRef.current += moveDist;

    setGateZ(zPosRef.current);

    if (gateGroupRef.current) {
      gateGroupRef.current.position.z = zPosRef.current;
    }

    // Evaluate collision ONLY when 3D Gate reaches player position (Z >= -0.8)
    if (zPosRef.current >= -0.8 && feedbackState === null) {
      evaluateCollision(playerLane);
    }
  });

  return (
    <group ref={gateGroupRef} position={[0, 0, -50]}>
      {/* 3D Overhead Arch Beam */}
      <mesh position={[0, 6.6, 0]} castShadow>
        <boxGeometry args={[15.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#312e81" roughness={0.3} metalness={0.6} />
      </mesh>

      {/* 4 Vertical Gate Frame Pillars */}
      {[-7.5, -2.5, 2.5, 7.5].map((x, idx) => (
        <mesh key={idx} position={[x, 3.3, 0]} castShadow>
          <boxGeometry args={[0.5, 6.6, 0.5]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.4} metalness={0.7} />
        </mesh>
      ))}

      {/* 3 Lane Gate Barriers */}
      {gates.map((gate) => {
        const laneX = LANE_X[gate.lane];
        const letter = String.fromCharCode(65 + gate.lane); // A, B, C
        const isPlayerLane = playerLane === gate.lane;
        const isSelected = selectedLane === gate.lane;

        if (gate.isClosedWall) {
          // Closed Wall Red Barrier (Full Height Wall)
          return (
            <group key={gate.id} position={[laneX, 3.1, 0]}>
              <mesh castShadow>
                <boxGeometry args={[4.6, 6.2, 0.4]} />
                <meshStandardMaterial color="#991b1b" roughness={0.3} />
              </mesh>
              <Html
                center
                distanceFactor={16}
                position={[0, 0.2, 0.24]}
                pointerEvents="none"
                style={{ pointerEvents: 'none' }}
              >
                <div className="w-64 p-4 rounded-3xl border-4 border-rose-800 bg-rose-700 text-white font-black text-center shadow-2xl">
                  <span className="text-base uppercase tracking-widest block">🚫 YO'L YOPILGAN</span>
                  <span className="text-xs opacity-90 block mt-1">Darvozaga yuguring!</span>
                </div>
              </Html>
            </group>
          );
        }

        // Neutral color when approaching (no hint!)
        let frameColor = '#f8fafc'; // Clean white/light-gray metal
        let borderColor = 'border-slate-300';
        let bgColor = 'bg-white/95';
        let textColor = 'text-slate-900';

        if (feedbackState !== null) {
          if (gate.isCorrect) {
            frameColor = '#10b981';
            borderColor = 'border-emerald-400';
            bgColor = 'bg-emerald-500';
            textColor = 'text-white';
          } else if (isSelected) {
            frameColor = '#f43f5e';
            borderColor = 'border-rose-400';
            bgColor = 'bg-rose-500';
            textColor = 'text-white';
          } else {
            frameColor = '#94a3b8';
            borderColor = 'border-slate-300';
            bgColor = 'bg-slate-200';
            textColor = 'text-slate-500';
          }
        } else if (isPlayerLane) {
          frameColor = '#e2e8f0';
          borderColor = 'border-indigo-500';
          bgColor = 'bg-indigo-600';
          textColor = 'text-white';
        }

        return (
          <group key={gate.id} position={[laneX, 3.1, 0]}>
            {/* 3D Barrier Panel Mesh */}
            <mesh castShadow>
              <boxGeometry args={[4.6, 6.2, 0.35]} />
              <meshStandardMaterial color={frameColor} roughness={0.25} metalness={0.2} />
            </mesh>

            {/* Crisp, Large HTML Billboard Label */}
            <Html
              center
              distanceFactor={16}
              position={[0, 0.2, 0.22]}
              pointerEvents="none"
              style={{ pointerEvents: 'none' }}
            >
              <div
                className={`w-72 sm:w-80 p-4 rounded-3xl border-4 ${borderColor} ${bgColor} ${textColor} text-center shadow-2xl flex flex-col items-center justify-center transition-all select-none`}
              >
                <span className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">
                  GATE {letter} ({gate.lane + 1})
                </span>
                <span className="text-lg sm:text-xl font-black line-clamp-2 leading-tight px-1 tracking-wide">
                  {gate.text}
                </span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
