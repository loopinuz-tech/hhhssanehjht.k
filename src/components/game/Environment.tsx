import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

// Distant Parallax City Skyline Layer
export function CitySkyline() {
  const speed = useGameStore(s => s.speed);
  const speedMultiplier = useGameStore(s => s.speedMultiplier);
  const status = useGameStore(s => s.status);
  const skylineRef = useRef<THREE.Group | null>(null);

  useFrame((_, delta) => {
    if (status !== 'playing' || !skylineRef.current) return;
    const moveDist = speed * speedMultiplier * delta * 0.04;
    skylineRef.current.position.z = (skylineRef.current.position.z + moveDist) % 180;
  });

  return (
    <group ref={skylineRef} position={[0, -2, -310]}>
      {[-140, -95, -50, 50, 95, 140].map((x, idx) => {
        const height = 35 + ((idx * 9) % 25);
        const col = idx % 2 === 0 ? '#38bdf8' : '#818cf8';
        return (
          <group key={idx} position={[x, height / 2, 0]}>
            <mesh>
              <boxGeometry args={[22, height, 22]} />
              <meshStandardMaterial color="#475569" roughness={0.8} />
            </mesh>
            <mesh position={[0, height / 2 + 4, 0]}>
              <coneGeometry args={[0.6, 8, 8]} />
              <meshStandardMaterial color={col} emissive={col} emissiveIntensity={3.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// High-Altitude Flying Passenger Jet Airplane with White Vapor Contrail Trails (Osmondagi Samolyot)
export function SkyAirplane() {
  const planeRef = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    if (!planeRef.current) return;
    const time = state.clock.getElapsedTime();
    // Continuous diagonal flight trajectory across high sky (X: -180 to +180)
    const planeX = ((time * 18) % 360) - 180;
    planeRef.current.position.x = planeX;
    planeRef.current.position.y = 52 + Math.sin(time * 0.5) * 1.5;
    planeRef.current.position.z = -120 + Math.cos(time * 0.3) * 15;
  });

  return (
    <group ref={planeRef} rotation={[0, Math.PI / 6, 0.05]}>
      {/* Fuselage Body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.9, 0.7, 14.0, 14]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.5} />
      </mesh>
      {/* Nose Cone */}
      <mesh position={[7.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.7, 2.2, 14]} />
        <meshStandardMaterial color="#0284c7" />
      </mesh>
      {/* Main Wings */}
      <mesh position={[1.0, 0, 0]}>
        <boxGeometry args={[3.2, 0.2, 16.0]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
      </mesh>
      {/* Tail Fin */}
      <mesh position={[-6.2, 1.8, 0]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[2.5, 3.2, 0.25]} />
        <meshStandardMaterial color="#0284c7" />
      </mesh>
      {/* Turbofan Engines */}
      {[-2.8, 2.8].map((engZ, idx) => (
        <group key={idx} position={[1.5, -0.6, engZ]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.45, 0.45, 2.4, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Red & Green Wingtip Navigation Lights */}
      <mesh position={[1.0, 0.1, 8.05]}>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={5.0} />
      </mesh>
      <mesh position={[1.0, 0.1, -8.05]}>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={5.0} />
      </mesh>

      {/* White Vapor Contrail Trails */}
      {[-2.8, 2.8].map((trailZ, idx) => (
        <mesh key={idx} position={[-25.0, -0.6, trailZ]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.8, 48.0, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
        </mesh>
      ))}
    </group>
  );
}

// Glowing City Street Lamp Post with Real Point Light Projection (Svet/Chiroq)
export function GlowingStreetLamp({ position, alignLeft = true }: { position: [number, number, number]; alignLeft?: boolean }) {
  const armX = alignLeft ? 0.8 : -0.8;
  return (
    <group position={position}>
      {/* Post Pole */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 7]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} />
      </mesh>
      {/* Lamp Arm & Fixture */}
      <mesh position={[armX, 6.8, 0]}>
        <boxGeometry args={[1.4, 0.25, 0.4]} />
        <meshStandardMaterial color="#c8001a" emissive="#c8001a" emissiveIntensity={2.5} />
      </mesh>
      {/* Glowing Light Bulb Sphere */}
      <mesh position={[armX * 1.3, 6.6, 0]}>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={4.5} />
      </mesh>
      {/* Point Light Casting Real-Time Night Glow */}
      <pointLight position={[armX * 1.3, 6.4, 0]} intensity={3.5} distance={14} color="#fde047" />
    </group>
  );
}

// Red Asphalt Bicycle Lane (Velosiped Yo'lagi - Elevated Y=0.07 with polygonOffset to eliminate Z-fighting!)
export function BicycleLane({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Red Bike Lane Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <planeGeometry args={[1.8, 35.0]} />
        <meshStandardMaterial
          color="#dc2626"
          roughness={0.6}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
      {/* White Bicycle Lane Stencil Icons */}
      {[-10, 5].map((iconZ, idx) => (
        <group key={idx} position={[0, 0.085, iconZ]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh position={[-0.35, 0, 0]}>
            <ringGeometry args={[0.18, 0.25, 16]} />
            <meshBasicMaterial color="#ffffff" depthTest={true} />
          </mesh>
          <mesh position={[0.35, 0, 0]}>
            <ringGeometry args={[0.18, 0.25, 16]} />
            <meshBasicMaterial color="#ffffff" depthTest={true} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <planeGeometry args={[0.6, 0.07]} />
            <meshBasicMaterial color="#ffffff" depthTest={true} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Parked 3D Bicycle & Steel Rack (Velosipedlar va Parkovka)
export function BicycleRack({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Steel Arch Racks */}
      {[-0.8, 0, 0.8].map((rackX, idx) => (
        <mesh key={idx} position={[rackX, 0.45, 0]} castShadow>
          <torusGeometry args={[0.4, 0.04, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
      ))}

      {/* Parked 3D Bike */}
      <group position={[0.2, 0, 0]}>
        {[-0.55, 0.55].map((wX, idx) => (
          <mesh key={idx} position={[wX, 0.35, 0]} castShadow>
            <torusGeometry args={[0.35, 0.04, 12, 24]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        ))}
        <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0.4]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.8]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
        <mesh position={[-0.3, 0.75, 0]} castShadow>
          <boxGeometry args={[0.06, 0.06, 0.6]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      </group>
    </group>
  );
}

// Modern Street Trash & Recycling Bin (Axlot Qutisi)
export function StreetTrashBin({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.55, 0.9, 0.55]} />
        <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.45, 0.28]}>
        <planeGeometry args={[0.45, 0.8]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
    </group>
  );
}

// Ground-level Commercial Street Store (Coffee Shop, Supermarket, Cafe, Boutique)
interface StreetStorefrontProps {
  position: [number, number, number];
  type: 'coffee' | 'market' | 'boutique' | 'cafe';
}

export function StreetStorefront({ position, type }: StreetStorefrontProps) {
  const [x, y, z] = position;

  let facadeColor = '#78350f'; // Coffee Shop Wood
  let awningColor = '#f97316'; // Orange / Warm Awning
  let signColor = '#fde047';
  let emissiveColor = '#f97316';

  if (type === 'market') {
    facadeColor = '#0369a1'; // Blue Supermarket
    awningColor = '#38bdf8'; // Cyan Awning
    signColor = '#38bdf8';
    emissiveColor = '#0ea5e9';
  } else if (type === 'boutique') {
    facadeColor = '#581c87'; // Purple Boutique
    awningColor = '#ec4899'; // Pink Awning
    signColor = '#f472b6';
    emissiveColor = '#d946ef';
  } else if (type === 'cafe') {
    facadeColor = '#15803d'; // Green Cafe
    awningColor = '#22c55e'; // Green Awning
    signColor = '#86efac';
    emissiveColor = '#16a34a';
  }

  return (
    <group position={[x, y, z]}>
      {/* 2-Story Commercial Storefront Building */}
      <mesh position={[0, 3.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[8.2, 7.6, 11.5]} />
        <meshStandardMaterial color={facadeColor} roughness={0.4} />
      </mesh>

      {/* Large Glass Window Display Frontage */}
      <mesh position={[0, 2.0, 5.8]}>
        <planeGeometry args={[7.2, 3.4]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#7dd3fc" emissiveIntensity={1.2} roughness={0.1} />
      </mesh>

      {/* Glass Entrance Door Frame */}
      <mesh position={[0, 1.6, 5.82]}>
        <planeGeometry args={[1.8, 3.0]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} />
      </mesh>

      {/* Striped Canopy Awning */}
      <mesh position={[0, 4.0, 6.4]} rotation={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[8.4, 0.25, 1.8]} />
        <meshStandardMaterial color={awningColor} roughness={0.4} />
      </mesh>

      {/* Glowing Neon Store Name Sign Board */}
      <mesh position={[0, 5.4, 5.85]} castShadow>
        <boxGeometry args={[6.8, 1.1, 0.25]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0, 5.4, 5.98]}>
        <planeGeometry args={[6.4, 0.9]} />
        <meshStandardMaterial color={signColor} emissive={emissiveColor} emissiveIntensity={3.5} />
      </mesh>

      {/* Outdoor Cafe Seating */}
      {(type === 'coffee' || type === 'cafe') && (
        <group position={[0, 0, 7.8]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.7, 0.7, 0.08]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 0.45]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>

          {[-0.9, 0.9].map((chairX, idx) => (
            <group key={idx} position={[chairX, 0, 0]}>
              <mesh position={[0, 0.3, 0]} castShadow>
                <boxGeometry args={[0.45, 0.06, 0.45]} />
                <meshStandardMaterial color="#78350f" />
              </mesh>
              <mesh position={[0, 0.65, idx === 0 ? -0.2 : 0.2]} castShadow>
                <boxGeometry args={[0.45, 0.4, 0.05]} />
                <meshStandardMaterial color="#78350f" />
              </mesh>
            </group>
          ))}
        </group>
      )}
    </group>
  );
}

// Active Ground Level Railway Crossing (Chorraha Temir Yo'li & O'tuvchi Poyezd)
export function GroundRailwayCrossing({ position }: { position: [number, number, number] }) {
  const [x, y, z] = position;
  const passingTrainRef = useRef<THREE.Group | null>(null);
  const barrierArmRef = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (passingTrainRef.current) {
      const trainX = ((time * 32) % 260) - 130;
      passingTrainRef.current.position.x = trainX;
    }
    if (barrierArmRef.current) {
      barrierArmRef.current.rotation.z = Math.sin(time * 2) * 0.15 - 0.2;
    }
  });

  return (
    <group position={[x, y, z]}>
      {[-1.2, 1.2].map((trackZ, idx) => (
        <mesh key={idx} position={[0, 0.04, trackZ]}>
          <boxGeometry args={[65.0, 0.12, 0.3]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}

      {[-25, -18, -11, -4, 4, 11, 18, 25].map((tieX, idx) => (
        <mesh key={idx} position={[tieX, 0.02, 0]}>
          <boxGeometry args={[0.8, 0.08, 3.8]} />
          <meshStandardMaterial color="#451a03" roughness={0.9} />
        </mesh>
      ))}

      {[-8.2, 8.2].map((signalX, idx) => (
        <group key={idx} position={[signalX, 0, 2.4]}>
          <mesh position={[0, 2.0, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.12, 4.0]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>

          <group position={[0, 3.8, 0]}>
            <mesh rotation={[0, 0, 0.78]}>
              <boxGeometry args={[1.6, 0.22, 0.06]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh rotation={[0, 0, -0.78]}>
              <boxGeometry args={[1.6, 0.22, 0.06]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </group>

          {[-0.45, 0.45].map((lightX, lIdx) => (
            <mesh key={lIdx} position={[lightX, 3.2, 0.1]}>
              <sphereGeometry args={[0.16, 12, 12]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3.5} />
            </mesh>
          ))}

          <group ref={barrierArmRef} position={[0, 1.4, 0]}>
            <mesh position={[idx === 0 ? 3.5 : -3.5, 0, 0]}>
              <boxGeometry args={[7.2, 0.18, 0.12]} />
              <meshStandardMaterial color="#ef4444" roughness={0.4} />
            </mesh>
          </group>
        </group>
      ))}

      <group ref={passingTrainRef} position={[0, 1.6, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[26.0, 3.2, 3.4]} />
          <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.1, 1.72]}>
          <boxGeometry args={[26.1, 0.5, 0.04]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.0} />
        </mesh>
        {[-8, -3, 2, 7].map((winX, wIdx) => (
          <mesh key={wIdx} position={[winX, 0.5, 1.73]}>
            <planeGeometry args={[2.2, 1.1]} />
            <meshStandardMaterial color="#e0f2fe" emissive="#7dd3fc" emissiveIntensity={2.5} />
          </mesh>
        ))}
        <mesh position={[13.05, -0.4, 0]}>
          <sphereGeometry args={[0.35, 14, 14]} />
          <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={5.0} />
        </mesh>
      </group>
    </group>
  );
}

// Sparkling Coastal 3D Ocean Water Layer
export function OceanWater({ position }: { position: [number, number, number] }) {
  const [x, y, z] = position;
  const waterRef = useRef<THREE.Mesh | null>(null);

  useFrame((state) => {
    if (waterRef.current) {
      const t = state.clock.getElapsedTime();
      waterRef.current.position.y = y + Math.sin(t * 1.5) * 0.12;
    }
  });

  return (
    <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[x, y, z]}>
      <planeGeometry args={[180, 450]} />
      <meshStandardMaterial
        color="#0284c7"
        emissive="#0369a1"
        emissiveIntensity={0.6}
        roughness={0.15}
        metalness={0.8}
      />
    </mesh>
  );
}

// Iconic Red Coastal Suspension Bridge (Golden Gate style bridge spanning ocean bay)
export function SuspensionBridge({ position }: { position: [number, number, number] }) {
  const [x, y, z] = position;

  return (
    <group position={[x, y, z]}>
      {[-8.0, 8.0].map((towerX, idx) => (
        <group key={idx} position={[towerX, 0, 0]}>
          <mesh position={[0, 18, 0]} castShadow>
            <boxGeometry args={[2.2, 36, 2.2]} />
            <meshStandardMaterial color="#ef4444" roughness={0.3} />
          </mesh>
          <mesh position={[0, 28, 0]}>
            <boxGeometry args={[18, 2.0, 1.8]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 6.0, 0]} castShadow>
        <boxGeometry args={[20, 1.2, 350]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>

      {[-7.8, 7.8].map((cableX, idx) => (
        <mesh key={idx} position={[cableX, 22, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 350]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// Luxury White Ocean Yacht Floating on Water
export function OceanYacht({ position }: { position: [number, number, number] }) {
  const [x, y, z] = position;
  const yachtRef = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    if (yachtRef.current) {
      const t = state.clock.getElapsedTime();
      yachtRef.current.position.y = y + Math.sin(t * 2.0 + x) * 0.18;
      yachtRef.current.rotation.z = Math.cos(t * 1.5) * 0.04;
    }
  });

  return (
    <group ref={yachtRef} position={[x, y, z]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[3.2, 1.2, 10.0]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.6, -1.0]} castShadow>
        <boxGeometry args={[2.4, 1.1, 5.0]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} />
      </mesh>
    </group>
  );
}

// 3D Elevated Sky Metro Railway & High-Speed Bullet Train (Osmonopar Metro)
export function ElevatedMetroTrack({ position }: { position: [number, number, number] }) {
  const [x, y, z] = position;
  const trainRef = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    if (trainRef.current) {
      const t = (state.clock.getElapsedTime() * 22) % 180;
      trainRef.current.position.z = 60 - t;
    }
  });

  return (
    <group position={[x, y, z]}>
      <mesh position={[0, -5, 0]} castShadow>
        <cylinderGeometry args={[0.9, 1.2, 10.0, 10]} />
        <meshStandardMaterial color="#475569" roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.3, 0]} castShadow>
        <boxGeometry args={[7.0, 0.7, 1.4]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.2, 0.4, 35.0]} />
        <meshStandardMaterial color="#64748b" roughness={0.5} />
      </mesh>
      {[-1.6, 1.6].map((railX, idx) => (
        <mesh key={idx} position={[railX, 0.5, 0]}>
          <boxGeometry args={[0.2, 0.2, 35.0]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} />
        </mesh>
      ))}

      <group ref={trainRef} position={[0, 1.6, 0]}>
        <mesh castShadow>
          <boxGeometry args={[3.2, 2.2, 22.0]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[3.24, 0.45, 22.1]} />
          <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={1.5} />
        </mesh>
        {[-1.63, 1.63].map((winSide, idx) => (
          <mesh key={idx} position={[winSide, 0.4, 0]}>
            <boxGeometry args={[0.04, 0.7, 18.0]} />
            <meshStandardMaterial color="#0f172a" roughness={0.1} />
          </mesh>
        ))}
        {[-0.9, 0.9].map((hlX, idx) => (
          <mesh key={idx} position={[hlX, -0.2, -11.05]}>
            <sphereGeometry args={[0.28, 12, 12]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={5.0} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Glowing Rooftop City Billboard (LED Reklama Schild)
export function CityBillboard({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-1.6, 1.6].map((legX, idx) => (
        <mesh key={idx} position={[legX, 1.2, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 2.4]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 3.2, 0]} castShadow>
        <boxGeometry args={[4.2, 2.2, 0.3]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 3.2, 0.16]}>
        <planeGeometry args={[3.8, 1.8]} />
        <meshStandardMaterial color="#ec4899" emissive="#c026d3" emissiveIntensity={3.2} />
      </mesh>
    </group>
  );
}

// Vibrant Stylized City Building (Subway Surfers Style with Awnings & Windows)
interface StylizedBuildingProps {
  position: [number, number, number];
  width?: number;
  height?: number;
  depth?: number;
  primaryColor?: string;
  trimColor?: string;
}

export function StylizedBuilding({
  position,
  width = 8.0,
  height = 16,
  depth = 12,
  primaryColor = '#4f46e5',
  trimColor = '#38bdf8'
}: StylizedBuildingProps) {
  const [x, y, z] = position;

  return (
    <group position={[x, y, z]}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={primaryColor} roughness={0.35} metalness={0.2} />
      </mesh>

      {[-width / 2 + 0.3, width / 2 - 0.3].map((columnX, colIdx) => (
        <mesh key={colIdx} position={[columnX, height / 2, depth / 2 + 0.15]} castShadow>
          <boxGeometry args={[0.5, height, 0.4]} />
          <meshStandardMaterial color={trimColor} roughness={0.3} />
        </mesh>
      ))}

      {[...Array(Math.floor(height / 2.6))].map((_, row) => (
        <group key={row} position={[0, 2.6 + row * 2.4, depth / 2 + 0.22]}>
          {[-width / 3.2, 0, width / 3.2].map((winX, col) => (
            <group key={col} position={[winX, 0, 0]}>
              <mesh>
                <planeGeometry args={[1.35, 1.45]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
              <mesh position={[0, 0, 0.02]}>
                <planeGeometry args={[1.15, 1.25]} />
                <meshStandardMaterial
                  color="#e0f2fe"
                  emissive="#7dd3fc"
                  emissiveIntensity={row % 2 === 0 ? 1.8 : 0.6}
                  roughness={0.1}
                />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      <mesh position={[0, 2.2, depth / 2 + 0.8]} rotation={[0.25, 0, 0]} castShadow>
        <boxGeometry args={[width + 0.4, 0.25, 1.4]} />
        <meshStandardMaterial color="#ef4444" roughness={0.4} />
      </mesh>

      <mesh position={[0, height + 0.3, 0]} castShadow>
        <boxGeometry args={[width + 0.5, 0.6, depth + 0.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>

      <mesh position={[0, height + 2.5, 0]}>
        <cylinderGeometry args={[0.08, 0.16, 4]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} />
      </mesh>
      <mesh position={[0, height + 4.6, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={4.0} />
      </mesh>
    </group>
  );
}

// 3D Wooden Park Bench (Skameyka)
export function ParkBench({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.6, 0.08, 0.5]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.85, -0.22]} rotation={[-0.15, 0, 0]} castShadow>
        <boxGeometry args={[1.6, 0.45, 0.06]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      <mesh position={[-0.7, 0.22, 0]} castShadow>
        <boxGeometry args={[0.08, 0.45, 0.48]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.7, 0.22, 0]} castShadow>
        <boxGeometry args={[0.08, 0.45, 0.48]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
}

// Ultra-Realistic 3D Uzbek Gujum Tree (Multi-branched wood trunk & 7 overlapping leafy canopy clusters)
export function GujumTree({ position, scale = 1.3 }: { position: [number, number, number]; scale?: number }) {
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]} scale={[scale, scale, scale]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0, 3.2, 32]} />
        <meshBasicMaterial color="#052e16" transparent opacity={0.45} />
      </mesh>

      <mesh position={[0, 2.0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.65, 4.0, 10]} />
        <meshStandardMaterial color="#451a03" roughness={0.95} />
      </mesh>

      <mesh position={[-0.4, 3.4, 0]} rotation={[0, 0, 0.45]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.32, 1.8, 8]} />
        <meshStandardMaterial color="#451a03" roughness={0.95} />
      </mesh>
      <mesh position={[0.4, 3.5, 0]} rotation={[0, 0, -0.45]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.32, 1.8, 8]} />
        <meshStandardMaterial color="#451a03" roughness={0.95} />
      </mesh>

      <group position={[0, 4.6, 0]}>
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <sphereGeometry args={[2.4, 16, 16]} />
          <meshStandardMaterial color="#14532d" roughness={0.8} />
        </mesh>
        <mesh position={[-1.1, 0.8, 0.6]} castShadow receiveShadow>
          <sphereGeometry args={[1.7, 14, 14]} />
          <meshStandardMaterial color="#166534" roughness={0.8} />
        </mesh>
        <mesh position={[1.1, 0.9, -0.5]} castShadow receiveShadow>
          <sphereGeometry args={[1.8, 14, 14]} />
          <meshStandardMaterial color="#15803d" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.4, -0.8]} castShadow receiveShadow>
          <sphereGeometry args={[1.6, 14, 14]} />
          <meshStandardMaterial color="#16a34a" roughness={0.8} />
        </mesh>
        <mesh position={[-0.6, 1.6, 0.4]} castShadow receiveShadow>
          <sphereGeometry args={[1.4, 14, 14]} />
          <meshStandardMaterial color="#22c55e" roughness={0.8} />
        </mesh>
        <mesh position={[0.6, 1.8, 0.2]} castShadow receiveShadow>
          <sphereGeometry args={[1.2, 14, 14]} />
          <meshStandardMaterial color="#4ade80" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

// Raised Garden Flowerbed with Stone Border (Gullik Bog'cha)
export function GardenFlowerbed({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[2.4, 0.3, 2.4]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[2.1, 0.1, 2.1]} />
        <meshStandardMaterial color="#451a03" roughness={1.0} />
      </mesh>
      <mesh position={[-0.5, 0.38, -0.4]}>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.4, 0.42, 0.3]}>
        <sphereGeometry args={[0.24, 10, 10]} />
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 0.45, -0.2]}>
        <sphereGeometry args={[0.25, 10, 10]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// City Crosswalk Zebra Stripes
export function CrosswalkStripes({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[-5.0, -3.0, -1.0, 1.0, 3.0, 5.0].map((x, idx) => (
        <mesh key={idx} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, 0]}>
          <planeGeometry args={[1.2, 4.5]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  );
}

// 3D City Traffic Light Signal (Svetofor)
export function TrafficSignal({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 5.0]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} />
      </mesh>
      <mesh position={[0, 4.4, 0]} castShadow>
        <boxGeometry args={[0.5, 1.6, 0.45]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 4.9, 0.23]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3.5} />
      </mesh>
      <mesh position={[0, 4.4, 0.23]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[0, 3.9, 0.23]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={3.5} />
      </mesh>
    </group>
  );
}

// Bus Stop / Billboard Kiosk on Corner
export function CityKiosk({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[1.8, 2.8, 0.3]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} />
      </mesh>
      <mesh position={[0, 1.4, 0.16]}>
        <planeGeometry args={[1.5, 2.3]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={2.5} />
      </mesh>
    </group>
  );
}

// Ultra-Realistic Stylized Park Tree (+ Multi-Layer Canopy & Ground Shadow Disc)
interface RealTreeProps {
  position: [number, number, number];
  scale?: number;
  type?: 'pine' | 'oak';
}

export function RealTree({ position, scale = 1.15, type = 'pine' }: RealTreeProps) {
  const [x, y, z] = position;

  return (
    <group position={[x, y, z]} scale={[scale, scale, scale]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0, 2.6, 28]} />
        <meshBasicMaterial color="#052e16" transparent opacity={0.4} />
      </mesh>

      <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.24, 0.45, 3.2, 8]} />
        <meshStandardMaterial color="#512e12" roughness={0.9} />
      </mesh>

      {type === 'pine' ? (
        <group position={[0, 3.2, 0]}>
          <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
            <coneGeometry args={[2.2, 2.8, 8]} />
            <meshStandardMaterial color="#047857" roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
            <coneGeometry args={[1.7, 2.4, 8]} />
            <meshStandardMaterial color="#059669" roughness={0.6} />
          </mesh>
          <mesh position={[0, 3.0, 0]} castShadow receiveShadow>
            <coneGeometry args={[1.1, 2.0, 8]} />
            <meshStandardMaterial color="#10b981" roughness={0.6} />
          </mesh>
        </group>
      ) : (
        <group position={[0, 3.8, 0]}>
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <dodecahedronGeometry args={[2.0, 1]} />
            <meshStandardMaterial color="#15803d" roughness={0.7} />
          </mesh>
          <mesh position={[-0.6, 0.8, 0.4]} castShadow receiveShadow>
            <dodecahedronGeometry args={[1.4, 1]} />
            <meshStandardMaterial color="#16a34a" roughness={0.7} />
          </mesh>
          <mesh position={[0.6, 0.9, -0.3]} castShadow receiveShadow>
            <dodecahedronGeometry args={[1.3, 1]} />
            <meshStandardMaterial color="#22c55e" roughness={0.7} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// Low-lying Flowerbed Clusters
export function FlowerbedCluster({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[-0.3, 0.15, -0.2]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color="#16a34a" roughness={0.8} />
      </mesh>
      <mesh position={[0.3, 0.18, 0.1]}>
        <sphereGeometry args={[0.24, 12, 12]} />
        <meshStandardMaterial color="#16a34a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}
