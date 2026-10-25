import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Safe rounded rectangle drawer compatible with all browser and test environments.
 */
function drawRoundRect(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Creates an ultra-clear, high-contrast texture for sight words on cloud platforms.
 * Uses a wide rectangular 512x256 canvas with a tactile rounded pill background,
 * strong border outline, and bold dyslexia-friendly centered typography.
 */
export function createCloudWordTexture(word, isTarget = false, isHovered = false) {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const safeWord = (word || '').toUpperCase().trim();

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Pill badge geometry: wide capsule centered on the canvas
  const pillW = width - 40; // 472px wide
  const pillH = height - 56; // 200px high
  const pillX = 20;
  const pillY = 28;
  const radius = pillH / 2; // 100px radius pill

  // 1. Soft 3D drop shadow for separation from cloud mesh
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;

  // 2. Pill background fill
  // High-contrast dark navy backdrop makes bright text pop against white/yellowish clouds
  drawRoundRect(ctx, pillX, pillY, pillW, pillH, radius);
  const grad = ctx.createLinearGradient(0, pillY, 0, pillY + pillH);
  if (isTarget) {
    grad.addColorStop(0, '#0c2847');
    grad.addColorStop(1, '#051628');
  } else {
    grad.addColorStop(0, '#0b2138');
    grad.addColorStop(1, '#041220');
  }
  ctx.fillStyle = grad;
  ctx.fill();

  // Clear shadow before drawing borders and text
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 3. Glowing border: Warm golden amber for target, bright sky cyan for standard
  drawRoundRect(ctx, pillX, pillY, pillW, pillH, radius);
  ctx.lineWidth = isTarget ? 14 : isHovered ? 14 : 10;
  ctx.strokeStyle = isTarget ? '#f59e0b' : isHovered ? '#38bdf8' : '#0284c7';
  ctx.stroke();

  // 4. Subtle inner highlight contour for tactile polish
  drawRoundRect(ctx, pillX + 6, pillY + 6, pillW - 12, pillH - 12, radius - 6);
  ctx.lineWidth = 3;
  ctx.strokeStyle = isTarget ? 'rgba(254, 240, 138, 0.4)' : 'rgba(186, 230, 253, 0.35)';
  ctx.stroke();

  // 5. Dynamic font size to ensure word is bold, large, and NEVER clipped
  const maxTextWidth = pillW - 48;
  let fontSize = 88;
  ctx.font = `900 ${fontSize}px "Baloo 2", "Nunito", "Segoe UI", system-ui, sans-serif`;
  let measured = ctx.measureText(safeWord).width;

  while (measured > maxTextWidth && fontSize > 36) {
    fontSize -= 4;
    ctx.font = `900 ${fontSize}px "Baloo 2", "Nunito", "Segoe UI", system-ui, sans-serif`;
    measured = ctx.measureText(safeWord).width;
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Crisp text shadow/stroke for maximum legibility
  ctx.lineWidth = 6;
  ctx.strokeStyle = isTarget ? '#78350f' : '#031e33';
  ctx.strokeText(safeWord, width / 2, height / 2 + 4);

  // Bold high-contrast text fill
  ctx.fillStyle = isTarget ? '#fde047' : '#ffffff';
  ctx.fillText(safeWord, width / 2, height / 2 + 4);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.anisotropy = 4;
  return texture;
}

export default function CloudPlatform({
  word,
  position = [0, 2, 0],
  isTarget = false,
  isBounced = false,
  onBounce,
}) {
  const cloudRef = useRef();
  const [isHovered, setIsHovered] = useState(false);

  const texture = useMemo(() => {
    return createCloudWordTexture(word, isTarget, isHovered);
  }, [word, isTarget, isHovered]);

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
        setIsHovered(true);
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
        setIsHovered(false);
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

      {/* 2. Sight Word Label Banner Front (Positioned clearly outside the cloud sphere, angled to camera) */}
      <mesh position={[0, 0.42, 1.32]} rotation={[-0.18, 0, 0]}>
        <planeGeometry args={[2.4, 1.2]} />
        <meshBasicMaterial
          map={texture}
          transparent={true}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Golden Target Cloud Ring */}
      {isTarget && (
        <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.8, 2.1, 24]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
