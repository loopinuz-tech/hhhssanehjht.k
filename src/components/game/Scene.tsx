import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import CameraRig from './CameraRig';
import Road from './Road';
import Gate from './Gate';
import Player from './Player';
import Coins from './Coins';
import Obstacles from './Obstacles';
import Particles from './Particles';

export default function Scene() {
  const timeOfDayMode = useGameStore(s => s.timeOfDayMode);
  const isFocusMode = useGameStore(s => s.isFocusMode);

  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambLightRef = useRef<THREE.AmbientLight | null>(null);

  const skyColorRef = useRef(new THREE.Color('#bae6fd'));
  const fogColorRef = useRef(new THREE.Color('#bae6fd'));

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    let skyTargetHex = '#bae6fd'; // Day Sky
    let fogTargetHex = '#bae6fd';
    let sunIntensity = 1.65;
    let ambIntensity = 0.58;
    let sunColorHex = '#ffffff';

    if (isFocusMode) {
      skyTargetHex = '#ffffff';
      fogTargetHex = '#ffffff';
      sunIntensity = 1.65;
      ambIntensity = 0.65;
      sunColorHex = '#ffffff';
    } else if (timeOfDayMode === 'night') {
      skyTargetHex = '#020617'; // Deep Midnight
      fogTargetHex = '#0f172a';
      sunIntensity = 0.45;
      ambIntensity = 0.22;
      sunColorHex = '#38bdf8'; // Moonlight Cyan
    } else if (timeOfDayMode === 'sunset') {
      skyTargetHex = '#4c1d95'; // Vivid Sunset Purple/Pink
      fogTargetHex = '#831843';
      sunIntensity = 1.1;
      ambIntensity = 0.42;
      sunColorHex = '#f97316'; // Sunset Orange
    } else if (timeOfDayMode === 'day') {
      skyTargetHex = '#bae6fd';
      fogTargetHex = '#bae6fd';
      sunIntensity = 1.65;
      ambIntensity = 0.58;
      sunColorHex = '#ffffff';
    } else {
      // Auto smooth cycle (1 full cycle every 90 seconds)
      const phase = (time % 90) / 90; // 0.0 -> 1.0
      if (phase < 0.35) {
        // Day
        skyTargetHex = '#bae6fd';
        fogTargetHex = '#bae6fd';
        sunIntensity = 1.65;
        ambIntensity = 0.58;
      } else if (phase < 0.5) {
        // Sunset
        skyTargetHex = '#4c1d95';
        fogTargetHex = '#831843';
        sunIntensity = 1.1;
        ambIntensity = 0.42;
        sunColorHex = '#f97316';
      } else if (phase < 0.85) {
        // Night
        skyTargetHex = '#020617';
        fogTargetHex = '#0f172a';
        sunIntensity = 0.45;
        ambIntensity = 0.22;
        sunColorHex = '#38bdf8';
      } else {
        // Dawn / Sunrise
        skyTargetHex = '#9f1239';
        fogTargetHex = '#fb7185';
        sunIntensity = 1.2;
        ambIntensity = 0.45;
        sunColorHex = '#facc15';
      }
    }

    // Smooth Lerp Colors & Intensities
    skyColorRef.current.lerp(new THREE.Color(skyTargetHex), 0.05);
    fogColorRef.current.lerp(new THREE.Color(fogTargetHex), 0.05);

    if (state.scene.background instanceof THREE.Color) {
      state.scene.background.copy(skyColorRef.current);
    }
    if (state.scene.fog) {
      state.scene.fog.color.copy(fogColorRef.current);
    }

    if (dirLightRef.current) {
      dirLightRef.current.intensity = THREE.MathUtils.lerp(dirLightRef.current.intensity, sunIntensity, 0.05);
      dirLightRef.current.color.lerp(new THREE.Color(sunColorHex), 0.05);
    }
    if (ambLightRef.current) {
      ambLightRef.current.intensity = THREE.MathUtils.lerp(ambLightRef.current.intensity, ambIntensity, 0.05);
    }
  });

  return (
    <>
      {/* Dynamic Third-Person Chase Camera Rig */}
      <CameraRig />

      {/* Atmospheric Sky Background & Light Exponential Fog */}
      <color attach="background" args={['#bae6fd']} />
      <fogExp2 attach="fog" args={['#bae6fd', 0.0055]} />

      {/* High-Quality Real-Time 3D Sunlight & Directional Shadows */}
      <ambientLight ref={ambLightRef} intensity={0.55} />
      <directionalLight
        ref={dirLightRef}
        position={[35, 55, 25]}
        intensity={1.65}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-bias={-0.0003}
      />

      {/* 3D World Objects */}
      <Road />
      <Coins />
      <Obstacles />
      <Gate />
      <Player />
      <Particles />
    </>
  );
}
