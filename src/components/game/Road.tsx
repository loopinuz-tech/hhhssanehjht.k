import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import {
  StylizedBuilding,
  StreetStorefront,
  CitySkyline,
  SkyAirplane,
  RealTree,
  GujumTree,
  ParkBench,
  GardenFlowerbed,
  CrosswalkStripes,
  TrafficSignal,
  CityKiosk,
  ElevatedMetroTrack,
  CityBillboard,
  OceanWater,
  SuspensionBridge,
  OceanYacht,
  GroundRailwayCrossing,
  BicycleLane,
  BicycleRack,
  StreetTrashBin,
  GlowingStreetLamp,
} from './Environment';

const SEGMENT_COUNT = 10;
const SEGMENT_LENGTH = 35; // Each road segment spans 35 meters

const BUILDING_THEMES = [
  { primary: '#4f46e5', trim: '#38bdf8' }, // Indigo & Cyan
  { primary: '#0d9488', trim: '#86efac' }, // Teal & Mint
  { primary: '#ea580c', trim: '#fde047' }, // Coral & Yellow
  { primary: '#7e22ce', trim: '#f472b6' }, // Purple & Pink
  { primary: '#059669', trim: '#facc15' }, // Emerald & Gold
];

const STORE_TYPES: ('coffee' | 'market' | 'boutique' | 'cafe')[] = [
  'coffee',
  'market',
  'cafe',
  'boutique',
];

export default function Road() {
  const speed = useGameStore(s => s.speed);
  const speedMultiplier = useGameStore(s => s.speedMultiplier);
  const status = useGameStore(s => s.status);
  const isFocusMode = useGameStore(s => s.isFocusMode);
  const updateDistanceAndCoins = useGameStore(s => s.updateDistanceAndCoins);

  const segmentsRef = useRef<THREE.Group[]>([]);

  useFrame((_, delta) => {
    if (status !== 'playing') return;

    const moveDist = speed * speedMultiplier * delta;
    updateDistanceAndCoins(moveDist * 0.85);

    // Continuous Object Pooling for 10 Infinite Road Segments
    segmentsRef.current.forEach((grp) => {
      if (!grp) return;
      grp.position.z += moveDist;

      // Recycle road segment to distant horizon (Z = -300) when it passes camera (Z > 35)
      if (grp.position.z > 35) {
        grp.position.z -= SEGMENT_COUNT * SEGMENT_LENGTH;
      }
    });
  });

  return (
    <group>
      {/* Decorative World Elements (Hidden in 1-Click Focus Mode) */}
      {!isFocusMode && (
        <>
          <CitySkyline />
          <SkyAirplane />
          <OceanWater position={[-75, -0.3, -200]} />
          <OceanWater position={[75, -0.3, -200]} />
          <SuspensionBridge position={[-85, 0, -200]} />
          <SuspensionBridge position={[85, 0, -200]} />
          <OceanYacht position={[-62, 0.1, -120]} />
          <OceanYacht position={[62, 0.1, -180]} />
        </>
      )}

      {/* Infinite Landscape Ground Base Plane (White background when focus mode active) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, -200]} receiveShadow>
        <planeGeometry args={[600, 850]} />
        <meshStandardMaterial color={isFocusMode ? '#ffffff' : '#86efac'} roughness={1.0} />
      </mesh>

      {/* Procedural Segment Pool (10 repeating road blocks) */}
      {[...Array(SEGMENT_COUNT)].map((_, i) => {
        const initialZ = -i * SEGMENT_LENGTH + 20;

        const leftHeight = 15 + ((i * 3) % 8);
        const rightHeight = 16 + ((i * 4) % 7);
        const leftTheme = BUILDING_THEMES[i % BUILDING_THEMES.length];
        const rightTheme = BUILDING_THEMES[(i + 2) % BUILDING_THEMES.length];
        const isIntersectionSegment = i % 2 === 0;
        const isRailwayCrossingSegment = i === 7;

        const isLeftStore = i % 2 === 1;
        const isRightStore = (i + 1) % 2 === 1;
        const leftStoreType = STORE_TYPES[i % STORE_TYPES.length];
        const rightStoreType = STORE_TYPES[(i + 1) % STORE_TYPES.length];

        return (
          <group
            key={i}
            ref={el => { if (el) segmentsRef.current[i] = el; }}
            position={[0, 0, initialZ]}
          >
            {/* Main Asphalt City Runner Track */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
              <planeGeometry args={[14.8, SEGMENT_LENGTH]} />
              <meshStandardMaterial color="#1e293b" roughness={0.5} />
            </mesh>

            {/* Cyan & Purple Lane Divider Lines */}
            {[-2.5, 2.5].map((lineX, idx) => (
              <mesh key={idx} rotation={[-Math.PI / 2, 0, 0]} position={[lineX, 0.02, 0]}>
                <planeGeometry args={[0.15, SEGMENT_LENGTH - 4]} />
                <meshBasicMaterial color={idx === 0 ? '#06b6d4' : '#a855f7'} />
              </mesh>
            ))}

            {/* Red & White Striped Racing Curbs */}
            {[-7.2, 7.2].map((curbX, idx) => (
              <group key={idx}>
                {[0, 1, 2, 3, 4, 5, 6].map((step) => {
                  const isRed = (i + step) % 2 === 0;
                  const stepZ = -step * 5 + 15;
                  return (
                    <mesh key={step} position={[curbX, 0.22, stepZ]}>
                      <boxGeometry args={[0.38, 0.25, 5]} />
                      <meshStandardMaterial color={isRed ? '#ef4444' : '#ffffff'} roughness={0.4} />
                    </mesh>
                  );
                })}
              </group>
            ))}

            {/* ALL CITY DECORATIONS HIDDEN IF FOCUS MODE IS ACTIVE */}
            {!isFocusMode && (
              <>
                {/* Perpendicular Intersecting Side Streets */}
                {isIntersectionSegment && (
                  <>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-25, 0.01, 10]}>
                      <planeGeometry args={[25, 9]} />
                      <meshStandardMaterial color="#334155" roughness={0.6} />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[25, 0.01, 10]}>
                      <planeGeometry args={[25, 9]} />
                      <meshStandardMaterial color="#334155" roughness={0.6} />
                    </mesh>
                    <CrosswalkStripes position={[0, 0, 10]} />
                    <TrafficSignal position={[-7.8, 0, 14]} />
                    <TrafficSignal position={[7.8, 0, 14]} />
                    <CityKiosk position={[-9.2, 0, 6]} />
                  </>
                )}

                {/* Ground Railway Crossing */}
                {isRailwayCrossingSegment && (
                  <GroundRailwayCrossing position={[0, 0, -5]} />
                )}

                {/* Sky Metro Track */}
                <ElevatedMetroTrack position={[-32.0, 13.5, 0]} />

                {/* Left Sidewalk Paving Border */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-10.8, 0.05, 0]}>
                  <planeGeometry args={[3.8, SEGMENT_LENGTH]} />
                  <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
                </mesh>
                <BicycleLane position={[-10.8, 0, 0]} />
                <mesh position={[-7.5, 0.12, 0]}>
                  <boxGeometry args={[0.4, 0.22, SEGMENT_LENGTH]} />
                  <meshStandardMaterial color="#94a3b8" roughness={0.4} />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-23, 0.04, 0]}>
                  <planeGeometry args={[26, SEGMENT_LENGTH]} />
                  <meshStandardMaterial color="#22c55e" roughness={0.8} />
                </mesh>

                {/* Right Sidewalk Paving Border */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10.8, 0.05, 0]}>
                  <planeGeometry args={[3.8, SEGMENT_LENGTH]} />
                  <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
                </mesh>
                <BicycleLane position={[10.8, 0, 0]} />
                <mesh position={[7.5, 0.12, 0]}>
                  <boxGeometry args={[0.4, 0.22, SEGMENT_LENGTH]} />
                  <meshStandardMaterial color="#94a3b8" roughness={0.4} />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[23, 0.04, 0]}>
                  <planeGeometry args={[26, SEGMENT_LENGTH]} />
                  <meshStandardMaterial color="#22c55e" roughness={0.8} />
                </mesh>

                {/* Street Lamp Posts */}
                <GlowingStreetLamp position={[-7.4, 0, -4]} alignLeft={true} />
                <GlowingStreetLamp position={[7.4, 0, -12]} alignLeft={false} />

                {/* Bicycle Racks */}
                {i % 2 === 0 && (
                  <>
                    <BicycleRack position={[-12.8, 0.06, 6]} />
                    <BicycleRack position={[12.8, 0.06, -6]} />
                  </>
                )}

                {/* Trash Bins */}
                <StreetTrashBin position={[-12.5, 0.06, -2]} />
                <StreetTrashBin position={[12.5, 0.06, 2]} />

                {/* Trees */}
                <GujumTree position={[-13.2, 0, -8]} scale={1.3} />
                <RealTree position={[-13.2, 0, 10]} scale={1.2} type="pine" />
                <GujumTree position={[13.2, 0, 8]} scale={1.3} />
                <RealTree position={[12.6, 0, -10]} scale={1.2} type="oak" />

                {/* Benches */}
                <ParkBench position={[-12.6, 0, 2]} rotationY={Math.PI / 2} />
                <ParkBench position={[12.6, 0, -2]} rotationY={-Math.PI / 2} />

                {/* Flowerbeds */}
                <GardenFlowerbed position={[-13.5, 0, -14]} />
                <GardenFlowerbed position={[13.5, 0, 14]} />

                {/* Billboards */}
                {i % 3 === 0 && (
                  <CityBillboard position={[19.5, rightHeight, -6]} />
                )}

                {/* Storefronts or Buildings */}
                {isLeftStore ? (
                  <StreetStorefront position={[-19.5, 0, -6]} type={leftStoreType} />
                ) : (
                  <StylizedBuilding
                    position={[-19.5, 0, -6]}
                    width={8.5}
                    height={leftHeight}
                    depth={13}
                    primaryColor={leftTheme.primary}
                    trimColor={leftTheme.trim}
                  />
                )}

                {isRightStore ? (
                  <StreetStorefront position={[19.5, 0, -6]} type={rightStoreType} />
                ) : (
                  <StylizedBuilding
                    position={[19.5, 0, -6]}
                    width={8.5}
                    height={rightHeight}
                    depth={13}
                    primaryColor={rightTheme.primary}
                    trimColor={rightTheme.trim}
                  />
                )}
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}
