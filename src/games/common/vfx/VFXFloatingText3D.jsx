import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Creates a high-resolution comic action text texture
 */
function createComicTextTexture(text, color = '#fbbf24') {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, 512, 160);

  // Rounded comic pill background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.roundRect(16, 16, 480, 128, 40);
  ctx.fill();
  ctx.stroke();

  // Bold comic typography with glow shadow
  ctx.font = '900 48px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = color;
  ctx.fillText(text, 256, 80);

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, 256, 78);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * VFXFloatingText3D
 * Bouncy 3D Comic popup text that scales up and floats upward upon trigger.
 */
export default function VFXFloatingText3D({
  text = 'AWESOME!',
  position = [0, 2.5, 0],
  color = '#fbbf24',
  triggerKey = 0,
  duration = 1.2,
}) {
  const meshRef = useRef();
  const ageRef = useRef(0);
  const activeRef = useRef(false);

  const texture = useMemo(() => {
    return createComicTextTexture(text, color);
  }, [text, color]);

  useEffect(() => {
    if (!triggerKey) return;
    ageRef.current = 0;
    activeRef.current = true;
    if (meshRef.current) {
      meshRef.current.visible = true;
      meshRef.current.position.set(position[0], position[1], position[2]);
      meshRef.current.scale.set(0.01, 0.01, 0.01);
    }
  }, [triggerKey, position]);

  useFrame((state, delta) => {
    if (!activeRef.current || !meshRef.current) return;
    ageRef.current += delta;
    const progress = ageRef.current / duration;

    if (progress >= 1) {
      activeRef.current = false;
      meshRef.current.visible = false;
      return;
    }

    // Elastic pop scale: 0 -> 1.3 -> 1.0
    let scale;
    if (progress < 0.2) {
      scale = (progress / 0.2) * 1.3;
    } else if (progress < 0.35) {
      scale = 1.3 - ((progress - 0.2) / 0.15) * 0.3;
    } else {
      scale = 1.0 * (1 - (progress - 0.35) / 0.65);
    }

    meshRef.current.position.y = position[1] + progress * 1.8;
    meshRef.current.scale.set(scale * 2.2, scale * 0.7, 1);

    if (meshRef.current.material) {
      meshRef.current.material.opacity = Math.max(0, 1 - progress * 1.1);
    }

    // Billboard lookAt camera
    meshRef.current.quaternion.copy(state.camera.quaternion);
  });

  if (!triggerKey || !texture) return null;

  return (
    <mesh ref={meshRef} position={position} visible={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent opacity={1} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}
