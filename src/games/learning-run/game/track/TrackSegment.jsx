import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { SEGMENT_LENGTH } from '../engine/constants';

// A single recyclable ground slab. `zRef` holds the current world-space
// starting Z of this pooled slab (mutated by the engine loop, not React state).
export default function TrackSegment({ zRef }) {
  const group = useRef();

  useFrame(() => {
    if (group.current) {
      group.current.position.z = zRef.current;
    }
  });

  return (
    <group ref={group}>
      {/* Main Safari Sandstone Path */}
      <mesh position={[0, -0.05, -SEGMENT_LENGTH / 2]} receiveShadow>
        <boxGeometry args={[8, 0.3, SEGMENT_LENGTH]} />
        <meshStandardMaterial color="#dfc89e" roughness={0.82} />
      </mesh>

      {/* Carved Golden Inlay Lane Dividers */}
      {[-1.2, 1.2].map((x) => (
        <mesh key={x} position={[x, 0.11, -SEGMENT_LENGTH / 2]}>
          <boxGeometry args={[0.08, 0.02, SEGMENT_LENGTH]} />
          <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.35} metalness={0.5} roughness={0.3} />
        </mesh>
      ))}

      {/* Ancient Mossy Stone Border Curbs */}
      {[-4.05, 4.05].map((x) => (
        <mesh key={`edge-${x}`} position={[x, 0.08, -SEGMENT_LENGTH / 2]}>
          <boxGeometry args={[0.18, 0.18, SEGMENT_LENGTH]} />
          <meshStandardMaterial color="#2d6a4f" roughness={0.8} />
        </mesh>
      ))}

      {/* Decorative Golden Sun Emblems along the path every 10 meters */}
      {[-7, -17, -27].map((zOffset) => (
        <mesh key={`marker-${zOffset}`} position={[0, 0.105, zOffset]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.38, 8]} />
          <meshStandardMaterial color="#f59e0b" emissive="#b45309" emissiveIntensity={0.3} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}
