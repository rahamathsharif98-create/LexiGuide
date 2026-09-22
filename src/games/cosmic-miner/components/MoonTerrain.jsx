import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function MoonTerrain({ rocketLaunched = false }) {
  const radarRef = useRef();
  const beaconRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (radarRef.current) {
      radarRef.current.rotation.y = t * 1.2;
    }
    if (beaconRef.current) {
      beaconRef.current.material.opacity = 0.5 + Math.sin(t * 5) * 0.5;
    }
  });

  // Generate procedural lunar rocks and craters
  const rocks = useMemo(() => {
    return [
      { pos: [-12, 0.4, -8], scale: [1.8, 1.2, 1.5], color: '#64748b' },
      { pos: [14, 0.5, -12], scale: [2.2, 1.6, 2.0], color: '#475569' },
      { pos: [-16, 0.6, 10], scale: [2.5, 1.4, 1.9], color: '#64748b' },
      { pos: [18, 0.5, 14], scale: [1.9, 1.5, 1.7], color: '#334155' },
      { pos: [0, 0.3, -20], scale: [3.0, 1.8, 2.4], color: '#475569' },
      { pos: [-8, 0.3, 16], scale: [1.5, 1.0, 1.2], color: '#64748b' },
      { pos: [9, 0.3, 6], scale: [1.3, 0.9, 1.1], color: '#334155' },
    ];
  }, []);

  const craters = useMemo(() => {
    return [
      { pos: [-6, 0.05, -5], radius: 2.8 },
      { pos: [7, 0.05, -7], radius: 3.2 },
      { pos: [-10, 0.05, 6], radius: 2.2 },
      { pos: [11, 0.05, 8], radius: 2.6 },
    ];
  }, []);

  return (
    <group>
      {/* 1. Deep Space Sky Dome */}
      <mesh>
        <sphereGeometry args={[80, 24, 24]} />
        <meshBasicMaterial color="#050814" side={1} />
      </mesh>

      {/* 2. Distant Earth in Sky */}
      <group position={[34, 26, -45]}>
        <mesh>
          <sphereGeometry args={[4.2, 32, 32]} />
          <meshStandardMaterial
            color="#2563eb"
            emissive="#1d4ed8"
            emissiveIntensity={0.4}
            roughness={0.7}
          />
        </mesh>
        {/* Atmosphere glow */}
        <mesh scale={1.08}>
          <sphereGeometry args={[4.2, 16, 16]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.25} side={1} />
        </mesh>
      </group>

      {/* 2b. Ringed Saturn Planet in Sky */}
      <group position={[-38, 28, -50]} rotation={[0.4, 0.2, -0.3]}>
        <mesh>
          <sphereGeometry args={[4.8, 32, 32]} />
          <meshStandardMaterial color="#fde047" roughness={0.6} />
        </mesh>
        {/* Rings */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[6.2, 10.5, 32]} />
          <meshStandardMaterial color="#ca8a04" transparent opacity={0.75} side={2} />
        </mesh>
      </group>

      {/* 3. Glowing Nebula Starfield particles */}
      <points>
        <sphereGeometry args={[75, 40, 40]} />
        <pointsMaterial color="#a5b4fc" size={0.3} sizeAttenuation />
      </points>

      {/* 3b. Futuristic Lunar Research Base Station (Left Horizon) */}
      <group position={[-16, 0, -12]}>
        {/* Main Geodesic Dome */}
        <mesh position={[0, 2.8, 0]}>
          <sphereGeometry args={[3.8, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Dome Glass Ring */}
        <mesh position={[0, 1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.2, 0.2, 8, 24]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        {/* Cylindrical Airlock Entrance */}
        <mesh position={[2.8, 0.8, 1.8]} rotation={[0, 0.6, 0]}>
          <boxGeometry args={[1.5, 1.6, 2.2]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>
        {/* Airlock Glowing Frame */}
        <mesh position={[3.6, 0.8, 2.3]} rotation={[0, 0.6, 0]}>
          <boxGeometry args={[0.2, 1.4, 1.2]} />
          <meshBasicMaterial color="#34d399" />
        </mesh>
        {/* Radar Tower */}
        <mesh position={[-2.5, 2.5, -1]}>
          <cylinderGeometry args={[0.15, 0.25, 5, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        {/* Spinning Radar Dish */}
        <group ref={radarRef} position={[-2.5, 5.2, -1]}>
          <mesh rotation={[0.4, 0, 0]}>
            <coneGeometry args={[1.2, 0.5, 16, 1, true]} />
            <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.2} side={2} />
          </mesh>
          <mesh position={[0, 0.3, 0.2]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial ref={beaconRef} color="#ef4444" transparent opacity={0.9} />
          </mesh>
        </group>
      </group>

      {/* 4. Lunar Surface Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100, 32, 32]} />
        <meshStandardMaterial
          color="#334155"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* 5. Craters (Darker indented circular discs with rim) */}
      {craters.map((crater, idx) => (
        <group key={`crater-${idx}`} position={crater.pos}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[crater.radius * 0.75, crater.radius, 24]} />
            <meshStandardMaterial color="#1e293b" roughness={0.95} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
            <circleGeometry args={[crater.radius * 0.75, 24]} />
            <meshStandardMaterial color="#0f172a" roughness={1.0} />
          </mesh>
        </group>
      ))}

      {/* 6. Space Rocks */}
      {rocks.map((rock, idx) => (
        <mesh key={`rock-${idx}`} position={rock.pos} scale={rock.scale} castShadow>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color={rock.color}
            roughness={0.85}
            metalness={0.15}
          />
        </mesh>
      ))}

      {/* 7. Rocket Launchpad Base */}
      <group position={[0, 0, -14]}>
        {/* Launchpad circle */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <circleGeometry args={[4.2, 32]} />
          <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <ringGeometry args={[3.8, 4.2, 32]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>

        {/* Space Rocket on Pad */}
        <group position={[0, rocketLaunched ? 24 : 3.5, 0]}>
          {/* Rocket Body */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.8, 1.1, 5, 24]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.6} />
          </mesh>
          {/* Nose Cone */}
          <mesh position={[0, 3.4, 0]}>
            <coneGeometry args={[0.8, 1.8, 24]} />
            <meshStandardMaterial color="#ef4444" roughness={0.4} metalness={0.5} />
          </mesh>
          {/* Cockpit Window */}
          <mesh position={[0, 1.2, 0.82]}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.5} />
          </mesh>
          {/* Fins */}
          <mesh position={[-1.1, -1.8, 0]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.2, 1.5, 1.2]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
          <mesh position={[1.1, -1.8, 0]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.2, 1.5, 1.2]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0, -1.8, -1.1]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[1.2, 1.5, 0.2]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>

          {/* Launch Thruster Glow when launched */}
          {rocketLaunched && (
            <mesh position={[0, -3.2, 0]}>
              <coneGeometry args={[0.9, 2.5, 16]} />
              <meshBasicMaterial color="#fbbf24" transparent opacity={0.8} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
}
