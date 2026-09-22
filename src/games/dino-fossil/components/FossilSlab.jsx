import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { getLetterTexture } from '../../learning-run/utils/textTexture';

export default function FossilSlab({
  chunk,
  position = [0, 0.6, 0],
  isExcavated = false,
  isNext = false,
  onBrush,
}) {
  const slabRef = useRef();

  const texture = useMemo(() => {
    return getLetterTexture(chunk, {
      textColor: '#ffffff',
      fontSize: '44px',
      size: 256,
      circleBg: false,
    });
  }, [chunk]);

  useFrame((state, delta) => {
    if (!slabRef.current) return;
    if (isExcavated) {
      slabRef.current.scale.multiplyScalar(0.85);
      if (slabRef.current.scale.x < 0.05) {
        slabRef.current.visible = false;
      }
      return;
    }

    // Gentle hover bobbing in the sand
    slabRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2.5 + position[0]) * 0.12;
    slabRef.current.rotation.y += delta * 0.5;
  });

  if (isExcavated && slabRef.current && slabRef.current.scale.x < 0.05) return null;

  return (
    <group
      ref={slabRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (!isExcavated && onBrush) onBrush(chunk);
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      {/* 1. Ancient Stone Fossil Tablet */}
      <mesh>
        <boxGeometry args={[1.5, 1.0, 0.45]} />
        <meshStandardMaterial
          color={isNext ? '#f59e0b' : '#78716c'}
          roughness={0.9}
          metalness={0.1}
          emissive={isNext ? '#d97706' : '#000000'}
          emissiveIntensity={isNext ? 0.35 : 0}
        />
      </mesh>

      {/* 2. Amber Core Inlay */}
      <mesh scale={[0.85, 0.75, 1.05]}>
        <boxGeometry args={[1.5, 1.0, 0.45]} />
        <meshStandardMaterial
          color="#d97706"
          roughness={0.2}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* 3. Phonics Chunk Label Front */}
      <mesh position={[0, 0, 0.26]}>
        <planeGeometry args={[1.3, 0.8]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>

      {/* 4. Phonics Chunk Label Back */}
      <mesh position={[0, 0, -0.26]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.3, 0.8]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>

      {/* 5. Next Clue Aura */}
      {isNext && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.35, 24]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.7} side={2} />
        </mesh>
      )}
    </group>
  );
}
