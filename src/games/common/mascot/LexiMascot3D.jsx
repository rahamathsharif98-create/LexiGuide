import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * LexiMascot3D
 * An adorable, stylized 3D low-poly fox learning companion who lives inside the 3D worlds!
 * 
 * Features:
 * - Natural breathing, ear twitches, and tail wagging.
 * - Reactive states:
 *   - 'idle': gentle breathing, tail swish, looking towards player.
 *   - 'cheer': ecstatic jump with paws up and ears perked.
 *   - 'victory': 360-degree victory backflip and celebratory paws.
 * - Accessories: supports hats/themes (explorer hat, astronaut helmet, scuba mask, or classic fox).
 */
export default function LexiMascot3D({
  position = [2.8, 1.2, 0.5],
  rotation = [0, -0.6, 0],
  scale = 0.85,
  state = 'idle', // 'idle' | 'cheer' | 'victory'
  theme = 'classic', // 'classic' | 'explorer' | 'astronaut' | 'scuba'
}) {
  const rootRef = useRef();
  const bodyRef = useRef();
  const headRef = useRef();
  const tailRef = useRef();
  const leftEarRef = useRef();
  const rightEarRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();

  useFrame((clockState, delta) => {
    if (!rootRef.current) return;
    const t = clockState.clock.elapsedTime;

    // 1. Root & Body Motion based on State
    if (state === 'victory') {
      // 360 celebratory spin / flip
      rootRef.current.position.y = position[1] + Math.abs(Math.sin(t * 6)) * 0.8;
      rootRef.current.rotation.y = rotation[1] + t * 4;
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = -Math.PI * 0.7 + Math.sin(t * 10) * 0.3;
        rightArmRef.current.rotation.x = -Math.PI * 0.7 + Math.cos(t * 10) * 0.3;
      }
    } else if (state === 'cheer') {
      // Energetic jumping cheer
      rootRef.current.position.y = position[1] + Math.abs(Math.sin(t * 8)) * 0.5;
      rootRef.current.rotation.y = rotation[1] + Math.sin(t * 4) * 0.2;
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = -Math.PI * 0.6 + Math.sin(t * 8) * 0.3;
        rightArmRef.current.rotation.x = -Math.PI * 0.6 + Math.cos(t * 8) * 0.3;
      }
    } else {
      // Gentle Idle breathing & bounce
      rootRef.current.position.y = position[1] + Math.sin(t * 2.5) * 0.06;
      rootRef.current.rotation.y = rotation[1] + Math.sin(t * 1.2) * 0.08;
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = Math.sin(t * 2.5) * 0.15;
        rightArmRef.current.rotation.x = -Math.sin(t * 2.5) * 0.15;
      }
    }

    // 2. Tail Wagging (always expressive)
    if (tailRef.current) {
      const wagSpeed = state === 'idle' ? 3.5 : 9.0;
      const wagAngle = state === 'idle' ? 0.35 : 0.7;
      tailRef.current.rotation.y = Math.sin(t * wagSpeed) * wagAngle;
      tailRef.current.rotation.z = 0.2 + Math.cos(t * wagSpeed * 0.5) * 0.15;
    }

    // 3. Head & Ear Twitches
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 1.8) * 0.08;
      headRef.current.rotation.x = Math.cos(t * 1.5) * 0.05;
    }
    if (leftEarRef.current && rightEarRef.current) {
      leftEarRef.current.rotation.z = -0.2 + (Math.sin(t * 5) > 0.8 ? 0.15 : 0);
      rightEarRef.current.rotation.z = 0.2 - (Math.sin(t * 4.5) > 0.8 ? 0.15 : 0);
    }
  });

  const foxOrange = '#f97316';
  const foxWhite = '#fff7ed';
  const foxDark = '#1c1917';
  const foxNose = '#0f172a';

  return (
    <group ref={rootRef} position={position} rotation={rotation} scale={scale}>
      {/* --- 1. TORSO / BODY --- */}
      <group ref={bodyRef} position={[0, 0.45, 0]}>
        {/* Main Body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.55, 0.65, 0.45]} />
          <meshStandardMaterial color={foxOrange} roughness={0.6} />
        </mesh>
        {/* White Chest Fluff */}
        <mesh position={[0, 0.05, 0.23]}>
          <boxGeometry args={[0.38, 0.48, 0.04]} />
          <meshStandardMaterial color={foxWhite} roughness={0.8} />
        </mesh>
      </group>

      {/* --- 2. HEAD & FACE --- */}
      <group ref={headRef} position={[0, 0.95, 0.05]}>
        {/* Head Block */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.62, 0.52, 0.55]} />
          <meshStandardMaterial color={foxOrange} roughness={0.6} />
        </mesh>

        {/* White Cheeks */}
        <mesh position={[-0.22, -0.08, 0.24]}>
          <boxGeometry args={[0.2, 0.24, 0.1]} />
          <meshStandardMaterial color={foxWhite} roughness={0.8} />
        </mesh>
        <mesh position={[0.22, -0.08, 0.24]}>
          <boxGeometry args={[0.2, 0.24, 0.1]} />
          <meshStandardMaterial color={foxWhite} roughness={0.8} />
        </mesh>

        {/* Fox Snout */}
        <mesh position={[0, -0.1, 0.38]}>
          <coneGeometry args={[0.18, 0.32, 4]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color={foxWhite} roughness={0.7} />
        </mesh>
        {/* Black Nose Tip */}
        <mesh position={[0, -0.06, 0.54]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={foxNose} roughness={0.3} />
        </mesh>

        {/* Big Cartoon Eyes */}
        <group position={[-0.18, 0.06, 0.28]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshStandardMaterial color={foxDark} roughness={0.2} />
          {/* Eye Sparkle */}
          <mesh position={[0.03, 0.03, 0.06]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
        <group position={[0.18, 0.06, 0.28]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshStandardMaterial color={foxDark} roughness={0.2} />
          {/* Eye Sparkle */}
          <mesh position={[0.03, 0.03, 0.06]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>

        {/* Cute Pointy Ears */}
        <group ref={leftEarRef} position={[-0.26, 0.34, 0]}>
          <mesh position={[0, 0.14, 0]}>
            <coneGeometry args={[0.14, 0.35, 4]} />
            <meshStandardMaterial color={foxOrange} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.12, 0.04]}>
            <coneGeometry args={[0.09, 0.24, 4]} />
            <meshStandardMaterial color={foxWhite} roughness={0.8} />
          </mesh>
        </group>

        <group ref={rightEarRef} position={[0.26, 0.34, 0]}>
          <mesh position={[0, 0.14, 0]}>
            <coneGeometry args={[0.14, 0.35, 4]} />
            <meshStandardMaterial color={foxOrange} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.12, 0.04]}>
            <coneGeometry args={[0.09, 0.24, 4]} />
            <meshStandardMaterial color={foxWhite} roughness={0.8} />
          </mesh>
        </group>

        {/* --- Theme Specific Headgear --- */}
        {theme === 'explorer' && (
          // Safari Pith / Excavation Explorer Hat
          <group position={[0, 0.32, 0]}>
            <mesh position={[0, 0.08, 0]}>
              <cylinderGeometry args={[0.25, 0.32, 0.18, 12]} />
              <meshStandardMaterial color="#ca8a04" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.01, 0]}>
              <cylinderGeometry args={[0.45, 0.45, 0.04, 16]} />
              <meshStandardMaterial color="#ca8a04" roughness={0.7} />
            </mesh>
          </group>
        )}

        {theme === 'astronaut' && (
          // Glass Astro Bubble Helmet
          <mesh position={[0, 0.02, 0.05]}>
            <sphereGeometry args={[0.48, 16, 16]} />
            <meshStandardMaterial
              color="#38bdf8"
              transparent
              opacity={0.35}
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>
        )}

        {theme === 'scuba' && (
          // Scuba Goggles & Snorkel
          <group position={[0, 0.05, 0.32]}>
            <mesh>
              <boxGeometry args={[0.5, 0.18, 0.08]} />
              <meshStandardMaterial color="#06b6d4" transparent opacity={0.6} metalness={0.8} />
            </mesh>
            <mesh position={[0.28, 0.18, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.45, 8]} />
              <meshStandardMaterial color="#eab308" />
            </mesh>
          </group>
        )}
      </group>

      {/* --- 3. ARMS / PAWS --- */}
      <group ref={leftArmRef} position={[-0.34, 0.55, 0.08]}>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.16, 0.35, 0.16]} />
          <meshStandardMaterial color={foxOrange} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.32, 0]}>
          <boxGeometry args={[0.17, 0.08, 0.17]} />
          <meshStandardMaterial color={foxWhite} roughness={0.8} />
        </mesh>
      </group>

      <group ref={rightArmRef} position={[0.34, 0.55, 0.08]}>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.16, 0.35, 0.16]} />
          <meshStandardMaterial color={foxOrange} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.32, 0]}>
          <boxGeometry args={[0.17, 0.08, 0.17]} />
          <meshStandardMaterial color={foxWhite} roughness={0.8} />
        </mesh>
      </group>

      {/* --- 4. LEGS / FEET --- */}
      <mesh position={[-0.18, 0.15, 0]}>
        <boxGeometry args={[0.18, 0.3, 0.2]} />
        <meshStandardMaterial color={foxDark} roughness={0.8} />
      </mesh>
      <mesh position={[0.18, 0.15, 0]}>
        <boxGeometry args={[0.18, 0.3, 0.2]} />
        <meshStandardMaterial color={foxDark} roughness={0.8} />
      </mesh>

      {/* --- 5. BIG BUSHY FOX TAIL --- */}
      <group ref={tailRef} position={[0, 0.3, -0.22]}>
        {/* Tail Base */}
        <mesh position={[0, 0.18, -0.22]} rotation={[-0.5, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.08, 0.45, 8]} />
          <meshStandardMaterial color={foxOrange} roughness={0.7} />
        </mesh>
        {/* White Tail Tip */}
        <mesh position={[0, 0.44, -0.36]} rotation={[-0.5, 0, 0]}>
          <coneGeometry args={[0.18, 0.3, 8]} />
          <meshStandardMaterial color={foxWhite} roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
