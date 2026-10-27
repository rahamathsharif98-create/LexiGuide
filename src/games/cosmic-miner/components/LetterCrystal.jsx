import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Creates an ultra-clear, high-contrast, large letter texture for space crystals.
 * Renders on a crisp 512x512 canvas with a dark cosmic glass tablet backdrop,
 * glowing neon cyan/amber border, and huge bold dyslexia-friendly centered typography.
 */
function createLetterBadgeTexture(letter, isNext, isHovered) {
  if (typeof document === 'undefined') return null;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const safeLetter = (letter || '').toUpperCase().trim();
  const center = size / 2;
  const radius = size * 0.43; // 220px radius circle

  ctx.clearRect(0, 0, size, size);

  // 1. Radial glow aura behind badge
  const glowGrad = ctx.createRadialGradient(center, center, radius * 0.65, center, center, size * 0.49);
  glowGrad.addColorStop(0, isNext ? 'rgba(245, 158, 11, 0.55)' : isHovered ? 'rgba(56, 189, 248, 0.45)' : 'rgba(14, 165, 233, 0.3)');
  glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(center, center, size * 0.49, 0, Math.PI * 2);
  ctx.fill();

  // 2. High-contrast dark badge circular foundation
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  const badgeGrad = ctx.createLinearGradient(0, center - radius, 0, center + radius);
  if (isNext) {
    badgeGrad.addColorStop(0, '#2e1803');
    badgeGrad.addColorStop(0.5, '#190c01');
    badgeGrad.addColorStop(1, '#0c0500');
  } else if (isHovered) {
    badgeGrad.addColorStop(0, '#0c2847');
    badgeGrad.addColorStop(0.5, '#071b30');
    badgeGrad.addColorStop(1, '#030e1c');
  } else {
    badgeGrad.addColorStop(0, '#0a1626');
    badgeGrad.addColorStop(0.5, '#060f1c');
    badgeGrad.addColorStop(1, '#020710');
  }
  ctx.fillStyle = badgeGrad;
  ctx.fill();

  // 3. Glowing neon outer border ring
  ctx.beginPath();
  ctx.arc(center, center, radius - 4, 0, Math.PI * 2);
  ctx.lineWidth = isNext ? 14 : isHovered ? 12 : 9;
  ctx.strokeStyle = isNext ? '#fbbf24' : isHovered ? '#38bdf8' : '#0ea5e9';
  ctx.shadowColor = isNext ? '#f59e0b' : isHovered ? '#38bdf8' : '#0284c7';
  ctx.shadowBlur = isNext ? 22 : isHovered ? 16 : 10;
  ctx.stroke();

  // 4. Subtle inner accent ring
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.beginPath();
  ctx.arc(center, center, radius - 18, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = isNext ? 'rgba(254, 240, 138, 0.7)' : isHovered ? 'rgba(186, 230, 253, 0.6)' : 'rgba(125, 211, 252, 0.35)';
  ctx.stroke();

  // 5. Giant bold typography
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.floor(size * 0.58); // ~297px
  ctx.font = `900 ${fontSize}px "Baloo 2", "Nunito", "Segoe UI", system-ui, sans-serif`;

  // Heavy dark stroke for maximum contrast against any lighting
  ctx.lineWidth = 26;
  ctx.strokeStyle = '#000000';
  ctx.strokeText(safeLetter, center, center + size * 0.02);

  // Brilliant luminous letter fill
  ctx.fillStyle = isNext ? '#fef08a' : isHovered ? '#ffffff' : '#f0f9ff';
  ctx.fillText(safeLetter, center, center + size * 0.02);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.anisotropy = 4;
  return texture;
}

export default function LetterCrystal({
  letter,
  position = [0, 0, 0],
  isNext = false,
  isCollected = false,
  onCollect,
}) {
  const groupRef = useRef();
  const crystalMeshRef = useRef();
  const billboardRef = useRef();
  const [isHovered, setIsHovered] = useState(false);

  const badgeTexture = useMemo(() => {
    return createLetterBadgeTexture(letter, isNext, isHovered);
  }, [letter, isNext, isHovered]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (isCollected) {
      groupRef.current.scale.multiplyScalar(0.85);
      if (groupRef.current.scale.x < 0.05) {
        groupRef.current.visible = false;
      }
      return;
    }

    // 1. Gentle low-gravity vertical bobbing
    const bob = Math.sin(state.clock.elapsedTime * 2.2 + position[0] * 1.5) * 0.12;
    groupRef.current.position.y = position[1] + bob;

    // 2. Crystal gem gently shimmers and spins on its own axis
    if (crystalMeshRef.current) {
      crystalMeshRef.current.rotation.y += delta * 0.8;
      crystalMeshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.08;
    }

    // 3. Billboarding: The letter badge ALWAYS faces directly toward the gameplay camera
    // This completely eliminates perspective distortion, oblique slants, and upside-down rotations!
    if (billboardRef.current && state.camera) {
      billboardRef.current.quaternion.copy(state.camera.quaternion);
    }

    // 4. Subtle pulse for active target crystal
    if (isNext) {
      const pulse = 1.05 + Math.sin(state.clock.elapsedTime * 4.0) * 0.05;
      groupRef.current.scale.set(pulse, pulse, pulse);
    } else {
      groupRef.current.scale.set(1.0, 1.0, 1.0);
    }
  });

  if (isCollected && groupRef.current && groupRef.current.scale.x < 0.05) return null;

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (!isCollected && onCollect) onCollect();
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
      {/* 1. Gleaming 3D Octahedron Space Crystal */}
      <mesh ref={crystalMeshRef} scale={[1.1, 1.25, 1.1]}>
        <octahedronGeometry args={[0.92, 0]} />
        <meshStandardMaterial
          color={isNext ? '#f59e0b' : isHovered ? '#38bdf8' : '#0ea5e9'}
          emissive={isNext ? '#d97706' : isHovered ? '#0284c7' : '#0369a1'}
          emissiveIntensity={isNext ? 0.75 : isHovered ? 0.6 : 0.4}
          roughness={0.15}
          metalness={0.8}
          transparent
          opacity={0.78}
        />
      </mesh>

      {/* 2. Camera-Billboarded Ultra-Clear Letter Face Badge */}
      {/* Rendered with depthTest={false} & high renderOrder to guarantee 100% unoccluded legibility */}
      <group ref={billboardRef} position={[0, 0, 0]}>
        <mesh renderOrder={20}>
          <planeGeometry args={[1.35, 1.35]} />
          <meshBasicMaterial
            map={badgeTexture}
            transparent
            depthTest={false}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 3. Glowing Target Ring on Ground when active next letter */}
      {isNext && (
        <group position={[0, -0.85, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.15, 1.5, 32]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.75} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.55, 1.68, 32]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
          <pointLight color="#f59e0b" intensity={1.8} distance={3.0} />
        </group>
      )}
    </group>
  );
}
