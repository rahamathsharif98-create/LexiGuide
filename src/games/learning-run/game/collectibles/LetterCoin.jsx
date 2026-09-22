import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import LetterPlane from '../effects/LetterPlane';
import { LANE_X } from '../engine/constants';

// An upright, spinning 3D gold letter medallion. Positioned imperatively via
// `posRef` (written by the parent game loop) so React never re-renders per frame.
// Double-sided letter planes ensure the child can read the target letter continuously
// as the coin spins down the track.
export default function LetterCoin({ letter, posRef }) {
  const group = useRef();
  const auraRef = useRef();
  const [displayLetter, setDisplayLetter] = useState(letter);
  const lastLetter = useRef(letter);

  useFrame((state, delta) => {
    if (!group.current) return;
    const p = posRef.current;
    group.current.visible = p.active;
    if (!p.active) return;
    if (p.letter !== lastLetter.current) {
      lastLetter.current = p.letter;
      setDisplayLetter(p.letter);
    }
    // Upright floating bob and energetic spin
    group.current.position.set(
      LANE_X[p.lane],
      1.28 + Math.sin(state.clock.elapsedTime * 3.0 + p.phase) * 0.12,
      p.z
    );
    group.current.rotation.y += delta * 2.4;

    if (auraRef.current) {
      auraRef.current.rotation.z += delta * 1.2;
    }
  });

  return (
    <group ref={group}>
      {/* 1. Main 3D Gold Coin Body (Upright cylinder facing Z) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.48, 0.48, 0.1, 16]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#b45309"
          emissiveIntensity={0.4}
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>

      {/* 2. Outer Beveled Golden Rim */}
      <mesh>
        <torusGeometry args={[0.48, 0.05, 8, 16]} />
        <meshStandardMaterial
          color="#fde047"
          emissive="#d97706"
          emissiveIntensity={0.45}
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>

      {/* 3. Front Embossed Golden Disc */}
      <mesh position={[0, 0, 0.052]}>
        <circleGeometry args={[0.4, 16]} />
        <meshStandardMaterial
          color="#fffbeb"
          emissive="#fef08a"
          emissiveIntensity={0.3}
          roughness={0.3}
        />
      </mesh>

      {/* 4. Front Letter (facing oncoming runner) */}
      <LetterPlane
        letter={displayLetter}
        size={0.52}
        color="#78350f"
        position={[0, 0, 0.058]}
      />

      {/* 5. Back Embossed Golden Disc */}
      <mesh position={[0, 0, -0.052]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.4, 16]} />
        <meshStandardMaterial
          color="#fffbeb"
          emissive="#fef08a"
          emissiveIntensity={0.3}
          roughness={0.3}
        />
      </mesh>

      {/* 6. Back Letter (facing reverse, correctly readable when spun) */}
      <LetterPlane
        letter={displayLetter}
        size={0.52}
        color="#78350f"
        position={[0, 0, -0.058]}
        rotation={[0, Math.PI, 0]}
      />

      {/* 7. Golden Sparkle Halo / Aura */}
      <mesh ref={auraRef} position={[0, 0, 0]}>
        <ringGeometry args={[0.55, 0.62, 16]} />
        <meshBasicMaterial
          color="#fde047"
          transparent
          opacity={0.35}
          side={2}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
