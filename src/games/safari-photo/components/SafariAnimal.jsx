import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { getLetterTexture } from '../../learning-run/utils/textTexture';

export default function SafariAnimal({
  target,
  isTarget = false,
  isSnapped = false,
  onSnap,
}) {
  const groupRef = useRef();

  const texture = useMemo(() => {
    return getLetterTexture(target.letter, {
      textColor: '#ffffff',
      fontSize: '48px',
      size: 128,
      circleBg: true,
      circleBgColor: '#f59e0b',
    });
  }, [target.letter]);

  useFrame((state) => {
    if (!groupRef.current) return;
    // Gentle breathing bob
    groupRef.current.position.y =
      target.position[1] + Math.sin(state.clock.elapsedTime * 2 + target.position[0]) * 0.08;
  });

  return (
    <group
      ref={groupRef}
      position={target.position}
      onClick={(e) => {
        e.stopPropagation();
        if (onSnap) onSnap(target);
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      {/* 1. Animal 3D Representation by ID */}
      {target.animal === 'LION' && (
        <group>
          {/* Body */}
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[1.2, 0.8, 1.8]} />
            <meshStandardMaterial color="#d97706" roughness={0.7} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.9, 0.9]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color="#b45309" roughness={0.6} />
          </mesh>
          {/* Mane */}
          <mesh position={[0, 0.9, 0.7]}>
            <torusGeometry args={[0.6, 0.25, 8, 16]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
        </group>
      )}

      {target.animal === 'ZEBRA' && (
        <group>
          {/* Body */}
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[0.9, 0.9, 1.7]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.5} />
          </mesh>
          {/* Stripes */}
          {[-0.4, 0, 0.4].map((z, idx) => (
            <mesh key={`stripe-${idx}`} position={[0, 0.6, z]}>
              <boxGeometry args={[0.94, 0.92, 0.15]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          ))}
          {/* Neck & Head */}
          <mesh position={[0, 1.3, 0.7]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.25, 1.0, 8]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[0, 1.7, 1.0]}>
            <boxGeometry args={[0.4, 0.35, 0.6]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        </group>
      )}

      {target.animal === 'GIRAFFE' && (
        <group>
          {/* Body */}
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[1.0, 1.0, 1.6]} />
            <meshStandardMaterial color="#eab308" roughness={0.6} />
          </mesh>
          {/* Long Neck */}
          <mesh position={[0, 2.2, 0.6]} rotation={[-0.1, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.26, 2.4, 8]} />
            <meshStandardMaterial color="#ca8a04" roughness={0.6} />
          </mesh>
          {/* Head with ossicones */}
          <mesh position={[0, 3.4, 0.6]}>
            <boxGeometry args={[0.35, 0.35, 0.6]} />
            <meshStandardMaterial color="#eab308" />
          </mesh>
        </group>
      )}

      {target.animal === 'MONKEY' && (
        <group scale={0.7}>
          {/* Body */}
          <mesh position={[0, 0.4, 0]}>
            <sphereGeometry args={[0.45, 12, 12]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[0.35, 12, 12]} />
            <meshStandardMaterial color="#92400e" />
          </mesh>
        </group>
      )}

      {target.animal === 'HIPPO' && (
        <group>
          {/* Chunky Body */}
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[1.6, 0.9, 2.2]} />
            <meshStandardMaterial color="#64748b" roughness={0.5} />
          </mesh>
          {/* Big Snout */}
          <mesh position={[0, 0.4, 1.2]}>
            <boxGeometry args={[1.2, 0.6, 1.0]} />
            <meshStandardMaterial color="#475569" roughness={0.5} />
          </mesh>
        </group>
      )}

      {/* 2. Floating Phonics Letter Badge */}
      <mesh position={[0, target.animal === 'GIRAFFE' ? 4.2 : 2.0, 0]}>
        <planeGeometry args={[0.8, 0.8]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} side={2} />
      </mesh>

      {/* 3. Camera Focus Reticle on Target */}
      {isTarget && (
        <mesh position={[0, 1.2, 0]} rotation={[0, 0, 0]}>
          <ringGeometry args={[1.4, 1.55, 24]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.75} side={2} />
        </mesh>
      )}
    </group>
  );
}
