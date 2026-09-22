import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function BouncyBunny({ currentPos = [0, 2, 0], isJumping = false }) {
  const bunnyGroup = useRef();
  const earLeftRef = useRef();
  const earRightRef = useRef();

  useFrame((state, delta) => {
    if (!bunnyGroup.current) return;

    // Smooth movement towards current target platform
    bunnyGroup.current.position.x = THREE.MathUtils.lerp(
      bunnyGroup.current.position.x,
      currentPos[0],
      0.15
    );
    bunnyGroup.current.position.y = THREE.MathUtils.lerp(
      bunnyGroup.current.position.y,
      currentPos[1] + 1.2,
      0.15
    );
    bunnyGroup.current.position.z = THREE.MathUtils.lerp(
      bunnyGroup.current.position.z,
      currentPos[2],
      0.15
    );

    // Ear flop animation
    const earFlop = Math.sin(state.clock.elapsedTime * 8) * 0.15;
    if (earLeftRef.current) earLeftRef.current.rotation.z = -0.15 + earFlop;
    if (earRightRef.current) earRightRef.current.rotation.z = 0.15 - earFlop;
  });

  return (
    <group ref={bunnyGroup} position={[currentPos[0], currentPos[1] + 1.2, currentPos[2]]}>
      {/* 1. Fluffy Bunny Body */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.65, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>

      {/* 2. Head */}
      <mesh position={[0, 0.7, 0.1]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>

      {/* 3. Ears */}
      <group ref={earLeftRef} position={[-0.25, 1.2, 0.1]}>
        <mesh>
          <cylinderGeometry args={[0.1, 0.08, 0.7, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <cylinderGeometry args={[0.06, 0.05, 0.5, 8]} />
          <meshStandardMaterial color="#f472b6" />
        </mesh>
      </group>

      <group ref={earRightRef} position={[0.25, 1.2, 0.1]}>
        <mesh>
          <cylinderGeometry args={[0.1, 0.08, 0.7, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <cylinderGeometry args={[0.06, 0.05, 0.5, 8]} />
          <meshStandardMaterial color="#f472b6" />
        </mesh>
      </group>

      {/* 4. Nose */}
      <mesh position={[0, 0.65, 0.58]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#fb7185" />
      </mesh>

      {/* 5. Eyes */}
      <mesh position={[-0.18, 0.8, 0.52]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.18, 0.8, 0.52]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* 6. Fluffy Tail */}
      <mesh position={[0, -0.1, -0.6]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
    </group>
  );
}
