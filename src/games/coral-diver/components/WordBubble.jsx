import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { getLetterTexture } from '../../learning-run/utils/textTexture';

export default function WordBubble({
  word,
  position = [0, 2, 0],
  isRhyme = false,
  isCollected = false,
  onCollect,
}) {
  const groupRef = useRef();

  // Generate crisp canvas texture for the full word
  const texture = useMemo(() => {
    return getLetterTexture(word, {
      textColor: '#ffffff',
      fontSize: '44px',
      size: 256,
      circleBg: false,
    });
  }, [word]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (isCollected) {
      groupRef.current.scale.multiplyScalar(0.85);
      if (groupRef.current.scale.x < 0.05) {
        groupRef.current.visible = false;
      }
      return;
    }

    // Gentle aquatic buoyancy floating
    groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.25;
    groupRef.current.rotation.y += delta * 0.6;
  });

  if (isCollected && groupRef.current && groupRef.current.scale.x < 0.05) return null;

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (!isCollected && onCollect) onCollect(word);
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      {/* 1. Iridescent Outer Sea Bubble */}
      <mesh>
        <sphereGeometry args={[1.15, 24, 24]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.45}
          emissive="#0284c7"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* 2. Inner Pearl Core */}
      <mesh scale={0.75}>
        <sphereGeometry args={[0.9, 20, 20]} />
        <meshStandardMaterial
          color="#f8fafc"
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>

      {/* 3. Word Banner Front */}
      <mesh position={[0, 0, 0.72]}>
        <planeGeometry args={[1.4, 0.8]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>

      {/* 4. Word Banner Back */}
      <mesh position={[0, 0, -0.72]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.4, 0.8]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>

      {/* 5. Target Glow Aura */}
      {isRhyme && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.3, 1.45, 24]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} side={2} />
        </mesh>
      )}
    </group>
  );
}
