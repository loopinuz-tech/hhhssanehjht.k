import React from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

const LANE_X = [-4.8, 0, 4.8];

export default function CameraRig() {
  useFrame((state, delta) => {
    const currentLane = useGameStore.getState().playerLane;
    const isJumping = useGameStore.getState().isJumping;

    const targetPlayerX = LANE_X[currentLane];
    // Dynamic Third-Person Chase Cam: Camera follows 82% directly behind active lane (-3.93, 0, +3.93)
    const targetCamX = targetPlayerX * 0.82;
    const targetCamY = 4.2 + (isJumping ? 0.9 : 0);

    // Smooth Lerp Chase Interpolation
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetCamX, Math.min(1, delta * 14));
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetCamY, Math.min(1, delta * 8));
    state.camera.position.z = 8.5;

    // Dynamic LookAt down the active target lane horizon
    state.camera.lookAt(targetPlayerX * 0.45, 2.0, -40);
  });

  return null;
}
