import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Creates a crisp CanvasTexture for text/rime badges without external font network dependencies.
 */
function createRimeTexture(text, isHovered, isSelected) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, size, size);

    // Glowing background pill/circle
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.44, 0, Math.PI * 2);
    ctx.fillStyle = isSelected
      ? '#10b981'
      : isHovered
      ? '#38bdf8'
      : 'rgba(255, 255, 255, 0.92)';
    ctx.fill();

    ctx.lineWidth = 10;
    ctx.strokeStyle = isSelected ? '#34d399' : isHovered ? '#0284c7' : '#c084fc';
    ctx.stroke();

    // High contrast dyslexia-friendly font
    ctx.font = `900 ${Math.floor(size * 0.42)}px "Baloo 2", "Comic Sans MS", "Nunito", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isSelected || isHovered ? '#ffffff' : '#1e1b4b';
    ctx.fillText(text, size / 2, size / 2 + 6);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * WebStrandNode.jsx
 * Interactive glistening dewdrop letter node on the spider web.
 */
export default function WebStrandNode({
  rime,
  position = [0, 0, 0],
  isTarget = false,
  isSelected = false,
  onSelect,
}) {
  const nodeRef = useRef();
  const [hovered, setHovered] = useState(false);

  const texture = useMemo(() => {
    return createRimeTexture(rime, hovered, isSelected);
  }, [rime, hovered, isSelected]);

  useFrame((state) => {
    if (!nodeRef.current) return;
    const t = state.clock.getElapsedTime();

    if (isSelected) {
      // Energetic celebratory pulse
      nodeRef.current.scale.setScalar(1.2 + Math.sin(t * 8) * 0.08);
    } else if (hovered) {
      // Smooth hover scale
      nodeRef.current.scale.setScalar(1.15);
    } else {
      // Gentle web breathing
      nodeRef.current.scale.setScalar(1.0 + Math.sin(t * 2.5 + position[0]) * 0.04);
    }
  });

  return (
    <group
      ref={nodeRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(rime);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* 1. Glistening Dewdrop Crystal Sphere */}
      <mesh position={[0, 0, -0.05]}>
        <sphereGeometry args={[0.78, 24, 24]} />
        <meshStandardMaterial
          color={isSelected ? '#34d399' : hovered ? '#38bdf8' : '#e0e7ff'}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* 2. Flat Text Badge Plane */}
      <mesh position={[0, 0, 0.72]}>
        <planeGeometry args={[1.3, 1.3]} />
        <meshBasicMaterial map={texture} transparent />
      </mesh>

      {/* 3. Silk thread linking from center [0, 1.2, 0] to this node when selected */}
      {isSelected && (
        <mesh position={[-position[0] / 2, (1.2 - position[1]) / 2, 0]}>
          <cylinderGeometry
            args={[
              0.02,
              0.02,
              Math.hypot(position[0], position[1] - 1.2),
              8,
            ]}
          />
          <meshBasicMaterial color="#34d399" />
        </mesh>
      )}
    </group>
  );
}
