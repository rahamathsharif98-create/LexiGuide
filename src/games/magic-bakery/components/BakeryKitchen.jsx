import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function BakeryKitchen({ isBakeComplete = false }) {
  const sprinkleRef = useRef();

  useFrame((state, delta) => {
    if (isBakeComplete && sprinkleRef.current) {
      const positions = sprinkleRef.current.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= delta * 3.5;
        if (positions[i] < 0) {
          positions[i] = 12;
        }
      }
      sprinkleRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* 1. Cozy Pastel Bakery Wall */}
      <mesh position={[0, 5, -10]}>
        <planeGeometry args={[35, 20]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.8} />
      </mesh>

      {/* 2. Bakery Wooden Shelf with Jars */}
      <group position={[0, 6, -9.5]}>
        <mesh>
          <boxGeometry args={[14, 0.4, 1.2]} />
          <meshStandardMaterial color="#b45309" roughness={0.7} />
        </mesh>
        {/* Colorful Jars */}
        {[-4, -2, 0, 2, 4].map((x, i) => (
          <mesh key={`jar-${i}`} position={[x, 0.6, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.8, 16]} />
            <meshStandardMaterial
              color={['#fb7185', '#38bdf8', '#fbbf24', '#a855f7', '#34d399'][i]}
              roughness={0.2}
              transparent
              opacity={0.85}
            />
          </mesh>
        ))}
      </group>

      {/* 3. Bakery Countertop Table */}
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[26, 0.8, 16]} />
        <meshStandardMaterial color="#d97706" roughness={0.6} />
      </mesh>

      {/* 4. Silver Cake Pedestal Plate in Center */}
      <group position={[0, 0, 0]}>
        {/* Base disc */}
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[2.8, 3.2, 0.1, 32]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Pedestal stem */}
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.6, 1.1, 0.5, 24]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Top platter disc */}
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[3.2, 3.2, 0.1, 32]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>

      {/* 5. Bakery Oven on the Side */}
      <group position={[-8, 2, -6]}>
        {/* Oven body */}
        <mesh>
          <boxGeometry args={[3.5, 4, 3]} />
          <meshStandardMaterial color="#78350f" roughness={0.9} />
        </mesh>
        {/* Oven window */}
        <mesh position={[0, 0.2, 1.52]}>
          <planeGeometry args={[2.2, 1.8]} />
          <meshStandardMaterial
            color="#ea580c"
            emissive="#ea580c"
            emissiveIntensity={0.8}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* 6. Celebration Confetti / Sprinkles Falling */}
      {isBakeComplete && (
        <points ref={sprinkleRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={60}
              array={
                new Float32Array(
                  Array.from({ length: 180 }, (_, i) =>
                    i % 3 === 1 ? Math.random() * 12 : (Math.random() - 0.5) * 12
                  )
                )
              }
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial color="#f43f5e" size={0.35} sizeAttenuation />
        </points>
      )}
    </group>
  );
}
