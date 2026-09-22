import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * VFXShockwaveRing
 * Expands a glowing circular wave outward upon impact/selection.
 */
export default function VFXShockwaveRing({
  position = [0, 0, 0],
  color = '#38bdf8',
  maxRadius = 2.4,
  duration = 0.6,
  triggerKey = 0,
}) {
  const meshRef = useRef();
  const ageRef = useRef(0);
  const activeRef = useRef(false);

  useEffect(() => {
    if (!triggerKey) return;
    ageRef.current = 0;
    activeRef.current = true;
    if (meshRef.current) {
      meshRef.current.visible = true;
      meshRef.current.scale.set(0.1, 0.1, 0.1);
      if (meshRef.current.material) {
        meshRef.current.material.opacity = 0.9;
      }
    }
  }, [triggerKey]);

  useFrame((state, delta) => {
    if (!activeRef.current || !meshRef.current) return;
    ageRef.current += delta;
    const progress = ageRef.current / duration;

    if (progress >= 1) {
      activeRef.current = false;
      meshRef.current.visible = false;
      return;
    }

    const currentRadius = 0.2 + progress * (maxRadius - 0.2);
    meshRef.current.scale.set(currentRadius, currentRadius, currentRadius);
    if (meshRef.current.material) {
      meshRef.current.material.opacity = Math.max(0, (1 - progress) * 0.9);
    }
  });

  if (!triggerKey) return null;

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.9, 1.0, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
    </mesh>
  );
}
