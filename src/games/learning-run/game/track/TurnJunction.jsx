import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// A dynamic 3D 90-degree Temple Run corner turn junction.
// Designed with open horizon sightlines, glowing directional runway arrows,
// side branch road, and low ancient stone balustrades so the runner's view
// is never blocked by a monolithic wall.
export default function TurnJunction({ turnRef }) {
  const group = useRef();
  const arrowRef = useRef();

  useFrame((state) => {
    if (!group.current) return;
    const t = turnRef.current;
    group.current.visible = t.active;
    if (!t.active) return;
    group.current.position.z = t.z;

    // Pulse glowing direction arrows
    if (arrowRef.current && arrowRef.current.material) {
      const pulse = 0.75 + Math.sin(state.clock.elapsedTime * 6) * 0.25;
      arrowRef.current.material.emissiveIntensity = pulse * 0.9;
    }
  });

  const isLeft = turnRef.current.direction === 'left';
  const branchX = isLeft ? -7 : 7;

  return (
    <group ref={group}>
      {/* 1. Branch Road extending 90 degrees into the turn */}
      <mesh position={[branchX, -0.05, 0]}>
        <boxGeometry args={[14, 0.28, 8]} />
        <meshStandardMaterial color="#dfc89e" roughness={0.82} />
      </mesh>

      {/* Branch road golden lane inlays */}
      {[-1.2, 1.2].map((zOffset) => (
        <mesh key={zOffset} position={[branchX, 0.11, zOffset]}>
          <boxGeometry args={[14, 0.02, 0.08]} />
          <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.4} />
        </mesh>
      ))}

      {/* 2. Low Ancient Carved Parapet / Balustrade on straight edge (open sightline!) */}
      <group position={[0, 0.5, -4.2]}>
        {/* Parapet Base */}
        <mesh>
          <boxGeometry args={[8.4, 0.9, 0.5]} />
          <meshStandardMaterial color="#8d6b4f" roughness={0.8} />
        </mesh>
        {/* Carved stone corner pillars with golden torch fire */}
        {[-3.8, 3.8].map((x) => (
          <group key={x} position={[x, 0.3, 0]}>
            <mesh>
              <cylinderGeometry args={[0.3, 0.35, 1.2, 8]} />
              <meshStandardMaterial color="#c2a679" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.8, 0]}>
              <coneGeometry args={[0.2, 0.6, 6]} />
              <meshBasicMaterial color="#f59e0b" />
            </mesh>
          </group>
        ))}
      </group>

      {/* 3. Glowing Turn Chevron Arrows on the ground */}
      <group position={[0, 0.11, 0]}>
        {[-2.2, -0.6, 1.0, 2.6].map((offset, idx) => {
          const xPos = isLeft ? -Math.abs(offset) * 1.4 : Math.abs(offset) * 1.4;
          const rotZ = isLeft ? Math.PI / 2 : -Math.PI / 2;
          return (
            <mesh
              key={idx}
              ref={idx === 0 ? arrowRef : null}
              position={[xPos, 0.01, 0]}
              rotation={[-Math.PI / 2, 0, rotZ]}
            >
              <coneGeometry args={[0.65, 1.0, 3]} />
              <meshStandardMaterial
                color="#fbbf24"
                emissive="#f59e0b"
                emissiveIntensity={0.85}
                roughness={0.2}
              />
            </mesh>
          );
        })}
      </group>

      {/* 4. Elegant Temple Corner Gateway Arch on the turn exit */}
      <group position={[isLeft ? -4.5 : 4.5, 2.2, 0]} rotation={[0, isLeft ? -Math.PI / 2 : Math.PI / 2, 0]}>
        {/* Left pillar */}
        <mesh position={[-3.2, -0.8, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 3.6, 8]} />
          <meshStandardMaterial color="#c2a679" roughness={0.75} />
        </mesh>
        {/* Right pillar */}
        <mesh position={[3.2, -0.8, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 3.6, 8]} />
          <meshStandardMaterial color="#c2a679" roughness={0.75} />
        </mesh>
        {/* Lintel Bar */}
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[7.2, 0.45, 0.7]} />
          <meshStandardMaterial color="#b08968" roughness={0.7} />
        </mesh>
        {/* Golden Direction Glyph */}
        <mesh position={[0, 1.1, 0.38]} rotation={[0, 0, isLeft ? Math.PI / 2 : -Math.PI / 2]}>
          <coneGeometry args={[0.15, 0.35, 3]} />
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1.0} />
        </mesh>
      </group>
    </group>
  );
}
