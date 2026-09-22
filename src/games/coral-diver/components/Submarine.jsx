import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Submarine({ targetPos, onReachTarget }) {
  const subGroup = useRef();
  const propRef = useRef();

  const currentPos = useRef(new THREE.Vector3(0, 3, 2));
  const targetVec = useRef(new THREE.Vector3(0, 3, 2));
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

  useEffect(() => {
    if (targetPos) {
      targetVec.current.set(targetPos[0], targetPos[1], targetPos[2]);
    }
  }, [targetPos]);

  useFrame((state, delta) => {
    if (!subGroup.current) return;

    // Propeller spin
    if (propRef.current) {
      propRef.current.rotation.z += delta * 20;
    }

    let moveX = 0;
    let moveY = 0;
    let moveZ = 0;
    const speed = 7.0 * delta;

    // Controls
    if (keysPressed.current['arrowup'] || keysPressed.current['w']) moveZ -= 1;
    if (keysPressed.current['arrowdown'] || keysPressed.current['s']) moveZ += 1;
    if (keysPressed.current['arrowleft'] || keysPressed.current['a']) moveX -= 1;
    if (keysPressed.current['arrowright'] || keysPressed.current['d']) moveX += 1;
    if (keysPressed.current['e'] || keysPressed.current[' ']) moveY += 0.8;
    if (keysPressed.current['q'] || keysPressed.current['shift']) moveY -= 0.8;

    if (moveX !== 0 || moveY !== 0 || moveZ !== 0) {
      const len = Math.hypot(moveX, moveY, moveZ);
      currentPos.current.x += (moveX / len) * speed;
      currentPos.current.y = Math.max(1.0, Math.min(8.0, currentPos.current.y + (moveY / len) * speed));
      currentPos.current.z += (moveZ / len) * speed;
      targetVec.current.copy(currentPos.current);

      const targetAngle = Math.atan2(moveX, moveZ);
      subGroup.current.rotation.y = THREE.MathUtils.lerp(
        subGroup.current.rotation.y,
        targetAngle,
        0.12
      );
    } else if (targetVec.current.distanceTo(currentPos.current) > 0.4) {
      const diff = new THREE.Vector3().subVectors(targetVec.current, currentPos.current);
      const dist = diff.length();

      if (dist > 0.3) {
        diff.normalize();
        currentPos.current.addScaledVector(diff, Math.min(dist, speed));

        const targetAngle = Math.atan2(diff.x, diff.z);
        subGroup.current.rotation.y = THREE.MathUtils.lerp(
          subGroup.current.rotation.y,
          targetAngle,
          0.15
        );
      } else if (onReachTarget) {
        onReachTarget();
      }
    }

    // Gentle buoyancy bobbing & pitch
    const bob = Math.sin(state.clock.elapsedTime * 2.5) * 0.12;
    const tilt = Math.sin(state.clock.elapsedTime * 1.8) * 0.04;
    subGroup.current.position.set(
      currentPos.current.x,
      currentPos.current.y + bob,
      currentPos.current.z
    );
    subGroup.current.rotation.x = tilt;
  });

  return (
    <group ref={subGroup} position={[0, 3, 2]}>
      {/* 1. Main Yellow Hull */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 2.8, 24]} />
        <meshStandardMaterial color="#facc15" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Front Nose Dome */}
      <mesh position={[0, 0, 1.4]}>
        <sphereGeometry args={[0.9, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#facc15" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Rear Tail Dome */}
      <mesh position={[0, 0, -1.4]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[0.9, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* 2. Front Large Bubble Observation Port */}
      <mesh position={[0, 0.2, 1.8]}>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* 3. Conning Tower / Periscope */}
      <group position={[0, 1.1, 0]}>
        <mesh>
          <cylinderGeometry args={[0.35, 0.45, 0.6, 16]} />
          <meshStandardMaterial color="#ca8a04" />
        </mesh>
        {/* Periscope Tube */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.5, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        {/* Periscope Lens */}
        <mesh position={[0, 0.72, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.18, 8]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* 4. Side Dive Fins */}
      <mesh position={[-1.2, 0, 0.2]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.7, 0.08, 0.5]} />
        <meshStandardMaterial color="#eab308" />
      </mesh>
      <mesh position={[1.2, 0, 0.2]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.7, 0.08, 0.5]} />
        <meshStandardMaterial color="#eab308" />
      </mesh>

      {/* 5. Propeller at Rear */}
      <group position={[0, 0, -1.95]}>
        <mesh>
          <cylinderGeometry args={[0.15, 0.15, 0.2, 8]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#334155" metalness={0.9} />
        </mesh>
        <group ref={propRef}>
          <mesh rotation={[0, 0, 0]}>
            <boxGeometry args={[0.9, 0.12, 0.04]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.9, 0.12, 0.04]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
        </group>
      </group>

      {/* 6. Front Searchlight */}
      <mesh position={[0, -0.4, 1.7]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.15, 12]} />
        <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}
