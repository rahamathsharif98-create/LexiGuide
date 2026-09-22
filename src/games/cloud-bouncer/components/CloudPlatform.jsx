import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getLetterTexture } from '../../learning-run/utils/textTexture';

export default function CloudPlatform({
  word,
  position = [0, 2, 0],
  isTarget = false,
  isBounced = false,
  onBounce,
}) {
  const cloudRef = useRef();

  const texture = useMemo(() => {
    return getLetterTexture(word, {
      textColor: '#0f172a',
      fontSize: '44px',
      size: 256,
      circleBg: false,
    });
  }, [word]);

  useFrame((state, delta) => {
    if (!cloudRef.current) return;

    if (isBounced) {
      // Squash and stretch spring bounce
      cloudRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 12) * 0.25;
    } else {
      // Gentle cloud drift
      cloudRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.15;
    }
  });

  return (
    <group
      ref={cloudRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (onBounce) onBounce(word);
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      {/* 1. Fluffy Cloud Cushion Spheres */}
      <group position={[0, 0, 0]}>
        {/* Center puff */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshStandardMaterial
            color={isTarget ? '#fef08a' : '#ffffff'}
            roughness={0.9}
            emissive={isTarget ? '#fde047' : '#000000'}
            emissiveIntensity={isTarget ? 0.35 : 0}
          />
        </mesh>
        {/* Left puff */}
        <mesh position={[-1.1, -0.2, 0]}>
          <sphereGeometry args={[0.9, 16, 16]} />
          <meshStandardMaterial color={isTarget ? '#fef08a' : '#ffffff'} roughness={0.9} />
        </mesh>
        {/* Right puff */}
        <mesh position={[1.1, -0.2, 0]}>
          <sphereGeometry args={[0.9, 16, 16]} />
          <meshStandardMaterial color={isTarget ? '#fef08a' : '#ffffff'} roughness={0.9} />
        </mesh>
        {/* Front flat platform base */}
        <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.5, 1.2]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.9} />
        </mesh>
      </group>

      {/* 2. Sight Word Label Banner Front */}
      <mesh position={[0, 0.5, 0.85]}>
        <planeGeometry args={[1.8, 0.9]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>

      {/* 3. Golden Target Cloud Ring */}
      {isTarget && (
        <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.8, 2.1, 24]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.65} side={2} />
        </mesh>
      )}
    </group>
  );
}
