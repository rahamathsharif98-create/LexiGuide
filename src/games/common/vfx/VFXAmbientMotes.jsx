import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * VFXAmbientMotes
 * Continuous 3D ambient particle system creating rich atmosphere:
 * - 'stardust': Twinkling stars and nebular cosmic specks (Cosmic Miner)
 * - 'bubbles': Translucent rising bubbles with natural wobble (Coral Diver)
 * - 'fireflies': Gentle glowing golden fireflies drifting through air (Safari, Forest)
 * - 'embers': Rising fiery sparks with upward draft (Ancient Labyrinth)
 * - 'sparkles': Playful swirling fairy dust (Voxel Crafter, Magic Bakery, Cloud Bouncer)
 */
export default function VFXAmbientMotes({
  mode = 'sparkles',
  count = 45,
  area = [12, 8, 12],
  center = [0, 2, 0],
}) {
  const groupRef = useRef();

  const config = useMemo(() => {
    switch (mode) {
      case 'stardust':
        return {
          color: '#38bdf8',
          emissive: '#818cf8',
          size: 0.08,
          speed: 0.3,
          isRising: false,
          geom: 'octahedron',
        };
      case 'bubbles':
        return {
          color: '#67e8f9',
          emissive: '#06b6d4',
          size: 0.16,
          speed: 1.2,
          isRising: true,
          geom: 'sphere',
        };
      case 'fireflies':
        return {
          color: '#facc15',
          emissive: '#eab308',
          size: 0.1,
          speed: 0.5,
          isRising: false,
          geom: 'sphere',
        };
      case 'embers':
        return {
          color: '#fb923c',
          emissive: '#f97316',
          size: 0.09,
          speed: 1.4,
          isRising: true,
          geom: 'octahedron',
        };
      case 'sparkles':
      default:
        return {
          color: '#f472b6',
          emissive: '#fb7185',
          size: 0.11,
          speed: 0.7,
          isRising: false,
          geom: 'octahedron',
        };
    }
  }, [mode]);

  // Generate initial particle properties
  const motes = useMemo(() => {
    const list = [];
    const [halfX, halfY, halfZ] = [area[0] / 2, area[1] / 2, area[2] / 2];

    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        baseX: (Math.random() * 2 - 1) * halfX,
        baseY: (Math.random() * 2 - 1) * halfY,
        baseZ: (Math.random() * 2 - 1) * halfZ,
        phase: Math.random() * Math.PI * 2,
        speedMultiplier: 0.7 + Math.random() * 0.6,
        sizeScale: 0.7 + Math.random() * 0.6,
      });
    }
    return list;
  }, [count, area]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    const children = groupRef.current.children;
    const halfY = area[1] / 2;

    for (let i = 0; i < motes.length; i++) {
      const mesh = children[i];
      if (!mesh) continue;
      const m = motes[i];

      if (config.isRising) {
        // Continuous upward floating with reset loop
        const yOffset = ((time * config.speed * m.speedMultiplier + m.phase * 2) % area[1]) - halfY;
        const xOffset = m.baseX + Math.sin(time * 2 + m.phase) * 0.3;
        const zOffset = m.baseZ + Math.cos(time * 1.5 + m.phase) * 0.3;
        mesh.position.set(xOffset, yOffset, zOffset);
      } else {
        // Floating drifting motes
        const xOffset = m.baseX + Math.sin(time * config.speed + m.phase) * 0.6;
        const yOffset = m.baseY + Math.cos(time * config.speed * 0.8 + m.phase) * 0.5;
        const zOffset = m.baseZ + Math.sin(time * config.speed * 0.5 + m.phase) * 0.6;
        mesh.position.set(xOffset, yOffset, zOffset);
      }

      // Gentle pulsing scale
      const pulse = 1 + Math.sin(time * 3 + m.phase) * 0.25;
      mesh.scale.setScalar(config.size * m.sizeScale * pulse);
    }
  });

  return (
    <group ref={groupRef} position={center}>
      {motes.map((m) => (
        <mesh key={m.id}>
          {config.geom === 'sphere' ? (
            <sphereGeometry args={[1, 10, 10]} />
          ) : (
            <octahedronGeometry args={[1, 0]} />
          )}
          <meshStandardMaterial
            color={config.color}
            emissive={config.emissive}
            emissiveIntensity={0.7}
            roughness={0.3}
            metalness={0.7}
            transparent
            opacity={mode === 'bubbles' ? 0.75 : 0.9}
          />
        </mesh>
      ))}
    </group>
  );
}
