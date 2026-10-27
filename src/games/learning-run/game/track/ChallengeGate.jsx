import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import LetterPlane from '../effects/LetterPlane';
import { LANE_X } from '../engine/constants';

// Distinct glowing lane colors to help learners visually distinguish lanes
const LANE_THEMES = [
  { border: '#38e1ff', emissive: '#0284c7', glow: '#38e1ff' }, // Lane 0 (Left): Cyan
  { border: '#ffd166', emissive: '#d97706', glow: '#fbbf24' }, // Lane 1 (Center): Gold
  { border: '#6bd98a', emissive: '#059669', glow: '#34d399' }, // Lane 2 (Right): Emerald
];

// Renders the three high-contrast lane panels for an active learning challenge gate.
// `gateRef` is a plain mutable object: { active, z, lanes: [l0,l1,l2], version }
export default function ChallengeGate({ gateRef }) {
  const group = useRef();
  const p0 = useRef();
  const p1 = useRef();
  const p2 = useRef();
  const panelRefs = [p0, p1, p2];
  const [lanesText, setLanesText] = useState(['', '', '']);
  const lastVersion = useRef(-1);

  useFrame((state) => {
    const g = gateRef.current;
    if (!group.current) return;
    group.current.visible = g.active;
    if (g.active && g.version !== lastVersion.current) {
      lastVersion.current = g.version;
      setLanesText([...g.lanes]);
    }
    if (!g.active) return;
    group.current.position.z = g.z;
    panelRefs.forEach((r, i) => {
      if (r.current) {
        r.current.position.y = 1.6 + Math.sin(state.clock.elapsedTime * 2.5 + i * 0.8) * 0.08;
      }
    });
  });

  return (
    <group ref={group}>
      {/* Overhead Temple Archway Beam connecting all 3 lanes */}
      <mesh position={[0, 3.4, 0]}>
        <boxGeometry args={[7.2, 0.45, 0.6]} />
        <meshStandardMaterial color="#0f2b48" roughness={0.6} />
      </mesh>
      <mesh position={[0, 3.4, 0.32]}>
        <boxGeometry args={[6.8, 0.12, 0.05]} />
        <meshStandardMaterial color="#ffd166" emissive="#f59e0b" emissiveIntensity={0.8} />
      </mesh>

      {[0, 1, 2].map((lane) => {
        const theme = LANE_THEMES[lane];
        return (
          <group key={lane} position={[LANE_X[lane], 0, 0]}>
            {/* 1. Ground Runway Target Beam: Highlights the lane clearly on the floor */}
            <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.7, 4.5]} />
              <meshBasicMaterial color={theme.glow} transparent opacity={0.25} depthWrite={false} />
            </mesh>
            <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.7, 0.85, 24]} />
              <meshBasicMaterial color={theme.border} transparent opacity={0.6} />
            </mesh>

            {/* 2. Side Archway Pillars for Lane Definition */}
            <mesh position={[-0.95, 1.7, 0]}>
              <cylinderGeometry args={[0.08, 0.1, 3.4, 8]} />
              <meshStandardMaterial color="#0f2b48" roughness={0.7} />
            </mesh>
            <mesh position={[0.95, 1.7, 0]}>
              <cylinderGeometry args={[0.08, 0.1, 3.4, 8]} />
              <meshStandardMaterial color="#0f2b48" roughness={0.7} />
            </mesh>

            {/* 3. Floating High-Contrast Letter Shield */}
            <group ref={panelRefs[lane]} position={[0, 1.6, 0]}>
              {/* Deep navy backplate for maximum contrast against white letters */}
              <mesh>
                <circleGeometry args={[0.92, 32]} />
                <meshStandardMaterial color="#051626" roughness={0.3} side={2} />
              </mesh>
              {/* Glowing vibrant outer ring */}
              <mesh position={[0, 0, -0.01]}>
                <ringGeometry args={[0.88, 1.05, 32]} />
                <meshStandardMaterial
                  color={theme.border}
                  emissive={theme.emissive}
                  emissiveIntensity={1.0}
                  side={2}
                />
              </mesh>
              {/* Large, crisp white letter plane */}
              <LetterPlane letter={lanesText[lane] || ''} size={1.35} color="#ffffff" position={[0, 0, 0.06]} />
            </group>
          </group>
        );
      })}
    </group>
  );
}
