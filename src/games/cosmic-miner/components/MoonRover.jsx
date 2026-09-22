import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function MoonRover({ targetPos, onReachTarget }) {
  const roverGroup = useRef();
  const antennaRef = useRef();

  // Position & movement state
  const currentPos = useRef(new THREE.Vector3(0, 0.4, 2));
  const targetVec = useRef(new THREE.Vector3(0, 0.4, 2));
  const keysPressed = useRef({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Update target when passed from parent (e.g. crystal clicked)
  useEffect(() => {
    if (targetPos) {
      targetVec.current.set(targetPos[0], 0.4, targetPos[2]);
    }
  }, [targetPos]);

  useFrame((state, delta) => {
    if (!roverGroup.current) return;

    let moveX = 0;
    let moveZ = 0;
    const speed = 7.5 * delta;

    // Manual keyboard drive
    if (keysPressed.current['arrowup'] || keysPressed.current['w']) moveZ -= 1;
    if (keysPressed.current['arrowdown'] || keysPressed.current['s']) moveZ += 1;
    if (keysPressed.current['arrowleft'] || keysPressed.current['a']) moveX -= 1;
    if (keysPressed.current['arrowright'] || keysPressed.current['d']) moveX += 1;

    if (moveX !== 0 || moveZ !== 0) {
      const len = Math.hypot(moveX, moveZ);
      currentPos.current.x += (moveX / len) * speed;
      currentPos.current.z += (moveZ / len) * speed;
      targetVec.current.copy(currentPos.current);

      const targetAngle = Math.atan2(moveX, moveZ);
      roverGroup.current.rotation.y = THREE.MathUtils.lerp(
        roverGroup.current.rotation.y,
        targetAngle,
        0.15
      );
    } else if (targetVec.current.distanceTo(currentPos.current) > 0.3) {
      // Auto-drive towards clicked crystal
      const diff = new THREE.Vector3().subVectors(targetVec.current, currentPos.current);
      diff.y = 0;
      const dist = diff.length();

      if (dist > 0.2) {
        diff.normalize();
        currentPos.current.addScaledVector(diff, Math.min(dist, speed));

        const targetAngle = Math.atan2(diff.x, diff.z);
        roverGroup.current.rotation.y = THREE.MathUtils.lerp(
          roverGroup.current.rotation.y,
          targetAngle,
          0.18
        );
      } else if (onReachTarget) {
        onReachTarget();
      }
    }

    // Low-gravity suspension bobbing
    const bob = Math.sin(state.clock.elapsedTime * 6) * 0.03;
    roverGroup.current.position.set(
      currentPos.current.x,
      0.4 + bob,
      currentPos.current.z
    );

    // Antenna wobble
    if (antennaRef.current) {
      antennaRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 4) * 0.15;
    }
  });

  return (
    <group ref={roverGroup} position={[0, 0.4, 2]}>
      {/* 1. Main Rover Body */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.5, 0.6, 2.2]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* 2. Front Hood Stripe */}
      <mesh position={[0, 0.71, 0.4]}>
        <boxGeometry args={[1.1, 0.02, 1.1]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* 3. Glass Bubble Cockpit */}
      <mesh position={[0, 0.85, 0.2]}>
        <sphereGeometry args={[0.55, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* 4. Antenna */}
      <group ref={antennaRef} position={[0.5, 0.7, -0.6]}>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.85, 0]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* 5. 6 Lunar Wheels */}
      {/* Left Wheels */}
      {[-0.7, 0, 0.7].map((z, i) => (
        <mesh
          key={`wl-${i}`}
          position={[-0.9, 0.1, z]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.3, 0.3, 0.25, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
      ))}
      {/* Right Wheels */}
      {[-0.7, 0, 0.7].map((z, i) => (
        <mesh
          key={`wr-${i}`}
          position={[0.9, 0.1, z]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.3, 0.3, 0.25, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
      ))}

      {/* 6. Front Headlights */}
      <mesh position={[-0.45, 0.4, 1.15]}>
        <cylinderGeometry args={[0.12, 0.12, 0.1, 12]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.45, 0.4, 1.15]}>
        <cylinderGeometry args={[0.12, 0.12, 0.1, 12]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}
