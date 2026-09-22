import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function SkyCloudEnvironment() {
  const starsRef = useRef();

  useFrame((state, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group>
      {/* 1. Pastel Sky Dome */}
      <mesh>
        <sphereGeometry args={[75, 24, 24]} />
        <meshBasicMaterial color="#bae6fd" side={1} />
      </mesh>

      {/* 2. Rainbow Arch in Distance */}
      <group position={[0, 10, -25]}>
        {['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#c084fc'].map((color, idx) => (
          <mesh key={`rainbow-${idx}`} rotation={[0, 0, 0]}>
            <ringGeometry args={[16 + idx * 0.5, 16.5 + idx * 0.5, 32, 1, 0, Math.PI]} />
            <meshBasicMaterial color={color} side={2} transparent opacity={0.65} />
          </mesh>
        ))}
      </group>

      {/* 3. Golden Summit Star */}
      <group position={[0, 14, -2]}>
        <mesh>
          <octahedronGeometry args={[1.5, 0]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#f59e0b"
            emissiveIntensity={0.8}
            metalness={0.7}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* 4. Twinkling Starlight Field */}
      <points ref={starsRef}>
        <sphereGeometry args={[70, 32, 32]} />
        <pointsMaterial color="#ffffff" size={0.4} sizeAttenuation transparent opacity={0.7} />
      </points>
    </group>
  );
}
