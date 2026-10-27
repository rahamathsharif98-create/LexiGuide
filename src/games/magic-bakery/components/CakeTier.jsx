import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Exact Geometric Constants for Flush, Gap-Free Cake Stacking (Scaled ~22%)
// ─────────────────────────────────────────────────────────────────────────────
export const TIER_GEOMETRY = {
  SPONGE_HEIGHT: 0.52,
  FROSTING_HEIGHT: 0.06,
  TOTAL_HEIGHT: 0.58,
  PLATTER_Y: 0.70,
  MAX_RADIUS: 1.80,
  MIN_RADIUS: 1.05,
  DISTRACTOR_RADIUS: 1.15,
  LABEL_OFFSET: 0.04,

  /**
   * Calculates the exact Y position for a stacked tier so it rests flush
   * on the platter (stackIndex 0) or atop the previous tier with zero gap.
   */
  getTargetY: (stackIndex = 0) => 0.70 + stackIndex * 0.58,

  /**
   * Computes proportional tier radius so base tier is widest and top tier
   * is narrowest, matching traditional tiered celebratory cakes.
   */
  getTierRadius: (order = 0, totalTiers = 2) => {
    if (order === -1) return 1.15; // Distractor piece
    const count = Math.max(1, (totalTiers || 2) - 1);
    const ord = Math.max(0, order || 0);
    return 1.80 - (ord / count) * (1.80 - 1.05);
  },
};

/**
 * Draws a rounded rectangle path portably across all canvas implementations.
 */
function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

const textureCache = new Map();

/**
 * Returns dynamic font size based on syllable character length
 * to ensure wide multi-letter words (like WATER, BREAD) fit neatly
 * within the plaque without horizontal overflow.
 */
export function getSyllableFontSize(syllable) {
  const clean = (syllable || '').toUpperCase();
  return clean.length <= 2 ? 116 : clean.length === 3 ? 98 : clean.length === 4 ? 82 : 70;
}

/**
 * Creates a high-contrast confectionery nameplate plaque texture.
 * Uses ivory fondant backing with golden rim and bold dark lettering,
 * dynamically scaled so even 5-letter syllables (e.g. WATER, BREAD) never clip.
 */
export function createSyllableBadgeTexture(syllable, isStacked = false) {
  const clean = (syllable || '').toUpperCase();
  const cacheKey = `${clean}|${isStacked ? 'stacked' : 'counter'}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

  if (typeof document === 'undefined') {
    return new THREE.Texture();
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext ? canvas.getContext('2d') : null;

  if (ctx) {
    ctx.clearRect(0, 0, 512, 256);

    // 1. Pristine Fondant Plaque Backing
    ctx.fillStyle = '#ffffff';
    drawRoundRect(ctx, 16, 20, 480, 216, 36);
    ctx.fill();

    // 2. Confectionery Gold / Rose Border
    ctx.lineWidth = 12;
    ctx.strokeStyle = isStacked ? '#f59e0b' : '#fb7185';
    ctx.stroke();

    // 3. Inner Decorative Bevel
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fef08a';
    drawRoundRect(ctx, 26, 30, 460, 196, 26);
    ctx.stroke();

    // 4. Dynamic Auto-Scaled Font Sizing (prevents clipping on multi-letter syllables)
    let fontSize = getSyllableFontSize(clean);
    ctx.font = `900 ${fontSize}px "Baloo 2", "Nunito", "Segoe UI", system-ui, sans-serif`;

    let measuredWidth = ctx.measureText ? ctx.measureText(clean).width : 0;
    if (measuredWidth > 420) {
      fontSize = Math.floor(fontSize * (420 / measuredWidth));
      ctx.font = `900 ${fontSize}px "Baloo 2", "Nunito", "Segoe UI", system-ui, sans-serif`;
    }

    // 5. High-Contrast Dark Text (Deep Slate #0f172a)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(clean, 256, 128 + 4);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

export default function CakeTier({
  syllable,
  order = 0,
  totalTiers = 2,
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
    return createSyllableBadgeTexture(syllable, isStacked);
  }, [syllable, isStacked]);

  // Proportional tier radius: widest at base, tapering towards top
  const tierRadius = useMemo(() => {
    return TIER_GEOMETRY.getTierRadius(order, totalTiers);
  }, [order, totalTiers]);

  const badgeWidth = Math.min(1.65, Math.max(1.15, tierRadius * 0.95));
  const badgeHeight = 0.44;

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (isStacked) {
      // Smoothly drop onto cake pedestal stack with exact flush contact
      const targetY = TIER_GEOMETRY.getTargetY(stackIndex);
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, 0, 0.16);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.16);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, 0, 0.16);

      // Lock strictly facing front toward the child/camera (zero rotation)
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.2);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 0.2);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, 0.2);
    } else {
      // Gentle floating bobbing on side counter while strictly maintaining front-facing orientation
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetPos[0], 0.12);
      meshRef.current.position.y =
        targetPos[1] + Math.sin(state.clock.elapsedTime * 2.0 + targetPos[0]) * 0.04;
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetPos[2], 0.12);

      // Always maintain camera-facing orientation so letters never turn away from the child
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.2);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 0.2);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, 0.2);
    }

    // Birthday Candle flame flicker
    if (flameRef.current) {
      flameRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 14) * 0.22;
    }
  });

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
      {/* 0. Invisible expanded hit cylinder for effortless child tapping */}
      <mesh position={[0, 0.29, 0]}>
        <cylinderGeometry args={[tierRadius * 1.1, tierRadius * 1.1, 0.65, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* 1. Main Fluffy Cake Sponge (Height = 0.52, center at y = 0.26) */}
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[tierRadius, tierRadius * 1.03, 0.52, 32]} />
        <meshStandardMaterial color={color} roughness={0.65} />
      </mesh>

      {/* 2. Top Frosting Layer (Height = 0.06, center at y = 0.55, top at y = 0.58) */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[tierRadius * 1.02, tierRadius * 1.02, 0.06, 32]} />
        <meshStandardMaterial color={frostingColor} roughness={0.3} />
      </mesh>

      {/* 3. Decorative Whipped Cream Pearls around frosting rim (matching reference photo) */}
      <group position={[0, 0.56, 0]}>
        {Array.from({ length: 18 }).map((_, i) => {
          const angle = (i / 18) * Math.PI * 2;
          return (
            <mesh
              key={`pearl-${i}`}
              position={[
                Math.cos(angle) * (tierRadius * 0.98),
                0,
                Math.sin(angle) * (tierRadius * 0.98),
              ]}
            >
              <sphereGeometry args={[0.048, 8, 8]} />
              <meshStandardMaterial color="#fffef0" roughness={0.3} />
            </mesh>
          );
        })}
      </group>

      {/* 4. Syllable Nameplate Badge Front (Slightly outside surface to prevent z-fighting, strictly facing camera) */}
      <mesh position={[0, 0.26, tierRadius + TIER_GEOMETRY.LABEL_OFFSET]} rotation={[-0.18, 0, 0]}>
        <planeGeometry args={[badgeWidth, badgeHeight]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>

      {/* 5. Syllable Nameplate Badge Back */}
      <mesh
        position={[0, 0.26, -(tierRadius + TIER_GEOMETRY.LABEL_OFFSET)]}
        rotation={[0.18, Math.PI, 0]}
      >
        <planeGeometry args={[badgeWidth, badgeHeight]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>

      {/* 6. Birthday Candle on top of tier (Positioned at top of frosting y = 0.58) */}
      {isCandleTop && (
        <group position={[0, 0.58, 0]}>
          {/* Candle stick */}
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.6, 12]} />
            <meshStandardMaterial color="#f43f5e" />
          </mesh>
          {/* Candle wick */}
          <mesh position={[0, 0.64, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {/* Candle flame */}
          <mesh ref={flameRef} position={[0, 0.79, 0]}>
            <coneGeometry args={[0.1, 0.28, 12]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        </group>
      )}
    </group>
  );
}
