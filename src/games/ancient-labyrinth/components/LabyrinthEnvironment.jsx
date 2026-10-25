import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function LabyrinthEnvironment({ isUnlocked = false, isVictory = false }) {
  const doorRef = useRef();
  const chestGlowRef = useRef();
  const chestLidRef = useRef();
  const blueFlameRef1 = useRef();
  const blueFlameRef2 = useRef();

  useFrame((state, delta) => {
    // Temple door slides open vertically when unlocked or on victory
    if (doorRef.current) {
      const targetY = (isUnlocked || isVictory) ? 5.4 : 1.8;
      doorRef.current.position.y = THREE.MathUtils.lerp(doorRef.current.position.y, targetY, 0.08);
    }
    // Treasure glow pulsation
    if (chestGlowRef.current) {
      const baseIntensity = isVictory ? 4.8 : 1.0;
      const pulseSpeed = isVictory ? 6 : 4;
      const pulseAmp = isVictory ? 1.6 : 0.4;
      chestGlowRef.current.intensity = baseIntensity + Math.sin(state.clock.elapsedTime * pulseSpeed) * pulseAmp;
      chestGlowRef.current.distance = isVictory ? 18 : 8;
    }
    // Opening treasure chest lid during victory moment
    if (chestLidRef.current) {
      const targetLidAngle = isVictory ? -Math.PI * 0.45 : 0;
      chestLidRef.current.rotation.x = THREE.MathUtils.lerp(chestLidRef.current.rotation.x, targetLidAngle, 0.06);
    }
    // Magical blue flame pulsation
    if (blueFlameRef1.current && blueFlameRef2.current) {
      const bluePulse = 0.75 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      blueFlameRef1.current.intensity = bluePulse;
      blueFlameRef2.current.intensity = bluePulse;
    }
  });

  return (
    <group>
      {/* 1. Labyrinth Ambient Sky / Tomb Vault Dome */}
      <mesh>
        <sphereGeometry args={[75, 24, 24]} />
        <meshBasicMaterial color="#0c0906" side={1} />
      </mesh>

      {/* 2. Temple Cobblestone Floor */}
      <group position={[0, 0, 0]}>
        {/* Base subfloor plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
          <planeGeometry args={[80, 80, 16, 16]} />
          <meshStandardMaterial color="#24201c" roughness={0.92} />
        </mesh>

        {/* Central Ceremonial Flagstone Pathway */}
        {[-12, -9, -6, -3, 0, 3].map((z, idx) => (
          <group key={`flagstone-${z}`} position={[0, 0.01, z]}>
            {/* Main center paving slab */}
            <mesh>
              <boxGeometry args={[4.8, 0.04, 2.7]} />
              <meshStandardMaterial
                color={idx % 2 === 0 ? '#38322c' : '#423b34'}
                roughness={0.88}
              />
            </mesh>
            {/* Gold-accented ceremonial center inlay */}
            <mesh position={[0, 0.025, 0]}>
              <boxGeometry args={[1.6, 0.02, 1.8]} />
              <meshStandardMaterial color="#5c4d3c" roughness={0.75} metalness={0.2} />
            </mesh>
            {/* Small decorative bronze corner studs */}
            {[-0.7, 0.7].map((cx) =>
              [-0.8, 0.8].map((cz) => (
                <mesh key={`stud-${cx}-${cz}`} position={[cx, 0.04, cz]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.02, 8]} />
                  <meshStandardMaterial color="#d97706" metalness={0.7} roughness={0.3} />
                </mesh>
              ))
            )}
          </group>
        ))}

        {/* Stepped Perimeter Curbs along corridor edges */}
        {[-5.8, 5.8].map((x) => (
          <mesh key={`curb-${x}`} position={[x, 0.12, -4]}>
            <boxGeometry args={[0.6, 0.24, 22]} />
            <meshStandardMaterial color="#2d2824" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* 3. Labyrinth Stone Walls with Architectural Pilasters & Moldings */}
      <group>
        {/* Main Side Walls */}
        <mesh position={[-6.5, 2.4, -4]}>
          <boxGeometry args={[0.8, 4.8, 24]} />
          <meshStandardMaterial color="#3f3832" roughness={0.85} />
        </mesh>
        <mesh position={[6.5, 2.4, -4]}>
          <boxGeometry args={[0.8, 4.8, 24]} />
          <meshStandardMaterial color="#3f3832" roughness={0.85} />
        </mesh>

        {/* Upper Carved Stone Cornice along top of walls */}
        {[-6.3, 6.3].map((x) => (
          <mesh key={`cornice-${x}`} position={[x, 4.7, -4]}>
            <boxGeometry args={[0.7, 0.4, 24]} />
            <meshStandardMaterial color="#4d443a" roughness={0.8} />
          </mesh>
        ))}

        {/* Architectural Pilasters / Buttresses along left & right walls */}
        {[-12, -8, -4, 0, 4].map((z) => (
          <group key={`pilasters-${z}`}>
            {/* Left wall pilaster */}
            <mesh position={[-6.0, 2.3, z]}>
              <boxGeometry args={[0.6, 4.6, 0.9]} />
              <meshStandardMaterial color="#4a4239" roughness={0.8} />
            </mesh>
            {/* Right wall pilaster */}
            <mesh position={[6.0, 2.3, z]}>
              <boxGeometry args={[0.6, 4.6, 0.9]} />
              <meshStandardMaterial color="#4a4239" roughness={0.8} />
            </mesh>
          </group>
        ))}

        {/* Carved Hieroglyphic Relief Wall Cartouches between pilasters */}
        {[-10, -6, -2, 2].map((z) => (
          <group key={`relief-${z}`}>
            {/* Left Wall Relief Tablet */}
            <mesh position={[-6.05, 2.5, z]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[2.2, 1.4, 0.15]} />
              <meshStandardMaterial color="#2d2722" roughness={0.8} />
            </mesh>
            <mesh position={[-5.96, 2.5, z]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[1.8, 1.1]} />
              <meshStandardMaterial color="#78593a" metalness={0.4} roughness={0.6} />
            </mesh>

            {/* Right Wall Relief Tablet */}
            <mesh position={[6.05, 2.5, z]} rotation={[0, -Math.PI / 2, 0]}>
              <boxGeometry args={[2.2, 1.4, 0.15]} />
              <meshStandardMaterial color="#2d2722" roughness={0.8} />
            </mesh>
            <mesh position={[5.96, 2.5, z]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[1.8, 1.1]} />
              <meshStandardMaterial color="#78593a" metalness={0.4} roughness={0.6} />
            </mesh>
          </group>
        ))}

        {/* Overhead Stone Rafters / Cross-Beams spanning the ceiling */}
        {[-12, -8, -4, 0].map((z) => (
          <group key={`lintel-${z}`} position={[0, 4.65, z]}>
            <mesh>
              <boxGeometry args={[13.2, 0.45, 0.85]} />
              <meshStandardMaterial color="#38322b" roughness={0.85} />
            </mesh>
            {/* Bronze center medallion on overhead beam */}
            <mesh position={[0, -0.23, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.05, 8]} />
              <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 4. Grand Temple Side Colonnades (positioned against walls to keep puzzle floor open) */}
      {[-5.2, 5.2].map((x) => (
        <group key={`temple-col-${x}`} position={[x, 0, -6]}>
          {/* Stepped square base plinth */}
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[1.3, 0.4, 1.3]} />
            <meshStandardMaterial color="#332d28" roughness={0.85} />
          </mesh>
          {/* Fluted column shaft */}
          <mesh position={[0, 2.1, 0]}>
            <cylinderGeometry args={[0.48, 0.52, 3.4, 16]} />
            <meshStandardMaterial color="#4a4239" roughness={0.8} />
          </mesh>
          {/* Carved papyrus capital */}
          <mesh position={[0, 4.0, 0]}>
            <boxGeometry args={[1.2, 0.45, 1.2]} />
            <meshStandardMaterial color="#5c5245" roughness={0.75} metalness={0.2} />
          </mesh>
          {/* Gold capital ring */}
          <mesh position={[0, 3.75, 0]}>
            <cylinderGeometry args={[0.54, 0.54, 0.12, 16]} />
            <meshStandardMaterial color="#d97706" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* 5. Back Sanctuary Wall with Grand Vault Archway */}
      <group position={[0, 0, -14]}>
        {/* Left Arch Pillar Jamb */}
        <mesh position={[-3.6, 2.3, 0]}>
          <boxGeometry args={[4.2, 4.6, 1.4]} />
          <meshStandardMaterial color="#3a332d" roughness={0.8} />
        </mesh>
        {/* Right Arch Pillar Jamb */}
        <mesh position={[3.6, 2.3, 0]}>
          <boxGeometry args={[4.2, 4.6, 1.4]} />
          <meshStandardMaterial color="#3a332d" roughness={0.8} />
        </mesh>
        {/* Grand Arch Lintel Header */}
        <mesh position={[0, 4.4, 0]}>
          <boxGeometry args={[4.8, 1.4, 1.6]} />
          <meshStandardMaterial color="#2d2722" roughness={0.75} />
        </mesh>
        {/* Winged Sun Disc Relief on Lintel */}
        <mesh position={[0, 4.4, 0.82]}>
          <cylinderGeometry args={[0.42, 0.42, 0.08, 16]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial
            color="#f59e0b"
            metalness={0.8}
            roughness={0.25}
            emissive={isVictory ? '#f59e0b' : '#000000'}
            emissiveIntensity={isVictory ? 1.0 : 0}
          />
        </mesh>

        {/* Luminous golden archway entrance glow on unlock/victory */}
        <pointLight
          position={[0, 3.2, 0.8]}
          color="#f59e0b"
          intensity={isVictory ? 4.5 : (isUnlocked ? 1.8 : 0)}
          distance={14}
        />

        {/* Sliding Stone Vault Door Slab */}
        <mesh ref={doorRef} position={[0, 1.8, 0]}>
          <boxGeometry args={[3.2, 3.6, 0.45]} />
          <meshStandardMaterial
            color="#473f38"
            roughness={0.7}
            metalness={0.2}
          />
        </mesh>

        {/* Golden Treasure Chest inside the inner vault sanctuary */}
        <group position={[0, 0.6, -3.5]}>
          {/* Chest base */}
          <mesh>
            <boxGeometry args={[1.6, 0.9, 1.1]} />
            <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Curved chest lid with animated opening pivot */}
          <group ref={chestLidRef} position={[0, 0.45, -0.55]}>
            <mesh position={[0, 0.05, 0.55]}>
              <cylinderGeometry args={[0.55, 0.55, 1.6, 16, 1, false, 0, Math.PI]} rotation={[0, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
          {/* Glowing treasure pile */}
          <pointLight ref={chestGlowRef} position={[0, 0.9, 0]} color="#fbbf24" distance={8} />
        </group>
      </group>

      {/* 6. Warm Torch Sconces on Walls with Genuine Point Lights */}
      {[-5.7, 5.7].map((x) =>
        [-10, -5, 0].map((z) => (
          <group key={`torch-${x}-${z}`} position={[x, 2.5, z]}>
            {/* Bronze sconce wall bracket */}
            <mesh>
              <cylinderGeometry args={[0.07, 0.09, 0.6, 8]} />
              <meshStandardMaterial color="#1f1c19" metalness={0.8} roughness={0.4} />
            </mesh>
            {/* Brazier torch bowl */}
            <mesh position={[0, 0.28, 0]}>
              <cylinderGeometry args={[0.18, 0.09, 0.16, 8]} />
              <meshStandardMaterial color="#78350f" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Inner flame core */}
            <mesh position={[0, 0.42, 0]}>
              <coneGeometry args={[0.12, 0.35, 8]} />
              <meshBasicMaterial color="#fef08a" />
            </mesh>
            {/* Outer flame glow */}
            <mesh position={[0, 0.45, 0]}>
              <coneGeometry args={[0.17, 0.45, 8]} />
              <meshBasicMaterial color="#f97316" transparent opacity={0.75} />
            </mesh>
            {/* Dynamic warm torch point light illuminating the corridor */}
            <pointLight
              position={[x > 0 ? -0.4 : 0.4, 0.5, 0]}
              color="#f59e0b"
              intensity={0.85}
              distance={9}
            />
          </group>
        ))
      )}

      {/* 7. Subtle Blue Magical Illumination (Ancient Sanctuary Vault Braziers) */}
      {[-3.8, 3.8].map((x, idx) => (
        <group key={`blue-brazier-${x}`} position={[x, 0, -13]}>
          {/* Carved stone brazier pedestal */}
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.35, 0.45, 0.7, 8]} />
            <meshStandardMaterial color="#332d28" roughness={0.85} />
          </mesh>
          {/* Lapis-encrusted brazier bowl */}
          <mesh position={[0, 0.75, 0]}>
            <cylinderGeometry args={[0.42, 0.25, 0.25, 8]} />
            <meshStandardMaterial color="#0c4a6e" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Glowing magical blue crystal core */}
          <mesh position={[0, 0.95, 0]}>
            <octahedronGeometry args={[0.22, 0]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          {/* Subtle cyan-blue magical point light */}
          <pointLight
            ref={idx === 0 ? blueFlameRef1 : blueFlameRef2}
            position={[0, 1.2, 0]}
            color="#38bdf8"
            intensity={0.75}
            distance={8}
          />
        </group>
      ))}
    </group>
  );
}
