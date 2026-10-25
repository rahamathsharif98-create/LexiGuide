import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Calculates current ballistic trajectory position for arrow.
 */
export function calculateArrowPosition(startPosition, targetPosition, progress) {
  const p = Math.max(0, Math.min(1, progress));
  const currX = THREE.MathUtils.lerp(startPosition[0], targetPosition[0], p);
  const arcHeight = Math.sin(p * Math.PI) * 0.45;
  const currY = THREE.MathUtils.lerp(startPosition[1], targetPosition[1], p) + arcHeight;
  const currZ = THREE.MathUtils.lerp(startPosition[2], targetPosition[2], p);
  return [currX, currY, currZ];
}

/**
 * Calculates tangent look-at point ahead of arrow for orientation.
 */
export function calculateArrowLookAt(startPosition, targetPosition, progress) {
  const p = Math.max(0, Math.min(1, progress));
  const lookAheadP = Math.min(1, p + 0.05);
  const nextX = THREE.MathUtils.lerp(startPosition[0], targetPosition[0], lookAheadP);
  const nextArcHeight = Math.sin(lookAheadP * Math.PI) * 0.45;
  const nextY = THREE.MathUtils.lerp(startPosition[1], targetPosition[1], lookAheadP) + nextArcHeight;
  const nextZ = THREE.MathUtils.lerp(startPosition[2], targetPosition[2], lookAheadP);
  return [nextX, nextY, nextZ];
}

/**
 * ArrowProjectile
 * 3D animated archery arrow launched from the player/camera vantage toward a target balloon.
 * 
 * Features:
 * - Parabolic ballistic flight path
 * - Real-time orientation facing tangent direction of travel
 * - Golden glowing shaft, illuminated diamond arrowhead, red fletching
 * - Sparkle motes trailing the projectile
 * - Resilient completion callback onImpact
 */
export default function ArrowProjectile({
  startPosition = [0, -1.5, 4.5],
  targetPosition = [0, 1.2, -5.5],
  duration = 0.28,
  onImpact,
}) {
  const groupRef = useRef();
  const progressRef = useRef(0);
  const impactedRef = useRef(false);

  useFrame((state, delta) => {
    if (impactedRef.current || !groupRef.current) return;

    progressRef.current += delta / duration;
    const p = Math.min(1, progressRef.current);

    const [currX, currY, currZ] = calculateArrowPosition(startPosition, targetPosition, p);
    groupRef.current.position.set(currX, currY, currZ);

    const [nextX, nextY, nextZ] = calculateArrowLookAt(startPosition, targetPosition, p);
    groupRef.current.lookAt(nextX, nextY, nextZ);

    if (p >= 1) {
      impactedRef.current = true;
      if (onImpact) {
        onImpact();
      }
    }
  });

  return (
    <group ref={groupRef} position={startPosition}>
      {/* 1. Sleek Golden Arrow Shaft */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.4, 8]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#d97706"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* 2. Glowing Diamond Arrowhead (Facing forward +Z) */}
      <mesh position={[0, 0, 0.75]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.11, 0.35, 6]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#38bdf8"
          emissiveIntensity={1.0}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Arrowhead luminous aura */}
      <mesh position={[0, 0, 0.75]}>
        <sphereGeometry args={[0.16, 8, 8]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} />
      </mesh>

      {/* 3. Feathers / Fletching (at tail -Z) */}
      {[-0.05, 0.05].map((offset, i) => (
        <mesh key={`fletch-h-${i}`} position={[offset, 0, -0.6]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.16, 0.02, 0.28]} />
          <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.3} />
        </mesh>
      ))}
      {[-0.05, 0.05].map((offset, i) => (
        <mesh key={`fletch-v-${i}`} position={[0, offset, -0.6]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.16, 0.02, 0.28]} />
          <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.3} />
        </mesh>
      ))}

      {/* 4. Magical Sparkle Trail Behind Arrow */}
      {[-0.3, -0.6, -0.9].map((tz, idx) => (
        <mesh key={`trail-${idx}`} position={[0, 0, tz]}>
          <sphereGeometry args={[0.06 - idx * 0.015, 6, 6]} />
          <meshBasicMaterial
            color="#fef08a"
            transparent
            opacity={0.7 - idx * 0.2}
          />
        </mesh>
      ))}
    </group>
  );
}
