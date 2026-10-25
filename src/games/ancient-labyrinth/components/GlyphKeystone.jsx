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
 * Creates an ultra-clear, high-contrast, large rune-letter texture for keystone blocks.
 * Renders on a crisp 512x512 canvas with a dark obsidian/stone tablet backdrop,
 * golden/cyan carved border, corner studs, and huge bold dyslexia-friendly centered typography.
 */
function createRuneFaceTexture(glyph, isNext, isHovered) {
  if (typeof document === 'undefined') return null;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const safeGlyph = (glyph || '').toUpperCase().trim();
  const margin = 20;
  const pad = 12;
  const w = size - margin * 2;
  const h = size - margin * 2;
  const r = 44;

  ctx.clearRect(0, 0, size, size);

  // 1. Tablet outer drop shadow
  ctx.shadowColor = isNext ? 'rgba(245, 158, 11, 0.75)' : isHovered ? 'rgba(56, 189, 248, 0.6)' : 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = isNext ? 28 : isHovered ? 20 : 14;
  ctx.shadowOffsetY = 6;

  // 2. High-contrast tablet background
  drawRoundRect(ctx, margin, margin, w, h, r);
  const grad = ctx.createLinearGradient(0, margin, 0, margin + h);
  if (isNext) {
    grad.addColorStop(0, '#2e1803');
    grad.addColorStop(0.5, '#190c01');
    grad.addColorStop(1, '#100700');
  } else if (isHovered) {
    grad.addColorStop(0, '#0c2238');
    grad.addColorStop(0.5, '#071626');
    grad.addColorStop(1, '#030c14');
  } else {
    grad.addColorStop(0, '#1c1917');
    grad.addColorStop(0.5, '#141210');
    grad.addColorStop(1, '#0a0807');
  }
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 3. Ornate outer carved border
  drawRoundRect(ctx, margin, margin, w, h, r);
  ctx.lineWidth = isNext ? 14 : isHovered ? 14 : 10;
  ctx.strokeStyle = isNext ? '#f59e0b' : isHovered ? '#38bdf8' : '#d97706';
  ctx.stroke();

  // 4. Subtle inner gold filigree rim
  const innerMargin = margin + pad;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const innerR = Math.max(8, r - pad);
  drawRoundRect(ctx, innerMargin, innerMargin, innerW, innerH, innerR);
  ctx.lineWidth = 3;
  ctx.strokeStyle = isNext ? 'rgba(254, 240, 138, 0.7)' : isHovered ? 'rgba(186, 230, 253, 0.6)' : 'rgba(251, 191, 36, 0.4)';
  ctx.stroke();

  // 5. Corner decorative gold rivets
  const studRadius = 6;
  const studOffset = margin + 24;
  ctx.fillStyle = isNext ? '#fef08a' : isHovered ? '#7dd3fc' : '#f59e0b';
  [
    [studOffset, studOffset],
    [size - studOffset, studOffset],
    [studOffset, size - studOffset],
    [size - studOffset, size - studOffset],
  ].forEach(([sx, sy]) => {
    ctx.beginPath();
    ctx.arc(sx, sy, studRadius, 0, Math.PI * 2);
    ctx.fill();
  });

  // 6. Huge, bold, high-contrast letter
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.floor(size * 0.60); // 307px bold glyph!
  ctx.font = `900 ${fontSize}px "Baloo 2", "Nunito", "Segoe UI", system-ui, sans-serif`;

  // Heavy dark stroke/outline behind letter for 100% legibility against any background
  ctx.lineWidth = 22;
  ctx.strokeStyle = '#000000';
  ctx.strokeText(safeGlyph, size / 2, size / 2 + size * 0.02);

  // Luminous text fill
  ctx.fillStyle = isNext ? '#fef08a' : isHovered ? '#ffffff' : '#fef9c3';
  ctx.fillText(safeGlyph, size / 2, size / 2 + size * 0.02);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.anisotropy = 4;
  return texture;
}

export default function GlyphKeystone({
  glyph,
  position = [0, 0, 0],
  isNext = false,
  isCollected = false,
  onCollect,
}) {
  const meshRef = useRef();
  const [isHovered, setIsHovered] = useState(false);

  const texture = useMemo(() => {
    return createRuneFaceTexture(glyph, isNext, isHovered);
  }, [glyph, isNext, isHovered]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    if (isCollected) {
      meshRef.current.scale.multiplyScalar(0.85);
      if (meshRef.current.scale.x < 0.05) {
        meshRef.current.visible = false;
      }
      return;
    }

    // Gentle floating levitation bob (NO continuous spinning Y-axis spin!)
    // Letters stay strictly upright and facing the player at all times
    meshRef.current.position.y =
      1.38 + Math.sin(state.clock.elapsedTime * 2.2 + position[0]) * 0.05;

    // Subtle horizontal convergence toward center aisle for optimal camera angle
    const targetRotY = -position[0] * 0.06;
    meshRef.current.rotation.y = targetRotY;
    // Upward tilt (~14 deg) directly aligning with elevated camera position
    meshRef.current.rotation.x = -0.24;

    // Active target pulse
    if (isNext) {
      const pulse = 1.06 + Math.sin(state.clock.elapsedTime * 4.0) * 0.04;
      meshRef.current.scale.set(pulse, pulse, pulse);
    } else {
      meshRef.current.scale.set(1.0, 1.0, 1.0);
    }
  });

  if (isCollected && meshRef.current && meshRef.current.scale.x < 0.05) return null;

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (!isCollected && onCollect) onCollect(glyph);
      }}
      onPointerOver={() => {
        setIsHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setIsHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* 1. Stone Altar Pedestal (firmly rooted to the cobblestone floor, kept cleanly below tablet) */}
      <group position={[0, 0, 0]}>
        {/* Foundation slab */}
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[1.2, 0.16, 1.2]} />
          <meshStandardMaterial color="#2d2824" roughness={0.9} />
        </mesh>
        {/* Stepped stone pillar shaft */}
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.38, 0.46, 0.16, 8]} />
          <meshStandardMaterial color="#443d37" roughness={0.85} />
        </mesh>
        {/* Capital plinth with carved rim */}
        <mesh position={[0, 0.36, 0]}>
          <cylinderGeometry args={[0.44, 0.38, 0.08, 8]} />
          <meshStandardMaterial
            color="#3a332d"
            metalness={0.15}
            roughness={0.7}
          />
        </mesh>

        {/* Luminous golden ritual ring on floor around the pedestal base when next target */}
        {isNext && (
          <group position={[0, 0.02, 0]}>
            {/* Ground ring marker */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.85, 1.25, 32]} />
              <meshBasicMaterial color="#f59e0b" transparent opacity={0.85} side={2} />
            </mesh>
            {/* Outer golden boundary accent ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.32, 1.42, 32]} />
              <meshBasicMaterial color="#fbbf24" transparent opacity={0.4} side={2} />
            </mesh>
            {/* Warm golden pedestal floor glow */}
            <pointLight position={[0, 0.2, 0]} color="#f59e0b" intensity={2.0} distance={2.5} />
          </group>
        )}
      </group>

      {/* 2. Upright Rune Keystone Tablet (faces camera, crystal-clear high-contrast glyph) */}
      <group ref={meshRef} position={[0, 1.38, 0]}>
        {/* Solid Ancient Stone Tablet */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.3, 1.3, 0.32]} />
          <meshStandardMaterial
            color={isNext ? '#352414' : isHovered ? '#1e293b' : '#221e1a'}
            roughness={0.65}
            metalness={0.25}
            emissive={isNext ? '#b45309' : isHovered ? '#0284c7' : '#000000'}
            emissiveIntensity={isNext ? 0.45 : isHovered ? 0.25 : 0}
          />
        </mesh>

        {/* Front High-Contrast Rune Face */}
        <mesh position={[0, 0, 0.165]}>
          <planeGeometry args={[1.26, 1.26]} />
          <meshBasicMaterial map={texture} transparent />
        </mesh>

        {/* Back Rune Face (visible during victory orbit) */}
        <mesh position={[0, 0, -0.165]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.26, 1.26]} />
          <meshBasicMaterial map={texture} transparent />
        </mesh>

        {/* Active Rune Target Indicator Beacon above tablet */}
        {isNext && (
          <group position={[0, 0.95, 0]}>
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.22, 0.22, 0.06]} />
              <meshBasicMaterial color="#fef08a" />
            </mesh>
            <pointLight
              position={[0, 0, 0.3]}
              color="#f59e0b"
              intensity={1.5}
              distance={3.5}
            />
          </group>
        )}
      </group>
    </group>
  );
}
