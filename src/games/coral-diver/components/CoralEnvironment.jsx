import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function CoralEnvironment() {
  const seaweedRef = useRef([]);
  const bubblesRef = useRef();
  const fishSchoolRef = useRef();
  const jellyfishRef = useRef();

  // Procedural coral formations
  const corals = useMemo(() => {
    return [
      // Sponges and corals scattered on seabed
      { type: 'sponge', pos: [-8, 0, -6], color: '#f59e0b', scale: 1.2 },
      { type: 'sponge', pos: [9, 0, -8], color: '#e11d48', scale: 1.4 },
      { type: 'sponge', pos: [-12, 0, 4], color: '#8b5cf6', scale: 1.1 },
      { type: 'fan', pos: [-6, 0, 6], color: '#ec4899', scale: 1.3 },
      { type: 'fan', pos: [7, 0, 5], color: '#06b6d4', scale: 1.5 },
      { type: 'fan', pos: [11, 0, -3], color: '#10b981', scale: 1.2 },
      { type: 'rock', pos: [-5, 0, -4], color: '#475569', scale: [2, 1.2, 2] },
      { type: 'rock', pos: [6, 0, -5], color: '#334155', scale: [2.2, 1.5, 1.8] },
      { type: 'rock', pos: [0, 0, -12], color: '#475569', scale: [3.5, 2.0, 2.5] },
    ];
  }, []);

  // Procedural rising bubble positions
  const bubblePositions = useMemo(() => {
    const pos = [];
    for (let i = 0; i < 40; i++) {
      pos.push((Math.random() - 0.5) * 30);
      pos.push(Math.random() * 15);
      pos.push((Math.random() - 0.5) * 30);
    }
    return new Float32Array(pos);
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Sway seaweed
    seaweedRef.current.forEach((mesh, idx) => {
      if (mesh) {
        mesh.rotation.z = Math.sin(t * 2 + idx) * 0.15;
      }
    });

    // Swim fish school in an elliptical circle
    if (fishSchoolRef.current) {
      const radiusX = 14;
      const radiusZ = 10;
      fishSchoolRef.current.position.x = Math.sin(t * 0.6) * radiusX;
      fishSchoolRef.current.position.z = -5 + Math.cos(t * 0.6) * radiusZ;
      fishSchoolRef.current.rotation.y = t * 0.6 + Math.PI / 2;
    }

    // Pulse jellyfish
    if (jellyfishRef.current) {
      jellyfishRef.current.position.y = 3.5 + Math.sin(t * 1.5) * 1.2;
      jellyfishRef.current.scale.y = 1 + Math.sin(t * 3) * 0.18;
    }

    // Rise bubbles
    if (bubblesRef.current) {
      const positions = bubblesRef.current.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += delta * 2.5;
        if (positions[i] > 16) {
          positions[i] = 0;
        }
      }
      bubblesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* 1. Deep Ocean Sky Dome */}
      <mesh>
        <sphereGeometry args={[70, 24, 24]} />
        <meshBasicMaterial color="#0369a1" side={1} />
      </mesh>

      {/* 2. Sandy Ocean Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <planeGeometry args={[90, 90, 32, 32]} />
        <meshStandardMaterial color="#ca8a04" roughness={0.9} />
      </mesh>

      {/* 3. Corals and Rocks */}
      {corals.map((coral, idx) => {
        if (coral.type === 'sponge') {
          return (
            <group key={`coral-${idx}`} position={coral.pos} scale={coral.scale}>
              <mesh position={[0, 0.8, 0]}>
                <cylinderGeometry args={[0.35, 0.25, 1.6, 12, 1, true]} />
                <meshStandardMaterial
                  color={coral.color}
                  roughness={0.6}
                  emissive={coral.color}
                  emissiveIntensity={0.25}
                  side={2}
                />
              </mesh>
            </group>
          );
        }
        if (coral.type === 'fan') {
          return (
            <group
              key={`coral-${idx}`}
              position={coral.pos}
              scale={coral.scale}
              ref={(el) => (seaweedRef.current[idx] = el)}
            >
              <mesh position={[0, 1.2, 0]}>
                <cylinderGeometry args={[0.08, 0.12, 2.4, 8]} />
                <meshStandardMaterial color={coral.color} roughness={0.5} />
              </mesh>
              <mesh position={[0.4, 1.6, 0]} rotation={[0, 0, 0.4]}>
                <cylinderGeometry args={[0.06, 0.08, 1.4, 8]} />
                <meshStandardMaterial color={coral.color} roughness={0.5} />
              </mesh>
              <mesh position={[-0.4, 1.4, 0]} rotation={[0, 0, -0.4]}>
                <cylinderGeometry args={[0.06, 0.08, 1.2, 8]} />
                <meshStandardMaterial color={coral.color} roughness={0.5} />
              </mesh>
            </group>
          );
        }
        return (
          <mesh key={`coral-${idx}`} position={coral.pos} scale={coral.scale}>
            <dodecahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={coral.color} roughness={0.9} />
          </mesh>
        );
      })}

      {/* 4. Rising Underwater Bubbles */}
      <points ref={bubblesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={bubblePositions.length / 3}
            array={bubblePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial color="#bae6fd" size={0.35} transparent opacity={0.65} sizeAttenuation />
      </points>

      {/* 5. Sunken Atlantis Ancient Marble Pillars (Right Horizon) */}
      <group position={[14, 0, -10]}>
        {/* Tall Ancient Column */}
        <mesh position={[0, 4.5, 0]}>
          <cylinderGeometry args={[0.9, 1.1, 9, 16]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        </mesh>
        {/* Column Capital */}
        <mesh position={[0, 9.2, 0]}>
          <boxGeometry args={[2.5, 0.6, 2.5]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
        </mesh>
        {/* Broken Fallen Column */}
        <mesh position={[-3.5, 0.8, 2]} rotation={[0, 0.3, Math.PI / 2.2]}>
          <cylinderGeometry args={[0.85, 0.85, 5, 12]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.8} />
        </mesh>
      </group>

      {/* 6. Sunken Pirate Treasure Chest (Left Foreground) */}
      <group position={[-6.5, 0.4, 2]} rotation={[0, 0.5, 0]}>
        {/* Chest Base */}
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[1.5, 0.7, 1.1]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        {/* Chest Rounded Lid slightly opened */}
        <mesh position={[0, 0.8, -0.2]} rotation={[-0.35, 0, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 1.5, 16, 1, false, 0, Math.PI]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#92400e" roughness={0.7} />
        </mesh>
        {/* Gold Trim */}
        <mesh position={[0, 0.6, 0.35]}>
          <boxGeometry args={[0.3, 0.3, 0.1]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Glowing Gold Coins Inside */}
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[1.1, 0.2, 0.8]} />
          <meshStandardMaterial color="#fde047" emissive="#f59e0b" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* 7. Animated Swimming Fish School */}
      <group ref={fishSchoolRef} position={[0, 4, -5]}>
        {[
          [-0.8, 0, 0],
          [0.8, 0.4, -0.6],
          [0, -0.3, 0.6],
          [-1.2, 0.2, -0.4],
          [1.0, -0.2, 0.3],
        ].map((fPos, idx) => (
          <group key={`fish-${idx}`} position={fPos}>
            {/* Fish Body */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.18, 0.65, 8]} />
              <meshStandardMaterial color={idx % 2 === 0 ? '#f97316' : '#38bdf8'} />
            </mesh>
            {/* White Clownfish Stripe */}
            <mesh position={[0, 0, 0.05]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.18, 0.18, 0.1, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Tail Fin */}
            <mesh position={[0, 0, -0.38]} rotation={[0, 0, 0]}>
              <coneGeometry args={[0.18, 0.3, 3]} />
              <meshStandardMaterial color={idx % 2 === 0 ? '#fbbf24' : '#67e8f9'} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 8. Bioluminescent Pulsing Jellyfish */}
      <group ref={jellyfishRef} position={[-8, 4, -8]}>
        {/* Jellyfish Bell */}
        <mesh>
          <sphereGeometry args={[1.0, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#ec4899"
            emissive="#f472b6"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
            roughness={0.2}
          />
        </mesh>
        {/* Trailing Tentacles */}
        {[-0.3, 0, 0.3].map((tx, idx) => (
          <mesh key={`tentacle-${idx}`} position={[tx, -1.0, 0]}>
            <cylinderGeometry args={[0.04, 0.02, 2.0, 6]} />
            <meshBasicMaterial color="#f472b6" transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
