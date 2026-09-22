import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * VFXBurstParticles
 * Generates an energetic 3D particle explosion at [x, y, z].
 * When `triggerKey` changes or when active, particles burst outward with physics.
 */
export default function VFXBurstParticles({
  position = [0, 0, 0],
  color = '#fbbf24',
  count = 24,
  speed = 4.5,
  gravity = -3.2,
  size = 0.12,
  duration = 0.9,
  triggerKey = 0,
}) {
  const groupRef = useRef();
  const [particles, setParticles] = useState([]);
  const ageRef = useRef(0);
  const activeRef = useRef(false);

  useEffect(() => {
    if (!triggerKey) return;
    ageRef.current = 0;
    activeRef.current = true;

    // Generate random spherical velocities
    const newParticles = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const velocityMag = (0.5 + Math.random() * 0.8) * speed;

      newParticles.push({
        id: i,
        pos: [0, 0, 0],
        vel: [
          velocityMag * Math.sin(phi) * Math.cos(theta),
          velocityMag * Math.sin(phi) * Math.sin(theta) + Math.random() * 1.5,
          velocityMag * Math.cos(phi),
        ],
        rotSpeed: [(Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8],
        scale: size * (0.8 + Math.random() * 0.6),
      });
    }
    setParticles(newParticles);
  }, [triggerKey, count, speed, size]);

  useFrame((state, delta) => {
    if (!activeRef.current || !groupRef.current) return;
    ageRef.current += delta;
    const progress = ageRef.current / duration;

    if (progress >= 1) {
      activeRef.current = false;
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;
    const currentScale = Math.max(0, 1 - progress);

    const children = groupRef.current.children;
    for (let i = 0; i < particles.length; i++) {
      const mesh = children[i];
      if (!mesh) continue;
      const p = particles[i];

      // Update position with velocity & gravity
      p.pos[0] += p.vel[0] * delta;
      p.pos[1] += (p.vel[1] + gravity * ageRef.current) * delta;
      p.pos[2] += p.vel[2] * delta;

      mesh.position.set(p.pos[0], p.pos[1], p.pos[2]);
      mesh.rotation.x += p.rotSpeed[0] * delta;
      mesh.rotation.y += p.rotSpeed[1] * delta;
      mesh.scale.setScalar(p.scale * currentScale);
    }
  });

  if (!triggerKey || particles.length === 0) return null;

  return (
    <group ref={groupRef} position={position}>
      {particles.map((p) => (
        <mesh key={p.id}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}
