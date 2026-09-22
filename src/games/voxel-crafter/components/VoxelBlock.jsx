import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getLetterTexture } from '../../learning-run/utils/textTexture';

export default function VoxelBlock({
  letter,
  blockColor = '#64748b',
  targetPos = [0, 1.6, 0],
  isPlaced = false,
  slotIndex = 0,
  isNext = false,
  onClick,
}) {
  const cubeRef = useRef();

  const texture = useMemo(() => {
    return getLetterTexture(letter, {
      textColor: '#ffffff',
      fontSize: '48px',
      size: 256,
      circleBg: false,
    });
  }, [letter]);

  useFrame((state, delta) => {
    if (!cubeRef.current) return;

    if (isPlaced) {
      // Snapped into crafting bench row
      const placedX = -1.05 + slotIndex * 0.7;
      cubeRef.current.position.x = THREE.MathUtils.lerp(cubeRef.current.position.x, placedX, 0.2);
      cubeRef.current.position.y = THREE.MathUtils.lerp(cubeRef.current.position.y, 1.65, 0.2);
      cubeRef.current.position.z = THREE.MathUtils.lerp(cubeRef.current.position.z, 0, 0.2);
      cubeRef.current.rotation.y = 0;
    } else {
      // Floating on side inventory
      cubeRef.current.position.y =
        targetPos[1] + Math.sin(state.clock.elapsedTime * 2.5 + targetPos[0]) * 0.1;
      cubeRef.current.rotation.y += delta * 0.7;
    }
  });

  return (
    <group
      ref={cubeRef}
      position={targetPos}
      onClick={(e) => {
        e.stopPropagation();
        if (!isPlaced && onClick) onClick(letter);
      }}
      onPointerOver={() => {
        if (!isPlaced) document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      {/* 1. 3D Voxel Letter Cube */}
      <mesh>
        <boxGeometry args={[0.65, 0.65, 0.65]} />
        <meshStandardMaterial
          color={isNext ? '#f59e0b' : blockColor}
          roughness={0.4}
          metalness={0.2}
          emissive={isNext ? '#f59e0b' : '#000000'}
          emissiveIntensity={isNext ? 0.35 : 0}
        />
      </mesh>

      {/* 2. Front Face Letter Texture */}
      <mesh position={[0, 0, 0.33]}>
        <planeGeometry args={[0.55, 0.55]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>

      {/* 3. Back Face Letter Texture */}
      <mesh position={[0, 0, -0.33]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.55, 0.55]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>

      {/* 4. Target Voxel Aura */}
      {isNext && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6, 0.72, 16]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.7} side={2} />
        </mesh>
      )}
    </group>
  );
}
