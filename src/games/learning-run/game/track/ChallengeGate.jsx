import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import LetterPlane from '../effects/LetterPlane';
import { LANE_X } from '../engine/constants';

// Renders the three lane panels for an active learning challenge gate.
// `gateRef` is a plain mutable object: { active, z, lanes: [l0,l1,l2], version }
export default function ChallengeGate({ gateRef }) {
  const group = useRef();
  const panelRefs = [useRef(), useRef(), useRef()];
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
        r.current.position.y = 1.4 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.08;
      }
    });
  });

  return (
    <group ref={group}>
      {[0, 1, 2].map((lane) => (
        <group key={lane} ref={panelRefs[lane]} position={[LANE_X[lane], 1.4, 0]}>
          <mesh>
            <circleGeometry args={[0.75, 24]} />
            <meshStandardMaterial color="#065f46" emissive="#047857" emissiveIntensity={0.6} transparent opacity={0.9} side={2} />
          </mesh>
          <mesh position={[0, 0, -0.02]}>
            <ringGeometry args={[0.72, 0.84, 24]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.9} side={2} />
          </mesh>
          <LetterPlane letter={lanesText[lane] || ''} size={0.9} color="#ffffff" position={[0, 0, 0.05]} />
        </group>
      ))}
    </group>
  );
}
