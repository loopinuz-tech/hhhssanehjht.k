import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface TreeProps {
  progress: number;
}

function Tree({ progress }: TreeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leavesRef = useRef<THREE.Group>(null);

  const p = Math.max(0, Math.min(100, progress));

  const trunkHeight = useMemo(() => {
    if (p < 20) return 0.05 + (p / 20) * 0.12;
    if (p < 45) return 0.17 + ((p - 20) / 25) * 0.13;
    if (p < 75) return 0.3 + ((p - 45) / 30) * 0.12;
    return 0.42 + ((p - 75) / 25) * 0.08;
  }, [p]);

  const trunkRadius = useMemo(() => {
    if (p < 20) return 0.02 + (p / 20) * 0.015;
    if (p < 45) return 0.035 + ((p - 20) / 25) * 0.02;
    return 0.055 + ((p - 45) / 55) * 0.025;
  }, [p]);

  const leafScale = useMemo(() => {
    if (p < 20) return 0;
    if (p < 45) return ((p - 20) / 25) * 0.6;
    if (p < 75) return 0.6 + ((p - 45) / 30) * 0.4;
    return 1.0 + ((p - 75) / 25) * 0.3;
  }, [p]);

  const leafColor = useMemo(() => {
    if (p < 20) return "#86efac";
    if (p < 45) return "#4ade80";
    if (p < 75) return "#22c55e";
    return "#16a34a";
  }, [p]);

  const hasFlowers = p >= 100;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
    if (leavesRef.current && leafScale > 0) {
      leavesRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          child.position.y += Math.sin(state.clock.elapsedTime * 2 + i) * 0.0003;
        }
      });
    }
  });

  if (p < 5) {
    return (
      <group position={[0, -0.5, 0]}>
        <mesh position={[0, 0.02, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#92400e" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.2, 16]} />
          <meshStandardMaterial color="#78716c" transparent opacity={0.3} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {/* Ground shadow */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.25 + leafScale * 0.35, 24]} />
        <meshStandardMaterial color="#166534" transparent opacity={0.2} />
      </mesh>

      {/* Trunk */}
      <mesh position={[0, trunkHeight / 2, 0]}>
        <cylinderGeometry args={[trunkRadius * 0.65, trunkRadius, trunkHeight, 10]} />
        <meshStandardMaterial color="#92400e" roughness={0.85} />
      </mesh>

      {/* Branches (at higher progress) */}
      {p >= 45 && (
        <>
          <mesh position={[trunkRadius * 1.5, trunkHeight * 0.65, 0]} rotation={[0, 0, Math.PI / 4]}>
            <cylinderGeometry args={[0.008, 0.015, 0.18, 6]} />
            <meshStandardMaterial color="#a16207" roughness={0.8} />
          </mesh>
          <mesh position={[-trunkRadius * 1.2, trunkHeight * 0.55, trunkRadius]} rotation={[Math.PI / 5, 0, -Math.PI / 5]}>
            <cylinderGeometry args={[0.008, 0.012, 0.15, 6]} />
            <meshStandardMaterial color="#a16207" roughness={0.8} />
          </mesh>
        </>
      )}

      {/* Leaves */}
      {leafScale > 0 && (
        <group ref={leavesRef}>
          {/* Main canopy - rich sphere cluster */}
          <mesh position={[0, trunkHeight + 0.14 * leafScale, 0]}>
            <sphereGeometry args={[0.32 * leafScale, 14, 14]} />
            <meshStandardMaterial color={leafColor} roughness={0.65} />
          </mesh>
          <mesh position={[0.14 * leafScale, trunkHeight + 0.22 * leafScale, 0.08 * leafScale]}>
            <sphereGeometry args={[0.24 * leafScale, 12, 12]} />
            <meshStandardMaterial color={leafColor} roughness={0.65} />
          </mesh>
          <mesh position={[-0.14 * leafScale, trunkHeight + 0.18 * leafScale, -0.06 * leafScale]}>
            <sphereGeometry args={[0.25 * leafScale, 12, 12]} />
            <meshStandardMaterial color={leafColor} roughness={0.65} />
          </mesh>
          <mesh position={[0.04 * leafScale, trunkHeight + 0.3 * leafScale, 0.03 * leafScale]}>
            <sphereGeometry args={[0.22 * leafScale, 12, 12]} />
            <meshStandardMaterial color={leafColor} roughness={0.65} />
          </mesh>
          <mesh position={[-0.08 * leafScale, trunkHeight + 0.26 * leafScale, 0.1 * leafScale]}>
            <sphereGeometry args={[0.2 * leafScale, 10, 10]} />
            <meshStandardMaterial color={leafColor} roughness={0.65} />
          </mesh>

          {/* Extra lush canopy at high progress */}
          {p >= 45 && (
            <>
              <mesh position={[0.22 * leafScale, trunkHeight + 0.12 * leafScale, -0.05 * leafScale]}>
                <sphereGeometry args={[0.18 * leafScale, 10, 10]} />
                <meshStandardMaterial color={leafColor} roughness={0.65} />
              </mesh>
              <mesh position={[-0.2 * leafScale, trunkHeight + 0.1 * leafScale, 0.08 * leafScale]}>
                <sphereGeometry args={[0.19 * leafScale, 10, 10]} />
                <meshStandardMaterial color={leafColor} roughness={0.65} />
              </mesh>
            </>
          )}

          {/* Flowers at 100% */}
          {hasFlowers && (
            <>
              <mesh position={[0.18, trunkHeight + 0.28, 0.1]}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshStandardMaterial color="#f472b6" emissive="#f472b6" emissiveIntensity={0.3} />
              </mesh>
              <mesh position={[-0.14, trunkHeight + 0.25, 0.12]}>
                <sphereGeometry args={[0.035, 8, 8]} />
                <meshStandardMaterial color="#fb923c" emissive="#fb923c" emissiveIntensity={0.3} />
              </mesh>
              <mesh position={[0.08, trunkHeight + 0.35, -0.08]}>
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.3} />
              </mesh>
            </>
          )}
        </group>
      )}
    </group>
  );
}

interface ForestTree3DProps {
  progress: number;
  className?: string;
}

export default function ForestTree3D({ progress, className = "" }: ForestTree3DProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0.15, 2.2], fov: 36 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1} color="#fef3c7" />
        <directionalLight position={[-3, 4, -2]} intensity={0.3} color="#86efac" />
        <pointLight position={[0, 2, 2]} intensity={0.4} color="#fde68a" />

        <Tree progress={progress} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 4}
        />
      </Canvas>
    </div>
  );
}
