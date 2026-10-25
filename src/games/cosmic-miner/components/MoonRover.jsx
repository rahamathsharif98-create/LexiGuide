import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function MoonRover({ targetPos, onReachTarget }) {
  const roverGroup = useRef();
  const antennaRef = useRef();

  // Position, velocity & orientation state
  const currentPos = useRef(new THREE.Vector3(0, 0.4, 2));
  const currentVel = useRef(new THREE.Vector2(0, 0)); // (vx, vz)
  const lookAngleRef = useRef(0);
  const keysPressed = useRef({});

  // Movement physics configuration (smooth, natural, responsive)
  // Moderately tuned: ~17% lower max speed, gentler steering, smooth accel/decel
  const MAX_SPEED = 6.2; // Reduced from 7.5 (~17.3% reduction for natural pacing)
  const ACCEL_RATE = 8.5; // Smooth ramp up to full speed (~0.14s)
  const DECEL_RATE = 12.0; // Prompt, predictable stop on key release (~0.10s) without drifting
  const TURN_RATE = 7.5; // Gentler steering response (~20% smoother turning)

  useEffect(() => {
    const handleKeyDown = (e) => {
      const k = e.key?.toLowerCase() || '';
      const c = e.code?.toLowerCase() || '';
      keysPressed.current[k] = true;
      keysPressed.current[c] = true;

      // Prevent page scrolling when child drives rover with arrow keys
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      const k = e.key?.toLowerCase() || '';
      const c = e.code?.toLowerCase() || '';
      keysPressed.current[k] = false;
      keysPressed.current[c] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // When a crystal is targeted, smoothly aim rover headlights/orientation towards it
  // WITHOUT changing the rover's position or triggering automatic driving!
  useEffect(() => {
    if (targetPos) {
      const dx = targetPos[0] - currentPos.current.x;
      const dz = targetPos[2] - currentPos.current.z;
      if (Math.hypot(dx, dz) > 0.1) {
        lookAngleRef.current = Math.atan2(dx, dz);
      }
    }
  }, [targetPos]);

  useFrame((state, delta) => {
    if (!roverGroup.current) return;

    // Clamp delta to prevent huge physics jumps on frame lag / tab blur
    const dt = Math.min(delta, 0.05);

    let moveX = 0;
    let moveZ = 0;

    // Direct responsive player drive via Arrow keys or W/A/S/D
    if (keysPressed.current['arrowup'] || keysPressed.current['w'] || keysPressed.current['keyw']) moveZ -= 1;
    if (keysPressed.current['arrowdown'] || keysPressed.current['s'] || keysPressed.current['keys']) moveZ += 1;
    if (keysPressed.current['arrowleft'] || keysPressed.current['a'] || keysPressed.current['keya']) moveX -= 1;
    if (keysPressed.current['arrowright'] || keysPressed.current['d'] || keysPressed.current['keyd']) moveX += 1;

    const hasInput = moveX !== 0 || moveZ !== 0;
    let targetVelX = 0;
    let targetVelZ = 0;

    if (hasInput) {
      // Normalize directional vector: diagonal driving moves at identical speed to straight driving
      const len = Math.hypot(moveX, moveZ);
      targetVelX = (moveX / len) * MAX_SPEED;
      targetVelZ = (moveZ / len) * MAX_SPEED;

      // Update steering target angle in direction of active movement
      lookAngleRef.current = Math.atan2(moveX, moveZ);
    }

    // Frame-rate independent smooth acceleration / deceleration
    const rate = hasInput ? ACCEL_RATE : DECEL_RATE;
    const lerpFactor = 1 - Math.exp(-rate * dt);

    currentVel.current.x = THREE.MathUtils.lerp(currentVel.current.x, targetVelX, lerpFactor);
    currentVel.current.y = THREE.MathUtils.lerp(currentVel.current.y, targetVelZ, lerpFactor);

    // Snap to 0 when velocity is negligible and no keys are pressed to prevent creeping
    if (!hasInput && currentVel.current.lengthSq() < 0.001) {
      currentVel.current.set(0, 0);
    }

    // Integrate position
    currentPos.current.x += currentVel.current.x * dt;
    currentPos.current.z += currentVel.current.y * dt;

    // Restrict rover within safe lunar playfield boundary and kill velocity on wall contact
    if (currentPos.current.x < -10) {
      currentPos.current.x = -10;
      currentVel.current.x = 0;
    } else if (currentPos.current.x > 10) {
      currentPos.current.x = 10;
      currentVel.current.x = 0;
    }

    if (currentPos.current.z < -8) {
      currentPos.current.z = -8;
      currentVel.current.y = 0;
    } else if (currentPos.current.z > 5) {
      currentPos.current.z = 5;
      currentVel.current.y = 0;
    }

    // Shortest-arc smooth angular turning (prevents 360-degree wrapping glitch)
    let angleDiff = (lookAngleRef.current - roverGroup.current.rotation.y) % (Math.PI * 2);
    if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

    const turnFactor = 1 - Math.exp(-TURN_RATE * dt);
    roverGroup.current.rotation.y += angleDiff * turnFactor;

    // Low-gravity suspension bobbing proportional to driving velocity
    const speedRatio = currentVel.current.length() / MAX_SPEED;
    const idleBob = Math.sin(state.clock.elapsedTime * 2.5) * 0.01;
    const driveBob = Math.sin(state.clock.elapsedTime * 10) * 0.025 * speedRatio;

    roverGroup.current.position.set(
      currentPos.current.x,
      0.4 + idleBob + driveBob,
      currentPos.current.z
    );

    // Antenna subtle wobble, accentuated when rover is in motion
    if (antennaRef.current) {
      antennaRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 5) * (0.08 + speedRatio * 0.12);
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
