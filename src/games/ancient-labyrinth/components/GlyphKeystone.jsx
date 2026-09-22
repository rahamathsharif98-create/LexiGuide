import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { getLetterTexture } from '../../learning-run/utils/textTexture';

export default function GlyphKeystone({
  glyph,
  position = [0, 0, 0],
  isNext = false,
  isCollected = false,
  onCollect,
}) {
  const meshRef = useRef();

  const texture = useMemo(() => {
    return getLetterTexture(glyph, {
      textColor: '#ffffff',
      fontSize: '48px',
      size: 256,
      circleBg: false,
    });
  }, [glyph]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    if (isCollected) {
      meshRef.current.scale.multiplyScalar(0.85);
      if (meshRef.current.scale.x < 0.05) {
        meshRef.current.visible = false;
      }
      return;
    }

    // Floating rune crystal spin
    meshRef.current.rotation.y += delta * 1.5;
    meshRef.current.position.y =
      position[1] + 1.2 + Math.sin(state.clock.elapsedTime * 2.5 + position[0]) * 0.15;
  });

  if (isCollected && meshRef.current && meshRef.current.scale.x < 0.05) return null;

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (!isCollected && onCollect) onCollect(glyph);
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      {/* 1. Stone Altar Pedestal */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.6, 0.75, 0.9, 8]} />
        <meshStandardMaterial color="#44403c" roughness={0.85} />
      </mesh>

      {/* 2. Floating Rune Diamond Crystal */}
      <group ref={meshRef} position={[0, 1.2, 0]}>
        <mesh>
          <octahedronGeometry args={[0.75, 0]} />
          <meshStandardMaterial
            color={isNext ? '#f59e0b' : '#38bdf8'}
            emissive={isNext ? '#d97706' : '#0284c7'}
            emissiveIntensity={0.65}
            roughness={0.2}
            metalness={0.7}
          />
        </mesh>

        {/* Front Glyph Texture */}
        <mesh position={[0, 0, 0.62]}>
          <planeGeometry args={[0.75, 0.75]} />
          <meshBasicMaterial map={texture} transparent depthWrite={false} />
        </mesh>

        {/* Back Glyph Texture */}
        <mesh position={[0, 0, -0.62]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.75, 0.75]} />
          <meshBasicMaterial map={texture} transparent depthWrite={false} />
        </mesh>

        {/* Target Aura */}
        {isNext && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.9, 1.05, 16]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.75} side={2} />
          </mesh>
        )}
      </group>
    </group>
  );
}
