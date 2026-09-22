import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LANE_X } from '../engine/constants';

export const POWERUP_COLORS = {
  magnet: '#ff6b9d',
  shield: '#4dd8ff',
  'star-boost': '#ffd166',
  'slow-time': '#9b7bff',
};

export const POWERUP_LABELS = {
  magnet: 'Letter Magnet',
  shield: 'Flame Shield',
  'star-boost': 'Star Boost',
  'slow-time': 'Slow Time',
};

export default function PowerUp({ posRef }) {
  const group = useRef();
  const mat = useRef();
  const lastKind = useRef(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    const p = posRef.current;
    group.current.visible = p.active;
    if (!p.active) return;
    group.current.position.set(LANE_X[p.lane], 1.3 + Math.sin(state.clock.elapsedTime * 3) * 0.15, p.z);
    group.current.rotation.y += delta * 2.4;
    group.current.rotation.x += delta * 1.1;
    if (mat.current && p.kind !== lastKind.current) {
      const color = new THREE.Color(POWERUP_COLORS[p.kind] || '#7cf7ff');
      mat.current.emissive = color;
      mat.current.color = color.clone().lerp(new THREE.Color('#ffffff'), 0.5);
      lastKind.current = p.kind;
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial ref={mat} color="#ffffff" emissive="#7cf7ff" emissiveIntensity={0.9} metalness={0.4} roughness={0.15} />
      </mesh>
      <pointLight color="#8fe8ff" intensity={0.8} distance={2} />
    </group>
  );
}
