import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * VFXCameraJuice
 * Enhances Three.js camera with dynamic game feel:
 * 1. Procedural Screen Shake on hits/snaps (spring damped vibration).
 * 2. Victory Orbit Sweep (slow-motion cinematic camera dolly around the build).
 */
export default function VFXCameraJuice({
  shakeKey = 0,
  intensity = 0.22,
  duration = 0.35,
  isVictory = false,
  basePosition = [0, 4.2, 7.5],
  targetLookAt = [0, 1.5, 0],
}) {
  const shakeTimer = useRef(0);
  const victoryAngle = useRef(0);

  useEffect(() => {
    if (shakeKey) {
      shakeTimer.current = duration;
    }
  }, [shakeKey, duration]);

  useFrame((state, delta) => {
    const camera = state.camera;
    if (!camera) return;

    if (isVictory) {
      // Smooth cinematic orbit around the finished creation
      victoryAngle.current += delta * 0.8;
      const radius = 6.5;
      const targetX = Math.sin(victoryAngle.current) * radius;
      const targetZ = Math.cos(victoryAngle.current) * radius;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.08);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 3.2, 0.08);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.08);
      camera.lookAt(targetLookAt[0], targetLookAt[1], targetLookAt[2]);
      return;
    }

    // Default position lerp
    let posX = basePosition[0];
    let posY = basePosition[1];
    let posZ = basePosition[2];

    // Apply procedural spring screen shake
    if (shakeTimer.current > 0) {
      shakeTimer.current -= delta;
      const decay = Math.max(0, shakeTimer.current / duration);
      const currentIntensity = intensity * decay;

      posX += (Math.random() - 0.5) * currentIntensity * 2;
      posY += (Math.random() - 0.5) * currentIntensity * 2;
      posZ += (Math.random() - 0.5) * currentIntensity * 0.8;
    }

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, posX, 0.2);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, posY, 0.2);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, posZ, 0.2);
    camera.lookAt(targetLookAt[0], targetLookAt[1], targetLookAt[2]);
  });

  return null;
}
