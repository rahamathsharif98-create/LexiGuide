import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function LabyrinthEnvironment({ isUnlocked = false }) {
  const doorRef = useRef();
  const chestGlowRef = useRef();

  useFrame((state, delta) => {
    // Temple door slides open vertically when unlocked
    if (doorRef.current) {
      const targetY = isUnlocked ? 5.2 : 1.8;
      doorRef.current.position.y = THREE.MathUtils.lerp(doorRef.current.position.y, targetY, 0.08);
    }
    // Treasure glow pulsation
    if (chestGlowRef.current) {
      chestGlowRef.current.intensity = 1.0 + Math.sin(state.clock.elapsedTime * 4) * 0.4;
    }
  });

  return (
    <group>
      {/* 1. Labyrinth Ambient Sky Dome */}
      <mesh>
        <sphereGeometry args={[75, 24, 24]} />
        <meshBasicMaterial color="#0c0a09" side={1} />
      </mesh>

      {/* 2. Cobblestone Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[80, 80, 16, 16]} />
        <meshStandardMaterial color="#292524" roughness={0.9} />
      </mesh>

      {/* 3. Labyrinth Stone Walls */}
      {/* Back Wall with Archway */}
      <group position={[0, 0, -14]}>
        {/* Left wall pillar */}
        <mesh position={[-4, 2, 0]}>
          <boxGeometry args={[4.5, 4, 1.2]} />
          <meshStandardMaterial color="#44403c" roughness={0.8} />
        </mesh>
        {/* Right wall pillar */}
        <mesh position={[4, 2, 0]}>
          <boxGeometry args={[4.5, 4, 1.2]} />
          <meshStandardMaterial color="#44403c" roughness={0.8} />
        </mesh>
        {/* Arch header */}
        <mesh position={[0, 4.2, 0]}>
          <boxGeometry args={[4, 1.4, 1.4]} />
          <meshStandardMaterial color="#292524" roughness={0.7} />
        </mesh>

        {/* Sliding Stone Door Slab */}
        <mesh ref={doorRef} position={[0, 1.8, 0]}>
          <boxGeometry args={[3.2, 3.6, 0.4]} />
          <meshStandardMaterial
            color="#57534e"
            roughness={0.7}
            metalness={0.2}
          />
        </mesh>

        {/* Golden Treasure Chest inside the vault behind the door */}
        <group position={[0, 0.6, -3.5]}>
          <mesh>
            <boxGeometry args={[1.5, 1.0, 1.1]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 1.5, 16, 1, false, 0, Math.PI]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.2} />
          </mesh>
          <pointLight ref={chestGlowRef} position={[0, 0.8, 0]} color="#fbbf24" distance={8} />
        </group>
      </group>

      {/* Corridor Side Walls */}
      <mesh position={[-6.5, 2, -4]}>
        <boxGeometry args={[1, 4, 18]} />
        <meshStandardMaterial color="#44403c" roughness={0.8} />
      </mesh>
      <mesh position={[6.5, 2, -4]}>
        <boxGeometry args={[1, 4, 18]} />
        <meshStandardMaterial color="#44403c" roughness={0.8} />
      </mesh>

      {/* Interior Dividing Maze Pillars */}
      <mesh position={[-2.5, 1.8, -6]}>
        <boxGeometry args={[1.2, 3.6, 1.2]} />
        <meshStandardMaterial color="#292524" />
      </mesh>
      <mesh position={[2.5, 1.8, -6]}>
        <boxGeometry args={[1.2, 3.6, 1.2]} />
        <meshStandardMaterial color="#292524" />
      </mesh>

      {/* 4. Flickering Torch Sconces on Walls */}
      {[-5.9, 5.9].map((x) =>
        [-10, -5, 0].map((z) => (
          <group key={`torch-${x}-${z}`} position={[x, 2.4, z]}>
            {/* Sconce bracket */}
            <mesh>
              <cylinderGeometry args={[0.06, 0.08, 0.6, 8]} />
              <meshStandardMaterial color="#1c1917" metalness={0.8} />
            </mesh>
            {/* Torch flame */}
            <mesh position={[0, 0.35, 0]}>
              <coneGeometry args={[0.15, 0.4, 8]} />
              <meshBasicMaterial color="#f97316" />
            </mesh>
          </group>
        ))
      )}
    </group>
  );
}
