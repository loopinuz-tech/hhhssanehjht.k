import React from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './Scene';

export default function GameCanvas() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-sky-200">
      <Canvas
        shadows
        dpr={[1, 1.5]} // Mobile GPU optimization
        camera={{ position: [0, 4.2, 8.5], fov: 65 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        className="w-full h-full absolute inset-0 block"
      >
        <Scene />
      </Canvas>
    </div>
  );
}
