import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { getLetterTexture } from '../../learning-run/utils/textTexture';

export default function LetterCrystal({
  letter,
  position = [0, 0, 0],
  isNext = false,
  isCollected = false,
  onCollect,
}) {
  const meshRef = useRef();
  const texture = useMemo(() => getLetterTexture(letter, { textColor: '#ffffff', size: 128 }), [letter]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    if (isCollected) {
      meshRef.current.scale.multiplyScalar(0.85);
      if (meshRef.current.scale.x < 0.05) {
        meshRef.current.visible = false;
      }
      return;
    }
    // Floating low-gravity spin
    meshRef.current.rotation.y += delta * 1.5;
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2.5 + position[0]) * 0.15;
  });

  if (isCollected && meshRef.current && meshRef.current.scale.x < 0.05) return null;

  return (
    <group
      ref={meshRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (!isCollected && onCollect) onCollect(letter);
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      {/* 1. Octahedron 3D Space Crystal */}
      <mesh>
        <octahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial
          color={isNext ? '#f59e0b' : '#0ea5e9'}
          emissive={isNext ? '#d97706' : '#0284c7'}
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* 2. Crystal Letter Face Front */}
      <mesh position={[0, 0, 0.72]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>

      {/* 3. Crystal Letter Face Back */}
      <mesh position={[0, 0, -0.72]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>

      {/* 4. Target Aura Ring */}
      {isNext && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.05, 1.25, 16]} />
          <meshBasicMaterial color='#fbbf24' transparent opacity={0.6} side={2} />
        </mesh>
      )}
    </group>
  );
}