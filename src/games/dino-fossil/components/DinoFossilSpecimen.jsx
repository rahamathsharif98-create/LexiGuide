import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * DinoFossilSpecimen
 * 3D Visual representations for completed prehistoric words:
 * - BONE: Recognizable 3D fossil bone with shaft and double-knob ends.
 * - TAIL: Segmented armored dinosaur tail that swishes.
 * - ROAR: Dinosaur character head with opening jaw and soundwave ripples.
 * - T-REX: Stylized Tyrannosaurus Rex skull and arms.
 * - CLAW: Sharp prehistoric talon claws.
 * - FANG: Curved prehistoric saber tooth with sharp enamel tip.
 * - HORN: Armored Triceratops brow horn curving upward.
 * - SPINE: Segmented vertebrae column with rising dorsal sail spines.
 * - TRACK: Ancient sandstone tablet with 3-toed dinosaur footprint.
 * - SKULL: Ancient fossilized dinosaur cranium with armored brow crest.
 */
export default function DinoFossilSpecimen({ target, isExcavated = false }) {
  const rootRef = useRef();
  const jawRef = useRef();
  const tailRef = useRef();

  useFrame((state, delta) => {
    if (!rootRef.current) return;
    const t = state.clock.elapsedTime;

    if (isExcavated) {
      // Gentle float and celebratory rotation
      rootRef.current.position.y = 1.1 + Math.sin(t * 3) * 0.15;
      rootRef.current.rotation.y += delta * 0.7;

      // Animate opening jaw for ROAR or T-REX
      if (jawRef.current) {
        jawRef.current.rotation.x = -0.35 + Math.sin(t * 6) * 0.15;
      }

      // Animate tail swish for TAIL
      if (tailRef.current) {
        tailRef.current.rotation.y = Math.sin(t * 5) * 0.45;
        tailRef.current.rotation.z = Math.cos(t * 2.5) * 0.15;
      }
    } else {
      // Resting in the excavation pit sand
      rootRef.current.position.y = 0.7;
      rootRef.current.rotation.y = 0;
      if (jawRef.current) jawRef.current.rotation.x = 0;
      if (tailRef.current) tailRef.current.rotation.y = 0;
    }
  });

  const boneColor = isExcavated ? '#fef08a' : '#fed7aa';
  const emissiveColor = isExcavated ? '#f59e0b' : '#000000';
  const emissiveInt = isExcavated ? 0.65 : 0;

  const targetId = target?.id || 'fossil-rex';

  // 1. BONE: Recognizable bone shape with central shaft and rounded double knobs on each end
  if (targetId === 'fossil-bone') {
    return (
      <group ref={rootRef} position={[0, 0.7, 0]} rotation={[0, 0.3, 0.2]}>
        {/* Central Bone Shaft */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 2.2, 16]} />
          <meshStandardMaterial
            color={boneColor}
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt}
            roughness={0.6}
          />
        </mesh>
        {/* Top Double Knobs */}
        <mesh position={[-0.24, 1.05, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color={boneColor}
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt}
            roughness={0.6}
          />
        </mesh>
        <mesh position={[0.24, 1.05, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color={boneColor}
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt}
            roughness={0.6}
          />
        </mesh>
        {/* Bottom Double Knobs */}
        <mesh position={[-0.24, -1.05, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color={boneColor}
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt}
            roughness={0.6}
          />
        </mesh>
        <mesh position={[0.24, -1.05, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color={boneColor}
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt}
            roughness={0.6}
          />
        </mesh>
      </group>
    );
  }

  // 2. TAIL: Armored, swishing dinosaur tail with dorsal spikes
  if (targetId === 'fossil-tail') {
    return (
      <group ref={rootRef} position={[0, 0.7, 0]}>
        <group ref={tailRef}>
          {/* Base Segment */}
          <mesh position={[0, 0.4, -0.6]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.65, 0.8, 8]} />
            <meshStandardMaterial
              color={isExcavated ? '#84cc16' : '#65a30d'}
              emissive={emissiveColor}
              emissiveIntensity={emissiveInt * 0.5}
              roughness={0.7}
            />
          </mesh>
          {/* Mid Segment */}
          <mesh position={[0, 0.8, 0]} rotation={[0.1, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.5, 0.8, 8]} />
            <meshStandardMaterial
              color={isExcavated ? '#84cc16' : '#65a30d'}
              emissive={emissiveColor}
              emissiveIntensity={emissiveInt * 0.5}
              roughness={0.7}
            />
          </mesh>
          {/* Tapering Tip */}
          <mesh position={[0, 1.3, 0.4]} rotation={[-0.3, 0, 0]}>
            <coneGeometry args={[0.25, 0.9, 8]} />
            <meshStandardMaterial
              color={isExcavated ? '#a3e635' : '#4d7c0f'}
              emissive={emissiveColor}
              emissiveIntensity={emissiveInt * 0.5}
              roughness={0.7}
            />
          </mesh>
          {/* Dorsal Spine Plates */}
          {[0, 0.4, 0.8, 1.2].map((y, i) => (
            <mesh key={`spike-${i}`} position={[0, 0.3 + y, -0.4 + i * 0.25]} rotation={[0.3, 0, 0]}>
              <coneGeometry args={[0.12, 0.35, 4]} />
              <meshStandardMaterial color="#facc15" roughness={0.4} />
            </mesh>
          ))}
        </group>
      </group>
    );
  }

  // 3. ROAR: Dinosaur character head with opening mouth & soundwave ripple
  if (targetId === 'fossil-roar') {
    return (
      <group ref={rootRef} position={[0, 0.8, 0]}>
        {/* Upper Cranium & Snout */}
        <mesh position={[0, 0.6, 0.2]}>
          <boxGeometry args={[1.5, 1.1, 2.0]} />
          <meshStandardMaterial
            color={isExcavated ? '#fb923c' : '#ea580c'}
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt}
            roughness={0.6}
          />
        </mesh>
        {/* Upper Snout with nostrils */}
        <mesh position={[0, 0.4, 1.4]}>
          <boxGeometry args={[1.1, 0.7, 1.1]} />
          <meshStandardMaterial
            color={isExcavated ? '#fb923c' : '#ea580c'}
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt}
            roughness={0.6}
          />
        </mesh>
        {/* Upper Sharp Teeth */}
        {[-0.35, 0, 0.35].map((tx, idx) => (
          <mesh key={`upper-tooth-${idx}`} position={[tx, 0.05, 1.5]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.07, 0.22, 6]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} />
          </mesh>
        ))}
        {/* Expressive Eyes */}
        <mesh position={[-0.65, 0.75, 0.5]}>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshStandardMaterial color={isExcavated ? '#fef08a' : '#1c1917'} />
        </mesh>
        <mesh position={[0.65, 0.75, 0.5]}>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshStandardMaterial color={isExcavated ? '#fef08a' : '#1c1917'} />
        </mesh>

        {/* Lower Jaw Hinged Open in a ROAR */}
        <group ref={jawRef} position={[0, 0, 0.4]}>
          <mesh position={[0, -0.3, 1.0]}>
            <boxGeometry args={[1.0, 0.3, 1.4]} />
            <meshStandardMaterial color={isExcavated ? '#ea580c' : '#c2410c'} roughness={0.7} />
          </mesh>
          {/* Lower Sharp Teeth */}
          {[-0.3, 0, 0.3].map((tx, idx) => (
            <mesh key={`lower-tooth-${idx}`} position={[tx, -0.1, 1.4]}>
              <coneGeometry args={[0.07, 0.22, 6]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} />
            </mesh>
          ))}
        </group>

        {/* Visual Roar Soundwave Ring when excavated */}
        {isExcavated && (
          <mesh position={[0, 0.2, 2.3]} rotation={[0, 0, 0]}>
            <ringGeometry args={[0.3, 0.5, 16]} />
            <meshBasicMaterial color="#fef08a" transparent opacity={0.8} />
          </mesh>
        )}
      </group>
    );
  }

  // 4. CLAW: Prehistoric triple talon claws
  if (targetId === 'fossil-claw') {
    return (
      <group ref={rootRef} position={[0, 0.7, 0]}>
        {/* Palm / Foot Pad */}
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[1.2, 0.35, 1.0]} />
          <meshStandardMaterial
            color={isExcavated ? '#d97706' : '#92400e'}
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt * 0.5}
            roughness={0.8}
          />
        </mesh>
        {/* 3 Large Curved Talons */}
        {[-0.45, 0, 0.45].map((x, idx) => (
          <group key={`claw-talon-${idx}`} position={[x, 0.25, 0.5]} rotation={[0.5, 0, x * -0.2]}>
            <cylinderGeometry args={[0.1, 0.18, 0.8, 8]} />
            <meshStandardMaterial
              color={boneColor}
              emissive={emissiveColor}
              emissiveIntensity={emissiveInt}
              roughness={0.4}
            />
            {/* Sharp Talon Tip */}
            <mesh position={[0, 0.5, 0]}>
              <coneGeometry args={[0.1, 0.35, 8]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  // 6. FANG: Prehistoric saber tooth with root base and pointed enamel curve
  if (targetId === 'fossil-fang') {
    return (
      <group ref={rootRef} position={[0, 0.7, 0]} rotation={[0.2, 0.3, -0.2]}>
        {/* Tooth Root Base */}
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[0.35, 0.25, 0.8, 12]} />
          <meshStandardMaterial
            color={boneColor}
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt}
            roughness={0.7}
          />
        </mesh>
        {/* Curving Tooth Body */}
        <mesh position={[0.1, 0.2, 0]} rotation={[0, 0, -0.2]}>
          <coneGeometry args={[0.32, 1.2, 12]} />
          <meshStandardMaterial
            color={isExcavated ? '#ffffff' : boneColor}
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt * 0.8}
            roughness={0.3}
          />
        </mesh>
        {/* Sharp Fang Tip */}
        <mesh position={[0.3, 0.9, 0]} rotation={[0, 0, -0.45]}>
          <coneGeometry args={[0.16, 0.7, 10]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt}
            roughness={0.2}
          />
        </mesh>
      </group>
    );
  }

  // 7. HORN: Triceratops brow horn curving upward with textured base
  if (targetId === 'fossil-horn') {
    return (
      <group ref={rootRef} position={[0, 0.6, 0]} rotation={[0.4, 0, 0]}>
        {/* Brow Base Plate */}
        <mesh position={[0, -0.6, 0]}>
          <boxGeometry args={[1.2, 0.3, 1.0]} />
          <meshStandardMaterial
            color={boneColor}
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt * 0.5}
            roughness={0.8}
          />
        </mesh>
        {/* Horn Base Ring */}
        <mesh position={[0, -0.3, 0.1]}>
          <cylinderGeometry args={[0.42, 0.5, 0.5, 12]} />
          <meshStandardMaterial
            color={boneColor}
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt}
            roughness={0.6}
          />
        </mesh>
        {/* Mid Horn */}
        <mesh position={[0, 0.2, 0.25]} rotation={[-0.3, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.42, 0.8, 12]} />
          <meshStandardMaterial
            color={boneColor}
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt}
            roughness={0.5}
          />
        </mesh>
        {/* Horn Tip */}
        <mesh position={[0, 0.8, 0.5]} rotation={[-0.5, 0, 0]}>
          <coneGeometry args={[0.26, 0.9, 12]} />
          <meshStandardMaterial
            color={isExcavated ? '#fef9c3' : boneColor}
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt}
            roughness={0.4}
          />
        </mesh>
      </group>
    );
  }

  // 8. SPINE: Segmented vertebrae column with rising dorsal sail spines
  if (targetId === 'fossil-spine') {
    return (
      <group ref={rootRef} position={[0, 0.6, 0]}>
        {/* Vertebral Column Centra */}
        <mesh position={[0, -0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.25, 0.25, 2.4, 12]} />
          <meshStandardMaterial
            color={boneColor}
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt * 0.5}
            roughness={0.7}
          />
        </mesh>
        {/* 5 Distinct Neural Spine Spikes with graduated heights */}
        {[-0.8, -0.4, 0, 0.4, 0.8].map((x, idx) => {
          const height = [1.1, 1.5, 1.8, 1.4, 1.0][idx];
          return (
            <group key={`spine-spike-${idx}`} position={[x, -0.4, 0]}>
              <mesh position={[0, height / 2, 0]}>
                <boxGeometry args={[0.16, height, 0.25]} />
                <meshStandardMaterial
                  color={isExcavated ? '#fde047' : boneColor}
                  emissive={emissiveColor}
                  emissiveIntensity={emissiveInt}
                  roughness={0.5}
                />
              </mesh>
              {/* Spine Tip */}
              <mesh position={[0, height + 0.1, 0]}>
                <coneGeometry args={[0.1, 0.25, 6]} />
                <meshStandardMaterial color="#ffffff" roughness={0.3} />
              </mesh>
            </group>
          );
        })}
      </group>
    );
  }

  // 9. TRACK: Ancient sandstone rock tablet with 3-toed dinosaur footprint impression
  if (targetId === 'fossil-track') {
    return (
      <group ref={rootRef} position={[0, 0.6, 0]} rotation={[0.3, 0, 0]}>
        {/* Sandstone Tablet Bed */}
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[2.0, 0.35, 2.2]} />
          <meshStandardMaterial
            color={isExcavated ? '#d97706' : '#78350f'}
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt * 0.4}
            roughness={0.9}
          />
        </mesh>
        {/* Heel Pad Impression */}
        <mesh position={[0, 0.12, 0.3]}>
          <cylinderGeometry args={[0.32, 0.32, 0.15, 12]} />
          <meshStandardMaterial
            color={boneColor}
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt}
            roughness={0.6}
          />
        </mesh>
        {/* 3 Radiating Claw Toes */}
        {[-0.45, 0, 0.45].map((x, idx) => (
          <group key={`track-toe-${idx}`} position={[x, 0.12, -0.3]} rotation={[0, x * -0.3, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.22, 0.15, 0.8]} />
              <meshStandardMaterial
                color={boneColor}
                emissive={emissiveColor}
                emissiveIntensity={emissiveInt}
                roughness={0.5}
              />
            </mesh>
            <mesh position={[0, 0, -0.45]} rotation={[-Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.12, 0.3, 6]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  // 10. SKULL: Ancient fossilized dinosaur cranium with armored brow crest and eye sockets
  if (targetId === 'fossil-skull') {
    return (
      <group ref={rootRef} position={[0, 0.7, 0]}>
        {/* Armored Rear Crest / Frill */}
        <mesh position={[0, 0.8, -0.6]} rotation={[-0.3, 0, 0]}>
          <cylinderGeometry args={[1.2, 0.8, 0.25, 16, 1, false, 0, Math.PI]} />
          <meshStandardMaterial
            color={isExcavated ? '#fde047' : boneColor}
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt * 0.7}
            roughness={0.6}
          />
        </mesh>
        {/* Cranium Vault */}
        <mesh position={[0, 0.5, 0.1]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial
            color={boneColor}
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt}
            roughness={0.7}
          />
        </mesh>
        {/* Beaked Snout */}
        <mesh position={[0, 0.2, 0.9]}>
          <boxGeometry args={[0.7, 0.5, 0.9]} />
          <meshStandardMaterial
            color={boneColor}
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt}
            roughness={0.6}
          />
        </mesh>
        {/* Deep Eye Orbits */}
        <mesh position={[-0.45, 0.6, 0.3]}>
          <sphereGeometry args={[0.2, 10, 10]} />
          <meshStandardMaterial
            color={isExcavated ? '#f59e0b' : '#1c1917'}
            emissive={isExcavated ? '#f59e0b' : '#000000'}
            emissiveIntensity={isExcavated ? 0.8 : 0}
          />
        </mesh>
        <mesh position={[0.45, 0.6, 0.3]}>
          <sphereGeometry args={[0.2, 10, 10]} />
          <meshStandardMaterial
            color={isExcavated ? '#f59e0b' : '#1c1917'}
            emissive={isExcavated ? '#f59e0b' : '#000000'}
            emissiveIntensity={isExcavated ? 0.8 : 0}
          />
        </mesh>
      </group>
    );
  }

  // 11. T-REX (Default): Classic skull cranium, snout, lower jaw & small arms
  return (
    <group ref={rootRef} position={[0, 0.8, 0]}>
      {/* Skull Cranium */}
      <mesh position={[0, 0.6, 0.3]}>
        <boxGeometry args={[1.6, 1.2, 2.2]} />
        <meshStandardMaterial
          color={boneColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveInt}
          roughness={0.7}
        />
      </mesh>
      {/* Snout */}
      <mesh position={[0, 0.3, 1.7]}>
        <boxGeometry args={[1.2, 0.8, 1.2]} />
        <meshStandardMaterial
          color={boneColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveInt}
          roughness={0.7}
        />
      </mesh>
      {/* Lower Jaw */}
      <group ref={jawRef} position={[0, 0, 0.4]}>
        <mesh position={[0, -0.3, 1.1]}>
          <boxGeometry args={[1.0, 0.3, 1.4]} />
          <meshStandardMaterial color={boneColor} roughness={0.7} />
        </mesh>
        {/* Teeth */}
        {[-0.4, 0, 0.4].map((tx, idx) => (
          <mesh key={`tooth-${idx}`} position={[tx, -0.1, 1.4]}>
            <coneGeometry args={[0.08, 0.25, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
        ))}
      </group>
      {/* Glowing Eye Sockets */}
      <mesh position={[-0.7, 0.7, 0.6]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial
          color={isExcavated ? '#f59e0b' : '#1c1917'}
          emissive={isExcavated ? '#f59e0b' : '#000000'}
          emissiveIntensity={isExcavated ? 0.9 : 0}
        />
      </mesh>
      <mesh position={[0.7, 0.7, 0.6]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial
          color={isExcavated ? '#f59e0b' : '#1c1917'}
          emissive={isExcavated ? '#f59e0b' : '#000000'}
          emissiveIntensity={isExcavated ? 0.9 : 0}
        />
      </mesh>
      {/* Short T-Rex Arms on sides */}
      <mesh position={[-0.9, 0.2, 0.1]} rotation={[0.4, 0, -0.4]}>
        <cylinderGeometry args={[0.06, 0.08, 0.45, 6]} />
        <meshStandardMaterial color={boneColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.9, 0.2, 0.1]} rotation={[0.4, 0, 0.4]}>
        <cylinderGeometry args={[0.06, 0.08, 0.45, 6]} />
        <meshStandardMaterial color={boneColor} roughness={0.7} />
      </mesh>
    </group>
  );
}
