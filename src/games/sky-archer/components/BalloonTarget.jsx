import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { getLetterTexture } from '../../learning-run/utils/textTexture';

const BALLOON_COLORS = [
  { top: '#ef4444', bottom: '#f87171' }, // Red
  { top: '#3b82f6', bottom: '#60a5fa' }, // Blue
  { top: '#10b981', bottom: '#34d399' }, // Emerald
  { top: '#f59e0b', bottom: '#fbbf24' }, // Amber
  { top: '#8b5cf6', bottom: '#a78bfa' }, // Purple
];

export default function BalloonTarget({
  id,
  letter,
  position = [0, 0, 0],
  isTarget = false,
  isPopped = false,
  onHit,
  colorIndex = 0,
}) {
  const group = useRef();
  const colors = BALLOON_COLORS[colorIndex % BALLOON_COLORS.length];
  const texture = useMemo(() => getLetterTexture(letter, { textColor: '#ffffff', size: 128 }), [letter]);

  useFrame((state) => {
    if (!group.current) return;
    if (isPopped) {
      // Pop scale-down animation
      group.current.scale.multiplyScalar(0.85);
      if (group.current.scale.x < 0.05) {
        group.current.visible = false;
      }
      return;
    }

    // Gentle floating bob in the clouds
    const t = state.clock.elapsedTime + id;
    group.current.position.y = position[1] + Math.sin(t * 1.8) * 0.22;
    group.current.rotation.y = Math.sin(t * 0.8) * 0.15;
  });

  if (isPopped && group.current && group.current.scale.x < 0.05) return null;

  return (
    <group
      ref={group}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (!isPopped && onHit) onHit(letter, isTarget);
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'crosshair';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      {/* 1. Main Hot Air Balloon Body */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[1.1, 16, 16]} />
        <meshStandardMaterial color={colors.top} roughness={0.4} />
      </mesh>
      {/* Tapered Balloon Lower Cone */}
      <mesh position={[0, 0.45, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[1.05, 0.9, 16]} />
        <meshStandardMaterial color={colors.bottom} roughness={0.4} />
      </mesh>

      {/* 2. Ropes connecting balloon to basket */}
      {[-0.3, 0.3].map((rx) =>
        [-0.3, 0.3].map((rz) => (
          <mesh key={`${rx}-${rz}`} position={[rx, -0.05, rz]}>
            <cylinderGeometry args={[0.015, 0.015, 0.6, 4]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
        ))
      )}

      {/* 3. Wicker Basket */}
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[0.65, 0.5, 0.65]} />
        <meshStandardMaterial color="#92400e" roughness={0.85} />
      </mesh>

      {/* 4. Large Bold Phonics Letter Banner on Front */}
      <mesh position={[0, 1.2, 1.12]}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>

      {/* 5. Back Letter Banner */}
      <mesh position={[0, 1.2, -1.12]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>

      {/* 6. Glowing aura for target highlight */}
      {isTarget && (
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[1.25, 12, 12]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.2} wireframe />
        </mesh>
      )}
    </group>
  );
}