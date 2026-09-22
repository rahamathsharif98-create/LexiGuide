import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Smooth cinematic third-person camera. Reads the player's render position
// from `stateRef` and lerps toward an offset behind/above, with a small
// event-driven shake for jumps/hits/checkpoints.
export default function FollowCamera({ stateRef, shakeRef }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 2.6, 6.5));
  const lookAt = useRef(new THREE.Vector3(0, 1.2, -4));

  useFrame((_, delta) => {
    const s = stateRef.current;
    const desired = new THREE.Vector3(s.renderX * 0.4, 2.6 + (s.isSliding ? -0.3 : 0), 6.5);
    target.current.lerp(desired, Math.min(1, delta * 4));

    let shakeX = 0;
    let shakeY = 0;
    if (shakeRef.current.time > 0) {
      shakeRef.current.time -= delta;
      const power = Math.max(0, shakeRef.current.time) * shakeRef.current.intensity;
      shakeX = (Math.random() - 0.5) * power;
      shakeY = (Math.random() - 0.5) * power;
    }

    camera.position.set(target.current.x + shakeX, target.current.y + shakeY, target.current.z);
    const desiredLook = new THREE.Vector3(s.renderX * 0.6, 1.3, -6);
    lookAt.current.lerp(desiredLook, Math.min(1, delta * 5));
    camera.lookAt(lookAt.current);
  });

  return null;
}
