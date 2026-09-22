import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * CobwebEnvironment.jsx
 * Enchanted moonlit forest grove with glistening geometric silk spiderweb,
 * mossy wood frame, and bioluminescent fairy mushrooms.
 */
export default function CobwebEnvironment() {
  // Generate radial web lines and concentric spiral polygons
  const { radialLines, concentricRings, dewdrops } = useMemo(() => {
    const rads = [];
    const rings = [];
    const drops = [];
    const SPOKES = 12;
    const MAX_R = 4.8;
    const RING_COUNT = 5;

    // Radial spokes radiating from center
    for (let i = 0; i < SPOKES; i++) {
      const angle = (i / SPOKES) * Math.PI * 2;
      const x = Math.cos(angle) * MAX_R;
      const y = Math.sin(angle) * MAX_R + 1.2;
      rads.push({
        start: [0, 1.2, -0.2],
        end: [x, y, -0.2],
      });
    }

    // Concentric spiral rings
    for (let r = 1; r <= RING_COUNT; r++) {
      const radius = (r / RING_COUNT) * MAX_R;
      const points = [];
      for (let i = 0; i <= SPOKES; i++) {
        const angle = ((i % SPOKES) / SPOKES) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius + 1.2;
        points.push(new THREE.Vector3(x, y, -0.2));

        if (r > 1 && i < SPOKES && (i + r) % 2 === 0) {
          drops.push([x, y, -0.18]);
        }
      }
      rings.push(new THREE.BufferGeometry().setFromPoints(points));
    }

    return { radialLines: rads, concentricRings: rings, dewdrops: drops };
  }, []);

  return (
    <group>
      {/* 1. Distant Moon / Twilight Glow */}
      <mesh position={[0, 7.5, -9]}>
        <circleGeometry args={[3.2, 32]} />
        <meshBasicMaterial color="#fef08a" transparent opacity={0.35} />
      </mesh>

      {/* 2. Mossy Forest Wooden Frame */}
      <group position={[0, 1.2, -0.4]}>
        {/* Left Tree Trunk */}
        <mesh position={[-5.4, 0, 0]} rotation={[0, 0, -0.05]}>
          <cylinderGeometry args={[0.55, 0.7, 10, 16]} />
          <meshStandardMaterial color="#292524" roughness={0.9} />
        </mesh>
        {/* Right Tree Trunk */}
        <mesh position={[5.4, 0, 0]} rotation={[0, 0, 0.05]}>
          <cylinderGeometry args={[0.55, 0.7, 10, 16]} />
          <meshStandardMaterial color="#292524" roughness={0.9} />
        </mesh>
        {/* Top Arching Branch */}
        <mesh position={[0, 5.0, 0]} rotation={[0, 0, 1.57]}>
          <cylinderGeometry args={[0.35, 0.45, 11, 16]} />
          <meshStandardMaterial color="#1c1917" roughness={0.9} />
        </mesh>
      </group>

      {/* 3. Concentric Silk Rings */}
      {concentricRings.map((geo, idx) => (
        <lineLoop key={`ring-${idx}`} geometry={geo}>
          <lineBasicMaterial color="#e0e7ff" transparent opacity={0.55} linewidth={2} />
        </lineLoop>
      ))}

      {/* 4. Radial Silk Spokes */}
      {radialLines.map((line, idx) => {
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(...line.start),
          new THREE.Vector3(...line.end),
        ]);
        return (
          <line key={`spoke-${idx}`} geometry={geo}>
            <lineBasicMaterial color="#e0e7ff" transparent opacity={0.45} linewidth={2} />
          </line>
        );
      })}

      {/* 5. Glistening Dewdrops on the Web */}
      {dewdrops.map((pos, idx) => (
        <mesh key={`dew-${idx}`} position={pos}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} />
        </mesh>
      ))}

      {/* 6. Glowing Bioluminescent Fairy Mushrooms */}
      <group position={[-4.2, -2.8, 0]}>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.08, 0.12, 0.7, 8]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <sphereGeometry args={[0.32, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color="#ec4899" emissive="#db2777" emissiveIntensity={0.6} roughness={0.3} />
        </mesh>
      </group>

      <group position={[4.2, -2.8, 0]}>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.08, 0.12, 0.7, 8]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <sphereGeometry args={[0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color="#a855f7" emissive="#9333ea" emissiveIntensity={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* 7. Forest Floor */}
      <mesh position={[0, -3.2, 0]} rotation={[-1.57, 0, 0]}>
        <planeGeometry args={[18, 14]} />
        <meshStandardMaterial color="#064e3b" roughness={0.9} />
      </mesh>
    </group>
  );
}
