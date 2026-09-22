import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { LANE_X } from '../engine/constants';

// Two readable obstacle silhouettes, sharing one pooled slot so the pool can
// recycle a slot as either type across its lifetime:
// 'jump'  -> low ancient stone block the player must jump over
// 'slide' -> glowing magical bar the player must slide under
export default function Obstacle({ posRef }) {
  const group = useRef();
  const jumpMesh = useRef();
  const slideMesh = useRef();

  useFrame(() => {
    if (!group.current) return;
    const p = posRef.current;
    group.current.visible = p.active;
    if (!p.active) return;
    group.current.position.set(LANE_X[p.lane], 0, p.z);
    if (jumpMesh.current) jumpMesh.current.visible = p.type === 'jump';
    if (slideMesh.current) slideMesh.current.visible = p.type === 'slide';
  });

  return (
    <group ref={group}>
      {/* Jump obstacle: Fallen Mossy Safari Jungle Log */}
      <group ref={jumpMesh}>
        {/* Main wood trunk */}
        <mesh position={[0, 0.32, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.3, 0.32, 1.55, 12]} />
          <meshStandardMaterial color="#5c3d28" roughness={0.88} />
        </mesh>
        {/* Lush green jungle moss strip on top */}
        <mesh position={[0, 0.52, 0]}>
          <boxGeometry args={[1.4, 0.12, 0.4]} />
          <meshStandardMaterial color="#3f6212" roughness={0.85} />
        </mesh>
      </group>

      {/* Slide obstacle: Ancient Carved Safari Temple Archway */}
      <group ref={slideMesh}>
        {/* Left Sandstone Column */}
        <mesh position={[-0.6, 1.0, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.15, 2.0, 8]} />
          <meshStandardMaterial color="#92623a" roughness={0.75} />
        </mesh>
        {/* Right Sandstone Column */}
        <mesh position={[0.6, 1.0, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.15, 2.0, 8]} />
          <meshStandardMaterial color="#92623a" roughness={0.75} />
        </mesh>
        {/* Overhead Carved Stone Lintel Bar */}
        <mesh position={[0, 1.68, 0]} castShadow>
          <boxGeometry args={[1.55, 0.28, 0.32]} />
          <meshStandardMaterial color="#b45309" roughness={0.7} emissive="#78350f" emissiveIntensity={0.3} />
        </mesh>
        {/* Glowing Warning Runes on lintel */}
        <mesh position={[0, 1.68, 0.17]}>
          <boxGeometry args={[1.2, 0.1, 0.02]} />
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.8} />
        </mesh>
      </group>
    </group>
  );
}
