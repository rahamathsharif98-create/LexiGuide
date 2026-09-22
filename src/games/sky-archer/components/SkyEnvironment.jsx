import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function FloatingSkyIsland({ position = [0, 0, 0], scale = 1, seed = 0 }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.4 + seed) * 0.3;
    }
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      {/* Rocky earth base */}
      <mesh>
        <coneGeometry args={[2.5, 2.2, 7]} />
        <meshStandardMaterial color="#78593a" roughness={0.9} />
      </mesh>
      {/* Emerald grass cap */}
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[2.7, 2.7, 0.4, 7]} />
        <meshStandardMaterial color="#22c55e" roughness={0.8} />
      </mesh>
      {/* Little pine/palm tree */}
      <mesh position={[0.6, 1.7, 0.4]}>
        <coneGeometry args={[0.5, 1.3, 6]} />
        <meshStandardMaterial color="#15803d" />
      </mesh>
    </group>
  );
}

/**
 * Animated Steampunk Airship Cruising Across the Sky
 */
function SteampunkAirship({ position = [0, 12, -30] }) {
  const airshipRef = useRef();
  const propRef = useRef();

  useFrame((state, delta) => {
    if (airshipRef.current) {
      // Gentle cruise back and forth in horizon
      airshipRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.12) * 16;
      airshipRef.current.position.y = position[1] + Math.cos(state.clock.elapsedTime * 0.4) * 0.5;
    }
    if (propRef.current) {
      propRef.current.rotation.x += delta * 12;
    }
  });

  return (
    <group ref={airshipRef} position={position}>
      {/* Zeppelin Gas Bag */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[2.2, 7, 12, 16]} />
        <meshStandardMaterial color="#d97706" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Gondola Cabin below */}
      <mesh position={[0, -2.5, 0]}>
        <boxGeometry args={[3.2, 1.2, 1.4]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      {/* Cabin Windows */}
      {[-1, 0, 1].map((wx, i) => (
        <mesh key={`win-${i}`} position={[wx, -2.5, 0.72]}>
          <boxGeometry args={[0.5, 0.4, 0.05]} />
          <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.6} />
        </mesh>
      ))}
      {/* Rear Engine Propeller */}
      <group position={[-4.2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.2, 0.2, 0.5, 8]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        <group ref={propRef}>
          <mesh>
            <boxGeometry args={[0.08, 2.2, 0.3]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/**
 * 3D Curved Rainbow Arch
 */
function RainbowArch({ position = [0, 8, -45] }) {
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6'];
  return (
    <group position={position}>
      {colors.map((c, idx) => (
        <mesh key={`rainbow-${idx}`} rotation={[0, 0, 0]}>
          <torusGeometry args={[24 - idx * 0.6, 0.3, 8, 36, Math.PI]} />
          <meshBasicMaterial color={c} transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

export default function SkyEnvironment() {
  const islands = useMemo(
    () => [
      { position: [-14, -2, -28], scale: 1.4, seed: 1 },
      { position: [15, 2, -34], scale: 1.6, seed: 2 },
      { position: [-8, -6, -45], scale: 2.0, seed: 3 },
      { position: [12, -4, -50], scale: 1.8, seed: 4 },
      { position: [0, -8, -60], scale: 2.6, seed: 5 },
    ],
    []
  );

  return (
    <group>
      {/* Cheerful Pastel Sky Dome */}
      <mesh>
        <sphereGeometry args={[200, 16, 16]} />
        <meshBasicMaterial color="#7dd3fc" side={THREE.BackSide} />
      </mesh>

      <ambientLight intensity={0.9} color="#f0f9ff" />
      <directionalLight position={[20, 30, 20]} intensity={1.2} color="#fffbeb" />
      <hemisphereLight args={['#bae6fd', '#15803d', 0.5]} />

      {/* 3D Rainbow Arch in Horizon */}
      <RainbowArch position={[0, 2, -45]} />

      {/* Steampunk Airship Cruising */}
      <SteampunkAirship position={[0, 10, -32]} />

      {/* Distant floating sky islands */}
      {islands.map((isl, idx) => (
        <FloatingSkyIsland key={idx} {...isl} />
      ))}
    </group>
  );
}