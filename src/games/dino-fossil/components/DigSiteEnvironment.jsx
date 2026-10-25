import React from 'react';
import DinoFossilSpecimen from './DinoFossilSpecimen';

export default function DigSiteEnvironment({ target, isExcavated = false }) {

  return (
    <group>
      {/* 1. Desert Dig Sky Dome */}
      <mesh>
        <sphereGeometry args={[75, 24, 24]} />
        <meshBasicMaterial color="#fde047" side={1} />
      </mesh>

      {/* 2. Sand Bedrock Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[90, 90, 24, 24]} />
        <meshStandardMaterial color="#d97706" roughness={0.9} />
      </mesh>

      {/* 3. Central Excavation Pit (Depression) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[2.5, 4.5, 24]} />
        <meshStandardMaterial color="#b45309" roughness={0.95} />
      </mesh>

      {/* 4. Wooden Boundary Stakes with Flags */}
      {[-5, 5].map((x) =>
        [-5, 5].map((z) => (
          <group key={`stake-${x}-${z}`} position={[x, 0, z]}>
            {/* Wooden Stake */}
            <mesh position={[0, 0.9, 0]}>
              <cylinderGeometry args={[0.1, 0.12, 1.8, 8]} />
              <meshStandardMaterial color="#78350f" roughness={0.8} />
            </mesh>
            {/* Surveyor Flag */}
            <mesh position={[0.25, 1.6, 0]}>
              <boxGeometry args={[0.5, 0.35, 0.04]} />
              <meshStandardMaterial color="#ef4444" />
            </mesh>
          </group>
        ))
      )}

      {/* 5. Center Prehistoric Specimen in Excavation Pit */}
      <DinoFossilSpecimen target={target} isExcavated={isExcavated} />

      {/* 6. Expedition Camp (Left Horizon) */}
      <group position={[-12, 0, -8]}>
        {/* Safari Expedition Canvas Tent */}
        <mesh position={[0, 1.6, 0]} rotation={[0, 0.4, 0]}>
          <coneGeometry args={[2.8, 3.2, 4]} />
          <meshStandardMaterial color="#fde68a" roughness={0.9} />
        </mesh>
        {/* Tent Pole */}
        <mesh position={[0, 1.6, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 3.4, 8]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        {/* Campfire with Stone Ring */}
        <group position={[3.2, 0, 1.8]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <ringGeometry args={[0.6, 0.9, 12]} />
            <meshStandardMaterial color="#57534e" roughness={0.9} />
          </mesh>
          {/* Logs */}
          <mesh position={[0, 0.15, 0]} rotation={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 1.2, 6]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
          {/* Campfire Flame */}
          <mesh position={[0, 0.4, 0]}>
            <coneGeometry args={[0.3, 0.7, 8]} />
            <meshBasicMaterial color="#f97316" />
          </mesh>
          <pointLight position={[0, 0.6, 0]} intensity={0.8} color="#f97316" distance={6} />
        </group>
      </group>

      {/* 7. Dramatic Canyon Mesa Cliffs (Backdrop) */}
      <group position={[0, 0, -28]}>
        {/* Mesa 1 */}
        <mesh position={[-18, 6, 0]}>
          <cylinderGeometry args={[8, 11, 14, 8]} />
          <meshStandardMaterial color="#b45309" roughness={0.95} />
        </mesh>
        {/* Mesa 2 */}
        <mesh position={[16, 8, -4]}>
          <cylinderGeometry args={[10, 13, 18, 8]} />
          <meshStandardMaterial color="#9a3412" roughness={0.95} />
        </mesh>
        {/* Natural Canyon Arch Bridge */}
        <mesh position={[0, 8, -2]} rotation={[0, 0, 0]}>
          <torusGeometry args={[8, 2.2, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#c2410c" roughness={0.95} />
        </mesh>
      </group>

      {/* 8. Prehistoric Desert Fern Plants */}
      {[-8, 8, -6, 9].map((px, i) => (
        <group key={`fern-${i}`} position={[px, 0, (i % 2 === 0 ? 6 : -4) + i]}>
          <mesh position={[0, 0.6, 0]} rotation={[0.2 * i, i, 0]}>
            <coneGeometry args={[0.8, 1.4, 6]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* 9. Tool Crate & Shovel */}
      <group position={[-4, 0.4, 2]}>
        <mesh>
          <boxGeometry args={[1.4, 0.8, 1.0]} />
          <meshStandardMaterial color="#92400e" roughness={0.8} />
        </mesh>
        <mesh position={[0.2, 0.6, 0]} rotation={[0.4, 0, 0.3]}>
          <cylinderGeometry args={[0.05, 0.05, 1.6, 8]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      </group>
    </group>
  );
}
