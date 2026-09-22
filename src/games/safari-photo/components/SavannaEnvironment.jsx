import React from 'react';

export default function SavannaEnvironment() {
  return (
    <group>
      {/* 1. Golden Savanna Sunset Sky */}
      <mesh>
        <sphereGeometry args={[75, 24, 24]} />
        <meshBasicMaterial color="#fed7aa" side={1} />
      </mesh>

      {/* 2. Golden Grass Plain Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[90, 90, 24, 24]} />
        <meshStandardMaterial color="#ca8a04" roughness={0.9} />
      </mesh>

      {/* 3. Blue Watering Hole */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.5, 0.02, -2.5]}>
        <circleGeometry args={[3.2, 32]} />
        <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.7} />
      </mesh>

      {/* 4. Pride Rock Rocky Outcrop on Left */}
      <group position={[-5, 0, -4]}>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[4.5, 1.2, 3.5]} />
          <meshStandardMaterial color="#78716c" roughness={0.85} />
        </mesh>
        <mesh position={[0.6, 1.2, 0.2]}>
          <boxGeometry args={[3.2, 0.6, 2.5]} />
          <meshStandardMaterial color="#57534e" roughness={0.85} />
        </mesh>
      </group>

      {/* 5. Flat-topped Acacia Tree */}
      <group position={[1.5, 0, -7]}>
        {/* Trunk */}
        <mesh position={[0, 2.2, 0]}>
          <cylinderGeometry args={[0.2, 0.4, 4.4, 8]} />
          <meshStandardMaterial color="#713f12" roughness={0.9} />
        </mesh>
        {/* Flat wide canopy disc */}
        <mesh position={[0, 4.5, 0]}>
          <cylinderGeometry args={[3.5, 3.8, 0.8, 16]} />
          <meshStandardMaterial color="#15803d" roughness={0.8} />
        </mesh>
      </group>

      {/* Another distant acacia */}
      <group position={[-9, 0, -12]} scale={0.75}>
        <mesh position={[0, 2.2, 0]}>
          <cylinderGeometry args={[0.2, 0.4, 4.4, 8]} />
          <meshStandardMaterial color="#713f12" roughness={0.9} />
        </mesh>
        <mesh position={[0, 4.5, 0]}>
          <cylinderGeometry args={[3.5, 3.8, 0.8, 16]} />
          <meshStandardMaterial color="#166534" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
