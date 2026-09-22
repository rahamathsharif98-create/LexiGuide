import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getLetterTexture } from '../../learning-run/utils/textTexture';

export default function CakeTier({
  syllable,
  color = '#fb7185',
  frostingColor = '#fef08a',
  targetPos = [0, 1.2, 0],
  isStacked = false,
  stackIndex = 0,
  isCandleTop = false,
  onClick,
}) {
  const meshRef = useRef();
  const flameRef = useRef();

  const texture = useMemo(() => {
    return getLetterTexture(syllable, {
      textColor: '#ffffff',
      fontSize: '40px',
      size: 256,
      circleBg: false,
    });
  }, [syllable]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (isStacked) {
      // Smoothly drop down onto pedestal stack
      const targetY = 0.7 + stackIndex * 1.05;
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, 0, 0.15);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.15);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, 0, 0.15);
      meshRef.current.rotation.y += delta * 0.4;
    } else {
      // Gentle floating bobbing on side counter
      meshRef.current.position.y =
        targetPos[1] + Math.sin(state.clock.elapsedTime * 2.5 + targetPos[0]) * 0.1;
      meshRef.current.rotation.y += delta * 0.8;
    }

    // Candle flame flicker
    if (flameRef.current) {
      flameRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 15) * 0.25;
    }
  });

  const tierRadius = Math.max(1.2, 2.2 - stackIndex * 0.4);

  return (
    <group
      ref={meshRef}
      position={targetPos}
      onClick={(e) => {
        e.stopPropagation();
        if (!isStacked && onClick) onClick(syllable);
      }}
      onPointerOver={() => {
        if (!isStacked) document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      {/* 1. Main Fluffy Cake Sponge */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[tierRadius, tierRadius * 1.05, 0.9, 32]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>

      {/* 2. Top Frosting Layer */}
      <mesh position={[0, 0.91, 0]}>
        <cylinderGeometry args={[tierRadius * 1.02, tierRadius * 1.02, 0.12, 32]} />
        <meshStandardMaterial color={frostingColor} roughness={0.3} />
      </mesh>

      {/* 3. Syllable Text Label Front */}
      <mesh position={[0, 0.45, tierRadius + 0.05]}>
        <planeGeometry args={[1.5, 0.7]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>

      {/* 4. Syllable Text Label Back */}
      <mesh position={[0, 0.45, -tierRadius - 0.05]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.5, 0.7]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>

      {/* 5. Birthday Candle if Top Tier is Stacked */}
      {isCandleTop && (
        <group position={[0, 1.4, 0]}>
          {/* Candle stick */}
          <mesh>
            <cylinderGeometry args={[0.08, 0.08, 0.8, 12]} />
            <meshStandardMaterial color="#f43f5e" />
          </mesh>
          {/* Candle wick */}
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {/* Candle flame */}
          <mesh ref={flameRef} position={[0, 0.65, 0]}>
            <coneGeometry args={[0.12, 0.35, 12]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        </group>
      )}
    </group>
  );
}
