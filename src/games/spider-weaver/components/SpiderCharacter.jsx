import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * SpiderCharacter.jsx
 * Spinny the Spider: A cute, ultra-friendly, non-spooky 3D mascot.
 * Features:
 * - Plump, friendly spherical body with pastel violet/orchid coloring
 * - Big Disney-style curious cartoon eyes that periodically blink
 * - 8 gentle animated legs with cute colorful sneakers
 * - Smooth hover/crawl physics and victory 360 spin
 */
export default function SpiderCharacter({
  position = [0, 0, 0],
  state = 'idle', // 'idle', 'weaving', 'victory', 'happy'
  targetPos = null,
}) {
  const groupRef = useRef();
  const bodyRef = useRef();
  const eyesRef = useRef();

  useFrame((stateObj) => {
    const t = stateObj.clock.getElapsedTime();

    if (groupRef.current) {
      if (state === 'victory') {
        // Joyful celebration spin & hop
        groupRef.current.rotation.y += 0.08;
        groupRef.current.position.y = position[1] + Math.abs(Math.sin(t * 8)) * 0.8;
      } else if (state === 'weaving') {
        // Quick energetic bobbing while spinning silk
        groupRef.current.position.y = position[1] + Math.sin(t * 12) * 0.15;
        groupRef.current.rotation.z = Math.sin(t * 10) * 0.1;
      } else {
        // Gentle comforting breathing hover
        groupRef.current.position.y = position[1] + Math.sin(t * 2.5) * 0.12;
        groupRef.current.rotation.y = Math.sin(t * 1.5) * 0.08;
        groupRef.current.rotation.z = Math.cos(t * 2) * 0.04;
      }
    }

    // Natural eye blink every ~3.5 seconds
    if (eyesRef.current) {
      const blinkCycle = (t % 3.5);
      const isBlinking = blinkCycle > 3.35 && blinkCycle < 3.48;
      eyesRef.current.scale.y = isBlinking ? 0.1 : 1.0;
    }
  });

  // Leg positions for 8 cute articulated legs
  const legAngles = [
    { side: -1, angle: -0.65, yOff: 0.1 },
    { side: -1, angle: -0.25, yOff: 0.05 },
    { side: -1, angle: 0.25, yOff: 0.05 },
    { side: -1, angle: 0.65, yOff: 0.1 },
    { side: 1, angle: -0.65, yOff: 0.1 },
    { side: 1, angle: -0.25, yOff: 0.05 },
    { side: 1, angle: 0.25, yOff: 0.05 },
    { side: 1, angle: 0.65, yOff: 0.1 },
  ];

  return (
    <group ref={groupRef} position={position} scale={[1.1, 1.1, 1.1]}>
      {/* 1. Main Plump Cute Body */}
      <mesh ref={bodyRef} castShadow receiveShadow position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.72, 32, 32]} />
        <meshStandardMaterial
          color="#8b5cf6"
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* 2. Soft Cheerful Tummy Patch */}
      <mesh position={[0, 0.35, 0.45]} rotation={[-0.2, 0, 0]}>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshStandardMaterial
          color="#c4b5fd"
          roughness={0.6}
        />
      </mesh>

      {/* 3. Friendly Cute Eyes with Blinking scale */}
      <group ref={eyesRef} position={[0, 0.55, 0.62]}>
        {/* Left Eye */}
        <group position={[-0.22, 0, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.2, 24, 24]} />
            <meshStandardMaterial color="#ffffff" roughness={0.1} />
          </mesh>
          {/* Pupil */}
          <mesh position={[0, 0, 0.15]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.1} />
          </mesh>
          {/* Eye Sparkle */}
          <mesh position={[0.04, 0.04, 0.22]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>

        {/* Right Eye */}
        <group position={[0.22, 0, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.2, 24, 24]} />
            <meshStandardMaterial color="#ffffff" roughness={0.1} />
          </mesh>
          {/* Pupil */}
          <mesh position={[0, 0, 0.15]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.1} />
          </mesh>
          {/* Eye Sparkle */}
          <mesh position={[0.04, 0.04, 0.22]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      </group>

      {/* 4. Rosy Cheerful Cheeks */}
      <mesh position={[-0.42, 0.38, 0.48]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color="#f472b6" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0.42, 0.38, 0.48]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color="#f472b6" transparent opacity={0.6} />
      </mesh>

      {/* 5. Cheerful Smile */}
      <mesh position={[0, 0.28, 0.65]} rotation={[0.2, 0, 0]}>
        <torusGeometry args={[0.11, 0.024, 12, 24, Math.PI]} />
        <meshBasicMaterial color="#312e81" />
      </mesh>

      {/* 6. Eight Articulated Legs with Colorful Sneakers */}
      {legAngles.map((leg, i) => {
        const xSign = leg.side;
        const baseAngle = leg.angle;
        return (
          <group
            key={i}
            position={[xSign * 0.55, 0.35 + leg.yOff, 0]}
            rotation={[0, baseAngle, xSign * -0.2]}
          >
            {/* Upper Leg Strand */}
            <mesh position={[xSign * 0.25, 0.2, 0]} rotation={[0, 0, xSign * -0.7]}>
              <cylinderGeometry args={[0.045, 0.05, 0.55, 12]} />
              <meshStandardMaterial color="#7c3aed" roughness={0.5} />
            </mesh>
            {/* Lower Leg Strand */}
            <mesh position={[xSign * 0.55, -0.05, 0]} rotation={[0, 0, xSign * 0.6]}>
              <cylinderGeometry args={[0.035, 0.045, 0.6, 12]} />
              <meshStandardMaterial color="#6d28d9" roughness={0.5} />
            </mesh>
            {/* Cute Yellow Sneaker Shoe */}
            <mesh position={[xSign * 0.72, -0.32, 0.05]} castShadow>
              <capsuleGeometry args={[0.075, 0.14, 8, 12]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? '#facc15' : '#38bdf8'}
                roughness={0.3}
              />
            </mesh>
          </group>
        );
      })}

      {/* 7. Golden Silk Thread Anchor from Spinneret */}
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 2.0, 8]} />
        <meshBasicMaterial color="#fef08a" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}
