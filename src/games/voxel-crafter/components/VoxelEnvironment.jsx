import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function VoxelEnvironment({ isCrafted = false, rewardName = 'Trophy' }) {
  const trophyRef = useRef();
  const windmillBladesRef = useRef();
  const cloudsRef = useRef();
  const waterfallRef = useRef();

  useFrame((state, delta) => {
    // 1. Spinning Windmill Blades
    if (windmillBladesRef.current) {
      windmillBladesRef.current.rotation.z += delta * 1.5;
    }
    // 2. Trophy Animation on Victory
    if (isCrafted && trophyRef.current) {
      trophyRef.current.rotation.y += delta * 2.0;
      trophyRef.current.position.y = 2.4 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
    // 3. Drifting Clouds
    if (cloudsRef.current) {
      cloudsRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.15) * 2.0;
    }
    // 4. Waterfall Shimmer
    if (waterfallRef.current) {
      waterfallRef.current.position.y = -1.5 + Math.sin(state.clock.elapsedTime * 8) * 0.05;
    }
  });

  return (
    <group>
      {/* 1. Sky Dome */}
      <mesh>
        <sphereGeometry args={[80, 24, 24]} />
        <meshBasicMaterial color="#38bdf8" side={1} />
      </mesh>

      {/* 2. Floating Voxel Clouds */}
      <group ref={cloudsRef} position={[0, 9, -15]}>
        {[-9, 7].map((cx, idx) => (
          <group key={`cloud-${idx}`} position={[cx, (idx % 2) * 1.5, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[4.5, 1.3, 2.2]} />
              <meshStandardMaterial color="#ffffff" roughness={0.9} />
            </mesh>
            <mesh position={[1.2, 0.9, 0]}>
              <boxGeometry args={[2.8, 1.1, 1.9]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.9} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 3. Floating Island Ground Base (Floating Rock underneath grass) */}
      <group position={[0, -0.05, 0]}>
        {/* Grassy Top Island Surface */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[90, 90, 16, 16]} />
          <meshStandardMaterial color="#22c55e" roughness={0.8} />
        </mesh>
        {/* Stone Path to Table */}
        {[-3, -2, -1, 0, 1, 2, 3].map((pz, idx) => (
          <mesh key={`path-${idx}`} position={[0, 0.02, pz + 1.5]}>
            <boxGeometry args={[1.2, 0.04, 0.8]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* 4. ANIMATED SPINNING MEDIEVAL WINDMILL (Left Landmark) */}
      <group position={[-9.5, 0, -6]}>
        {/* Stone Windmill Base Tower */}
        <mesh position={[0, 2.5, 0]}>
          <cylinderGeometry args={[1.4, 2.0, 5, 8]} />
          <meshStandardMaterial color="#64748b" roughness={0.8} />
        </mesh>
        {/* Conical Wooden Roof */}
        <mesh position={[0, 5.5, 0]}>
          <coneGeometry args={[1.7, 1.8, 8]} />
          <meshStandardMaterial color="#b45309" roughness={0.7} />
        </mesh>
        {/* Windmill Hub & Rotating Blades */}
        <group position={[0, 4.4, 1.5]}>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.25, 8, 8]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
          <group ref={windmillBladesRef}>
            {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => (
              <group key={`blade-${idx}`} rotation={[0, 0, angle]}>
                <mesh position={[0, 1.5, 0.02]}>
                  <boxGeometry args={[0.3, 2.8, 0.05]} />
                  <meshStandardMaterial color="#fef08a" roughness={0.6} />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      </group>

      {/* 5. CASTLE FORTRESS TOWERS & BATTLEMENTS (Right Landmark) */}
      <group position={[9.5, 0, -7]}>
        {/* Main Stone Castle Tower */}
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[3.2, 6, 3.2]} />
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>
        {/* Tower Battlements */}
        {[-1.2, 0, 1.2].map((bx, idx) => (
          <mesh key={`bat-${idx}`} position={[bx, 6.3, 1.3]}>
            <boxGeometry args={[0.6, 0.6, 0.5]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        ))}
        {/* Castle Banner Flag */}
        <mesh position={[0, 7.5, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 2.4, 6]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh position={[0.4, 8.2, 0]}>
          <boxGeometry args={[0.8, 0.5, 0.04]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      </group>

      {/* 6. GLOWING STONE LANTERNS */}
      {[-2.2, 2.2].map((lx, idx) => (
        <group key={`lantern-${idx}`} position={[lx, 0, 3.8]}>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 1.4, 6]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[0, 1.45, 0]}>
            <boxGeometry args={[0.35, 0.45, 0.35]} />
            <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={0.8} />
          </mesh>
          <pointLight position={[0, 1.5, 0]} intensity={0.4} color="#fbbf24" distance={5} />
        </group>
      ))}

      {/* 7. VOXEL WATERFALL & MIST (Edge of Island) */}
      <group ref={waterfallRef} position={[0, 0, -9.5]}>
        <mesh position={[0, -2, 0]}>
          <boxGeometry args={[3.2, 5, 0.4]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.8} roughness={0.1} />
        </mesh>
        <mesh position={[0, -4.5, 0.4]}>
          <sphereGeometry args={[1.2, 8, 8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
      </group>

      {/* 8. Voxel Crafting Workbench in Center */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[3.2, 1.2, 2.2]} />
          <meshStandardMaterial color="#92400e" roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.22, 0]}>
          <boxGeometry args={[3.4, 0.08, 2.4]} />
          <meshStandardMaterial color="#b45309" roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.27, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.1, 2.1]} />
          <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* 9. Floating Voxel Crafted Trophy when completed */}
      {isCrafted && (
        <group ref={trophyRef} position={[0, 2.4, 0]}>
          <mesh>
            <octahedronGeometry args={[0.9, 0]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={1.0}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.3, 0.08, 16, 32]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <torusGeometry args={[1.5, 0.05, 16, 32]} />
            <meshBasicMaterial color="#67e8f9" />
          </mesh>
        </group>
      )}
    </group>
  );
}
