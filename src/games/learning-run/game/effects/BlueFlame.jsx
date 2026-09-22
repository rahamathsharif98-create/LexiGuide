import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// Lightweight stylized safari torch flame: an animated glowing cone core.
// Pure geometric materials with zero point-light overhead for 60fps performance.
export default function BlueFlame({ position = [0, 0, 0], scale = 1, intense = false }) {
  const coreRef = useRef();
  const outerRef = useRef();
  const seed = useRef(Math.random() * 10);

  useFrame((state) => {
    const t = state.clock.elapsedTime + seed.current;
    const flicker = 1 + Math.sin(t * 9) * 0.08 + Math.sin(t * 3.3) * 0.05;
    if (coreRef.current) {
      coreRef.current.scale.set(scale * flicker * 0.55, scale * flicker * (intense ? 1.4 : 1.1), scale * flicker * 0.55);
    }
    if (outerRef.current) {
      const outerFlicker = 1 + Math.sin(t * 6 + 1) * 0.12;
      outerRef.current.scale.set(scale * outerFlicker * 0.9, scale * outerFlicker * (intense ? 1.8 : 1.3), scale * outerFlicker * 0.9);
    }
  });

  return (
    <group position={position}>
      <mesh ref={outerRef} position={[0, 0.5, 0]}>
        <coneGeometry args={[0.32, 1.0, 8]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.45} />
      </mesh>
      <mesh ref={coreRef} position={[0, 0.4, 0]}>
        <coneGeometry args={[0.2, 0.8, 8]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>
    </group>
  );
}
