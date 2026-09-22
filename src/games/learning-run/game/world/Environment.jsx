import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import BlueFlame from '../effects/BlueFlame';
import { useAppStore } from '../engine/appStore';

// Static-ish backdrop: sky gradient dome, distant temple, floating islands and
// pillars with blue flames. These sit far from the play lanes and don't need
// per-frame recycling — they subtly drift for a "floating" feel.

// A soft, fully-procedural cloud made of overlapping low-poly spheres.
// Deliberately avoids drei's <Cloud>, which fetches a texture from an
// external CDN — that fetch fails (and crashes the scene) in sandboxed or
// network-restricted environments, so everything here is geometry + color.
function ProceduralCloud({ position = [0, 0, 0], scale = 1, color = '#eaf7ff', opacity = 0.55, puffs = 6, seed = 0 }) {
  const group = useRef();
  const offsets = useMemo(
    () =>
      new Array(puffs).fill(0).map((_, i) => {
        const angle = (i / puffs) * Math.PI * 2 + seed;
        const radius = 1.2 + ((i * 53 + seed * 17) % 10) / 10;
        return {
          x: Math.cos(angle) * radius,
          y: ((i * 29 + seed * 11) % 10) / 10 - 0.3,
          z: Math.sin(angle) * radius * 0.6,
          r: 0.9 + ((i * 37 + seed * 7) % 10) / 14,
        };
      }),
    [puffs, seed]
  );

  useFrame((state) => {
    if (group.current) {
      group.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 0.03 + seed) * 2;
    }
  });

  return (
    <group ref={group} position={position} scale={scale}>
      {offsets.map((o, i) => (
        <mesh key={i} position={[o.x, o.y, o.z]}>
          <sphereGeometry args={[o.r, 10, 10]} />
          <meshStandardMaterial color={color} transparent opacity={opacity} depthWrite={false} roughness={1} fog={false} />
        </mesh>
      ))}
    </group>
  );
}

function FloatingIsland({ position, scale = 1, seed = 0 }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.3 + seed) * 0.4;
      ref.current.rotation.y = state.clock.elapsedTime * 0.02 + seed;
    }
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      {/* Rocky cliff base */}
      <mesh castShadow receiveShadow>
        <coneGeometry args={[2.4, 1.8, 7]} />
        <meshStandardMaterial color="#78593a" roughness={0.9} />
      </mesh>
      {/* Lush grassy safari top plateau */}
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[2.6, 2.6, 0.4, 7]} />
        <meshStandardMaterial color="#4ade80" roughness={0.8} />
      </mesh>
      {/* Safari palm / tropical foliage on island */}
      <mesh position={[0.6, 1.35, 0.4]}>
        <coneGeometry args={[0.55, 1.2, 6]} />
        <meshStandardMaterial color="#16a34a" roughness={0.75} />
      </mesh>
      <mesh position={[-0.7, 1.2, -0.3]}>
        <coneGeometry args={[0.45, 1.0, 6]} />
        <meshStandardMaterial color="#22c55e" roughness={0.75} />
      </mesh>
    </group>
  );
}

function TempleSilhouette() {
  return (
    <group position={[0, 2, -140]}>
      {/* Ancient Safari Golden Sandstone Temple */}
      <mesh position={[0, 6, 0]}>
        <boxGeometry args={[16, 12, 12]} />
        <meshStandardMaterial color="#b08968" roughness={0.75} />
      </mesh>
      {/* Stepped pyramid roof */}
      <mesh position={[0, 13.5, 0]}>
        <coneGeometry args={[10, 7, 4]} />
        <meshStandardMaterial color="#c29f68" roughness={0.7} />
      </mesh>
      {/* Temple columns */}
      {[-6, -3, 0, 3, 6].map((x) => (
        <mesh key={x} position={[x, 3, 6.2]}>
          <cylinderGeometry args={[0.5, 0.55, 8, 8]} />
          <meshStandardMaterial color="#dfc396" roughness={0.7} />
        </mesh>
      ))}
      <BlueFlame position={[-6, 7.5, 6.2]} scale={1.5} intense />
      <BlueFlame position={[6, 7.5, 6.2]} scale={1.5} intense />
    </group>
  );
}

export default function Environment() {
  const selectedWorld = useAppStore((s) => s.selectedWorld);
  // Vibrant, cheerful light green safari daylight theme
  const skyColor = '#86efac';      // Cheerful light green sky
  const fogColor = '#bbf7d0';      // Soft mint green mist
  const ambientColor = '#f0fdf4';  // Clean bright ambient daylight
  const sparklesColor = '#fbbf24'; // Golden jungle motes/fireflies

  const islands = useMemo(
    () =>
      new Array(10).fill(0).map((_, i) => ({
        position: [((i % 2 === 0 ? -1 : 1) * (14 + (i % 5) * 3)), -3 - (i % 3), -20 - i * 22],
        scale: 1.4 + ((i * 37) % 10) / 10,
        seed: i,
      })),
    []
  );

  const pillars = useMemo(
    () =>
      new Array(14).fill(0).map((_, i) => ({
        side: i % 2 === 0 ? -1 : 1,
        z: -6 - i * 16,
      })),
    []
  );

  return (
    <group>
      {/* Light Green Atmosphere Dome */}
      <mesh scale={[1, 1, 1]}>
        <sphereGeometry args={[300, 24, 24]} />
        <meshBasicMaterial color={skyColor} side={THREE.BackSide} fog={false} />
      </mesh>

      {/* Gentle mint green horizon fog */}
      <fog attach="fog" args={[fogColor, 35, 230]} />

      {/* Bright warm daylight & sun */}
      <ambientLight intensity={0.95} color={ambientColor} />
      <directionalLight position={[35, 45, 15]} intensity={1.35} color="#fffdf2" castShadow />
      <hemisphereLight args={['#bbf7d0', '#15803d', 0.65]} />

      {/* Soft procedural white clouds */}
      <ProceduralCloud position={[-18, 16, -60]} scale={2.4} opacity={0.55} color="#ffffff" puffs={7} seed={1} />
      <ProceduralCloud position={[20, 14, -100]} scale={2.8} opacity={0.5} color="#ffffff" puffs={8} seed={2} />
      <ProceduralCloud position={[0, 12, -35]} scale={2.0} opacity={0.45} color="#f0fdf4" puffs={6} seed={3} />

      {/* Golden jungle motes & safari sparkles */}
      <Sparkles count={35} scale={[40, 22, 170]} position={[0, 6, -60]} speed={0.2} size={2.5} color={sparklesColor} opacity={0.7} />

      <TempleSilhouette />

      {islands.map((isl, i) => (
        <FloatingIsland key={i} {...isl} />
      ))}

      {/* Ancient Safari Sandstone Pillars with moss accents */}
      {pillars.map((p, i) => (
        <group key={i} position={[p.side * 6.2, -0.2, p.z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.38, 0.5, 3.6, 8]} />
            <meshStandardMaterial color="#c2a679" roughness={0.75} />
          </mesh>
          {/* Mossy ivy wrap ring */}
          <mesh position={[0, 0.4, 0]}>
            <torusGeometry args={[0.46, 0.08, 8, 16]} />
            <meshStandardMaterial color="#2d6a4f" roughness={0.85} />
          </mesh>
          <BlueFlame position={[0, 2.0, 0]} scale={0.9} intense={i % 4 === 0} />
        </group>
      ))}
    </group>
  );
}
