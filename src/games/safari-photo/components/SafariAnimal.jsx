import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { getLetterTexture } from '../../learning-run/utils/textTexture';

// --- 1. LION MODEL ---
// Regal king of the savanna with voluminous fluffy mane, round paws, cream muzzle, expressive eyes, and tufted tail
function LionModel({ rotation = [0, 0.45, 0] }) {
  return (
    <group rotation={rotation}>
      {/* Torso */}
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.42, 0.48, 1.35, 14]} />
        <meshStandardMaterial color="#d97706" roughness={0.7} />
      </mesh>
      {/* Rounded rear & shoulders */}
      <mesh position={[0, 0.65, -0.65]}>
        <sphereGeometry args={[0.45, 14, 14]} />
        <meshStandardMaterial color="#d97706" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.68, 0.55]}>
        <sphereGeometry args={[0.48, 14, 14]} />
        <meshStandardMaterial color="#d97706" roughness={0.7} />
      </mesh>

      {/* Four Sturdy Legs with Round Paws */}
      {/* Front Left */}
      <mesh position={[-0.28, 0.32, 0.48]}>
        <cylinderGeometry args={[0.11, 0.10, 0.65, 10]} />
        <meshStandardMaterial color="#d97706" roughness={0.7} />
      </mesh>
      <mesh position={[-0.28, 0.08, 0.52]} scale={[1.1, 0.65, 1.25]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color="#b45309" roughness={0.6} />
      </mesh>

      {/* Front Right */}
      <mesh position={[0.28, 0.32, 0.48]}>
        <cylinderGeometry args={[0.11, 0.10, 0.65, 10]} />
        <meshStandardMaterial color="#d97706" roughness={0.7} />
      </mesh>
      <mesh position={[0.28, 0.08, 0.52]} scale={[1.1, 0.65, 1.25]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color="#b45309" roughness={0.6} />
      </mesh>

      {/* Back Left */}
      <mesh position={[-0.28, 0.32, -0.52]}>
        <cylinderGeometry args={[0.13, 0.11, 0.65, 10]} />
        <meshStandardMaterial color="#d97706" roughness={0.7} />
      </mesh>
      <mesh position={[-0.28, 0.08, -0.50]} scale={[1.1, 0.65, 1.25]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color="#b45309" roughness={0.6} />
      </mesh>

      {/* Back Right */}
      <mesh position={[0.28, 0.32, -0.52]}>
        <cylinderGeometry args={[0.13, 0.11, 0.65, 10]} />
        <meshStandardMaterial color="#d97706" roughness={0.7} />
      </mesh>
      <mesh position={[0.28, 0.08, -0.50]} scale={[1.1, 0.65, 1.25]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color="#b45309" roughness={0.6} />
      </mesh>

      {/* Magnificent Layered Lion Mane */}
      {/* Outer collar framing */}
      <mesh position={[0, 1.05, 0.68]}>
        <torusGeometry args={[0.48, 0.24, 12, 24]} />
        <meshStandardMaterial color="#78350f" roughness={0.85} />
      </mesh>
      {/* Fluffy mane crests around head */}
      <mesh position={[0, 1.38, 0.72]}>
        <sphereGeometry args={[0.24, 12, 12]} />
        <meshStandardMaterial color="#78350f" roughness={0.85} />
      </mesh>
      <mesh position={[-0.38, 1.18, 0.70]}>
        <sphereGeometry args={[0.23, 12, 12]} />
        <meshStandardMaterial color="#78350f" roughness={0.85} />
      </mesh>
      <mesh position={[0.38, 1.18, 0.70]}>
        <sphereGeometry args={[0.23, 12, 12]} />
        <meshStandardMaterial color="#78350f" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.78, 0.75]}>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color="#78350f" roughness={0.85} />
      </mesh>

      {/* Head, Face & Ears */}
      <mesh position={[0, 1.08, 0.82]}>
        <sphereGeometry args={[0.36, 16, 16]} />
        <meshStandardMaterial color="#d97706" roughness={0.6} />
      </mesh>

      {/* Ears peeking through mane */}
      <mesh position={[-0.28, 1.35, 0.75]}>
        <sphereGeometry args={[0.10, 10, 10]} />
        <meshStandardMaterial color="#d97706" roughness={0.7} />
      </mesh>
      <mesh position={[-0.28, 1.35, 0.79]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#451a03" />
      </mesh>
      <mesh position={[0.28, 1.35, 0.75]}>
        <sphereGeometry args={[0.10, 10, 10]} />
        <meshStandardMaterial color="#d97706" roughness={0.7} />
      </mesh>
      <mesh position={[0.28, 1.35, 0.79]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#451a03" />
      </mesh>

      {/* Cream Muzzle & Chin */}
      <mesh position={[0, 0.98, 1.14]} scale={[1.1, 0.82, 0.95]}>
        <sphereGeometry args={[0.17, 14, 14]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.5} />
      </mesh>
      {/* Dark Nose */}
      <mesh position={[0, 1.06, 1.28]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.06, 0.05, 6]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
      {/* Mouth seam */}
      <mesh position={[0, 0.94, 1.25]}>
        <boxGeometry args={[0.02, 0.06, 0.02]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>

      {/* Expressive Eyes */}
      <mesh position={[-0.14, 1.15, 1.10]}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
      <mesh position={[-0.13, 1.17, 1.14]}>
        <sphereGeometry args={[0.016, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.14, 1.15, 1.10]}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
      <mesh position={[0.15, 1.17, 1.14]}>
        <sphereGeometry args={[0.016, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Long Tail with Fluffy Tuft */}
      <mesh position={[0, 0.60, -0.95]} rotation={[-0.85, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 0.7, 8]} />
        <meshStandardMaterial color="#d97706" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.38, -1.28]}>
        <sphereGeometry args={[0.11, 10, 10]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
    </group>
  );
}

// --- 2. ZEBRA MODEL ---
// Recognizable equine silhouette with bold wrap-around black-and-white stripes,
// dark muzzle with nostrils, alert upright ears with dark tips,
// stiff upright striped dorsal mane, athletic legs with polished black hooves, and tasseled tail
function ZebraModel({ rotation = [0, -0.42, 0] }) {
  return (
    <group rotation={rotation} scale={1.30}>
      {/* 1. Torso */}
      {/* Main white barrel */}
      <mesh position={[0, 0.70, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.42, 0.44, 1.45, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      {/* Rounded rump & hindquarters */}
      <mesh position={[0, 0.72, -0.68]}>
        <sphereGeometry args={[0.44, 16, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      {/* Rounded chest & shoulders */}
      <mesh position={[0, 0.74, 0.60]}>
        <sphereGeometry args={[0.46, 16, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>

      {/* Bold Crisp Black Zebra Stripes wrapping around body */}
      {[-0.56, -0.40, -0.24, -0.08, 0.08, 0.24, 0.40, 0.54].map((zPos, idx) => (
        <mesh key={`zebra-stripe-${idx}`} position={[0, 0.70, zPos]}>
          <torusGeometry args={[0.445, 0.082, 10, 24]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
      ))}

      {/* Angled Rump / Hip Stripes */}
      <mesh position={[0, 0.78, -0.45]} rotation={[-0.45, 0, 0]}>
        <torusGeometry args={[0.42, 0.07, 8, 20]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.82, -0.60]} rotation={[-0.65, 0, 0]}>
        <torusGeometry args={[0.38, 0.065, 8, 20]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>
      {/* Angled Shoulder & Chest Stripes */}
      <mesh position={[0, 0.76, 0.44]} rotation={[0.42, 0, 0]}>
        <torusGeometry args={[0.43, 0.068, 8, 20]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.74, 0.60]} rotation={[0.42, 0, 0]}>
        <torusGeometry args={[0.45, 0.075, 8, 20]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>

      {/* 2. Four Athletic Legs with Dark Hooves & Stripe Bands */}
      {/* Front Left */}
      <mesh position={[-0.26, 0.35, 0.48]}>
        <cylinderGeometry args={[0.09, 0.075, 0.70, 8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      {/* Leg Stripes */}
      <mesh position={[-0.26, 0.50, 0.48]}>
        <torusGeometry args={[0.095, 0.028, 6, 12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-0.26, 0.36, 0.48]}>
        <torusGeometry args={[0.09, 0.026, 6, 12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-0.26, 0.22, 0.48]}>
        <torusGeometry args={[0.085, 0.024, 6, 12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-0.26, 0.07, 0.48]}>
        <cylinderGeometry args={[0.09, 0.10, 0.14, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>

      {/* Front Right */}
      <mesh position={[0.26, 0.35, 0.48]}>
        <cylinderGeometry args={[0.09, 0.075, 0.70, 8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      {/* Leg Stripes */}
      <mesh position={[0.26, 0.50, 0.48]}>
        <torusGeometry args={[0.095, 0.028, 6, 12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.26, 0.36, 0.48]}>
        <torusGeometry args={[0.09, 0.026, 6, 12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.26, 0.22, 0.48]}>
        <torusGeometry args={[0.085, 0.024, 6, 12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.26, 0.07, 0.48]}>
        <cylinderGeometry args={[0.09, 0.10, 0.14, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>

      {/* Back Left */}
      <mesh position={[-0.26, 0.35, -0.52]}>
        <cylinderGeometry args={[0.10, 0.08, 0.70, 8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      {/* Leg Stripes */}
      <mesh position={[-0.26, 0.50, -0.52]}>
        <torusGeometry args={[0.105, 0.028, 6, 12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-0.26, 0.36, -0.52]}>
        <torusGeometry args={[0.10, 0.026, 6, 12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-0.26, 0.22, -0.52]}>
        <torusGeometry args={[0.09, 0.024, 6, 12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-0.26, 0.07, -0.52]}>
        <cylinderGeometry args={[0.095, 0.105, 0.14, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>

      {/* Back Right */}
      <mesh position={[0.26, 0.35, -0.52]}>
        <cylinderGeometry args={[0.10, 0.08, 0.70, 8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      {/* Leg Stripes */}
      <mesh position={[0.26, 0.50, -0.52]}>
        <torusGeometry args={[0.105, 0.028, 6, 12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.26, 0.36, -0.52]}>
        <torusGeometry args={[0.10, 0.026, 6, 12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.26, 0.22, -0.52]}>
        <torusGeometry args={[0.09, 0.024, 6, 12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.26, 0.07, -0.52]}>
        <cylinderGeometry args={[0.095, 0.105, 0.14, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>

      {/* 3. Upright Equine Neck with Striped Crest Mane */}
      <mesh position={[0, 1.25, 0.62]} rotation={[0.45, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.26, 0.95, 12]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      {/* Bold Wrap-Around Neck Stripes */}
      <mesh position={[0, 0.98, 0.50]} rotation={[0.45, 0, 0]}>
        <torusGeometry args={[0.26, 0.062, 8, 16]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0, 1.15, 0.57]} rotation={[0.45, 0, 0]}>
        <torusGeometry args={[0.24, 0.060, 8, 16]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0, 1.32, 0.64]} rotation={[0.45, 0, 0]}>
        <torusGeometry args={[0.21, 0.058, 8, 16]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0, 1.48, 0.72]} rotation={[0.45, 0, 0]}>
        <torusGeometry args={[0.18, 0.054, 8, 16]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Stiff Upright Crested Mane along Dorsal Spine */}
      <mesh position={[0, 1.36, 0.46]} rotation={[0.45, 0, 0]}>
        <boxGeometry args={[0.06, 0.95, 0.22]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>
      {/* Forelock Mane Tuft between ears */}
      <mesh position={[0, 1.84, 0.74]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.06, 0.20, 0.14]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* 4. Head & Dark Muzzle */}
      {/* Tapered Head Cylinder */}
      <mesh position={[0, 1.58, 0.92]} rotation={[1.25, 0, 0]}>
        <cylinderGeometry args={[0.17, 0.24, 0.68, 10]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      {/* Facial Cheek Stripe */}
      <mesh position={[0, 1.62, 0.92]} rotation={[1.25, 0, 0]}>
        <torusGeometry args={[0.20, 0.038, 6, 16]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Rounded Dark Charcoal Muzzle */}
      <mesh position={[0, 1.42, 1.24]} scale={[0.92, 0.82, 1.15]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>
      {/* White Chin/Lip Highlight */}
      <mesh position={[0, 1.36, 1.26]} scale={[0.8, 0.4, 0.8]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      {/* Nostril indentations */}
      <mesh position={[-0.06, 1.45, 1.38]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#020617" />
      </mesh>
      <mesh position={[0.06, 1.45, 1.38]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#020617" />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.16, 1.66, 0.92]}>
        <sphereGeometry args={[0.046, 8, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-0.15, 1.68, 0.96]}>
        <sphereGeometry args={[0.016, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.16, 1.66, 0.92]}>
        <sphereGeometry args={[0.046, 8, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.17, 1.68, 0.96]}>
        <sphereGeometry args={[0.016, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* 5. Alert Upright Ears with Dark Tips */}
      {/* Left Ear */}
      <mesh position={[-0.14, 1.90, 0.72]} rotation={[-0.18, 0, -0.22]}>
        <coneGeometry args={[0.06, 0.24, 8]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <mesh position={[-0.14, 2.00, 0.72]} rotation={[-0.18, 0, -0.22]}>
        <coneGeometry args={[0.038, 0.09, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Right Ear */}
      <mesh position={[0.14, 1.90, 0.72]} rotation={[-0.18, 0, 0.22]}>
        <coneGeometry args={[0.06, 0.24, 8]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <mesh position={[0.14, 2.00, 0.72]} rotation={[-0.18, 0, 0.22]}>
        <coneGeometry args={[0.038, 0.09, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* 6. Zebra Tail with Flowing Dark Tassel */}
      <mesh position={[0, 0.65, -0.96]} rotation={[-0.8, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.04, 0.70, 8]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <mesh position={[0, 0.36, -1.28]} scale={[0.9, 1.5, 0.9]}>
        <sphereGeometry args={[0.10, 8, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    </group>
  );
}

// --- 3. GIRAFFE MODEL ---
// Extra tall neck, sloping body with 4 long legs, distinct brown patches, ossicones, alert ears, and soft muzzle
function GiraffeModel({ rotation = [0, -0.3, 0] }) {
  return (
    <group rotation={rotation}>
      {/* Sloped Torso */}
      <mesh position={[0, 1.15, 0.25]}>
        <sphereGeometry args={[0.42, 14, 14]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.95, -0.45]}>
        <sphereGeometry args={[0.36, 14, 14]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.05, -0.10]} rotation={[1.25, 0, 0]}>
        <cylinderGeometry args={[0.34, 0.40, 0.85, 12]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.6} />
      </mesh>

      {/* Brown Body Patches */}
      <mesh position={[-0.32, 1.10, 0.15]}>
        <boxGeometry args={[0.06, 0.22, 0.26]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      <mesh position={[0.32, 1.12, 0.10]}>
        <boxGeometry args={[0.06, 0.24, 0.24]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      <mesh position={[-0.28, 0.98, -0.28]}>
        <boxGeometry args={[0.06, 0.20, 0.22]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      <mesh position={[0.28, 0.96, -0.28]}>
        <boxGeometry args={[0.06, 0.20, 0.22]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>

      {/* Four Tall Slender Legs with Dark Hooves */}
      {/* Front Left */}
      <mesh position={[-0.22, 0.52, 0.28]}>
        <cylinderGeometry args={[0.065, 0.055, 1.05, 8]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.6} />
      </mesh>
      <mesh position={[-0.22, 0.05, 0.28]}>
        <cylinderGeometry args={[0.07, 0.075, 0.10, 8]} />
        <meshStandardMaterial color="#451a03" />
      </mesh>

      {/* Front Right */}
      <mesh position={[0.22, 0.52, 0.28]}>
        <cylinderGeometry args={[0.065, 0.055, 1.05, 8]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.6} />
      </mesh>
      <mesh position={[0.22, 0.05, 0.28]}>
        <cylinderGeometry args={[0.07, 0.075, 0.10, 8]} />
        <meshStandardMaterial color="#451a03" />
      </mesh>

      {/* Back Left */}
      <mesh position={[-0.20, 0.44, -0.42]}>
        <cylinderGeometry args={[0.06, 0.05, 0.88, 8]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.6} />
      </mesh>
      <mesh position={[-0.20, 0.05, -0.42]}>
        <cylinderGeometry args={[0.065, 0.07, 0.10, 8]} />
        <meshStandardMaterial color="#451a03" />
      </mesh>

      {/* Back Right */}
      <mesh position={[0.20, 0.44, -0.42]}>
        <cylinderGeometry args={[0.06, 0.05, 0.88, 8]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.6} />
      </mesh>
      <mesh position={[0.20, 0.05, -0.42]}>
        <cylinderGeometry args={[0.065, 0.07, 0.10, 8]} />
        <meshStandardMaterial color="#451a03" />
      </mesh>

      {/* Extra Tall Upright Neck with Mane */}
      <mesh position={[0, 2.15, 0.45]} rotation={[-0.10, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.22, 1.95, 10]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.6} />
      </mesh>
      {/* Dark Dorsal Mane along Neck */}
      <mesh position={[0, 2.15, 0.32]} rotation={[-0.10, 0, 0]}>
        <boxGeometry args={[0.04, 1.90, 0.09]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>

      {/* Neck Brown Spots/Patches */}
      {[-0.55, -0.20, 0.15, 0.50].map((yOffset, idx) => (
        <group
          key={`giraffe-neck-patch-${idx}`}
          position={[0, 2.15 + yOffset, 0.45 + idx * 0.02]}
          rotation={[-0.10, 0, 0]}
        >
          <mesh position={[idx % 2 === 0 ? -0.11 : 0.11, 0, 0.12]}>
            <boxGeometry args={[0.09, 0.18, 0.04]} />
            <meshStandardMaterial color="#78350f" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Head & Soft Rounded Muzzle */}
      <mesh position={[0, 3.18, 0.62]} rotation={[1.65, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 0.48, 10]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.6} />
      </mesh>
      <mesh position={[0, 3.08, 0.85]} scale={[0.9, 0.75, 1.1]}>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.5} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.13, 3.24, 0.65]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
      <mesh position={[-0.12, 3.25, 0.69]}>
        <sphereGeometry args={[0.015, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.13, 3.24, 0.65]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
      <mesh position={[0.14, 3.25, 0.69]}>
        <sphereGeometry args={[0.015, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Two Distinct Ossicones (Giraffe Horns with Knob Tips) */}
      <mesh position={[-0.07, 3.42, 0.52]}>
        <cylinderGeometry args={[0.02, 0.022, 0.18, 6]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <mesh position={[-0.07, 3.52, 0.52]}>
        <sphereGeometry args={[0.042, 8, 8]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <mesh position={[0.07, 3.42, 0.52]}>
        <cylinderGeometry args={[0.02, 0.022, 0.18, 6]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <mesh position={[0.07, 3.52, 0.52]}>
        <sphereGeometry args={[0.042, 8, 8]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>

      {/* Alert Ears */}
      <mesh position={[-0.20, 3.32, 0.46]} rotation={[0.2, 0, -1.0]}>
        <coneGeometry args={[0.06, 0.22, 8]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
      <mesh position={[0.20, 3.32, 0.46]} rotation={[0.2, 0, 1.0]}>
        <coneGeometry args={[0.06, 0.22, 8]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>

      {/* Tail */}
      <mesh position={[0, 0.88, -0.75]} rotation={[-0.6, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.65, 8]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
      <mesh position={[0, 0.58, -1.02]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
    </group>
  );
}

// --- 4. MONKEY MODEL ---
// Playful, clearly recognizable primate perched on a tree branch
// Large expressive head, peach face mask, cute muzzle, smile, dark nose, bright white cartoon eyes with pupils,
// prominent round ears with peach inner cups, rich brown body with light peach belly,
// separated arms reaching to grasp branch, bent legs with clutching feet, and a long playful curled tail
function MonkeyModel({ rotation = [0, 0.22, 0] }) {
  return (
    <group rotation={rotation} scale={1.65}>
      {/* 1. Body & Light Belly (separated from limbs) */}
      <mesh position={[0, 0.44, 0]} scale={[0.85, 1.1, 0.85]}>
        <sphereGeometry args={[0.30, 16, 16]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      {/* Soft contrasting peach belly patch */}
      <mesh position={[0, 0.42, 0.20]} scale={[0.75, 0.95, 0.28]}>
        <sphereGeometry args={[0.22, 14, 14]} />
        <meshStandardMaterial color="#fde68a" roughness={0.6} />
      </mesh>

      {/* 2. Large Expressive Head & Peach Face */}
      {/* Big round brown head */}
      <mesh position={[0, 0.96, 0.04]}>
        <sphereGeometry args={[0.38, 16, 16]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      {/* Broad contrasting peach eye mask */}
      <mesh position={[0, 1.01, 0.24]} scale={[1.18, 0.95, 0.45]}>
        <sphereGeometry args={[0.25, 14, 14]} />
        <meshStandardMaterial color="#fde68a" roughness={0.5} />
      </mesh>
      {/* Protruding rounded peach muzzle */}
      <mesh position={[0, 0.82, 0.32]} scale={[1.15, 0.80, 0.85]}>
        <sphereGeometry args={[0.20, 14, 14]} />
        <meshStandardMaterial color="#fde68a" roughness={0.5} />
      </mesh>
      {/* Dark button nose */}
      <mesh position={[0, 0.88, 0.49]}>
        <sphereGeometry args={[0.042, 8, 8]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
      {/* Cheerful curved smile */}
      <mesh position={[0, 0.77, 0.49]} rotation={[Math.PI, 0, 0]}>
        <torusGeometry args={[0.038, 0.012, 6, 8, Math.PI]} />
        <meshStandardMaterial color="#451a03" />
      </mesh>

      {/* Two Large White Eyes with Dark Pupils & Highlights */}
      {/* Left Eye */}
      <mesh position={[-0.12, 1.05, 0.36]}>
        <sphereGeometry args={[0.065, 10, 10]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.11, 1.06, 0.42]}>
        <sphereGeometry args={[0.040, 8, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-0.09, 1.08, 0.45]}>
        <sphereGeometry args={[0.016, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Right Eye */}
      <mesh position={[0.12, 1.05, 0.36]}>
        <sphereGeometry args={[0.065, 10, 10]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.11, 1.06, 0.42]}>
        <sphereGeometry args={[0.040, 8, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.13, 1.08, 0.45]}>
        <sphereGeometry args={[0.016, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Two Prominent Round Ears with Peach Inner Cups */}
      {/* Left Ear */}
      <mesh position={[-0.38, 0.98, 0.04]} rotation={[0, 0.22, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.05, 14]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      <mesh position={[-0.37, 0.98, 0.06]} rotation={[0, 0.22, Math.PI / 2]}>
        <cylinderGeometry args={[0.11, 0.11, 0.055, 12]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>
      {/* Right Ear */}
      <mesh position={[0.38, 0.98, 0.04]} rotation={[0, -0.22, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.05, 14]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      <mesh position={[0.37, 0.98, 0.06]} rotation={[0, -0.22, Math.PI / 2]}>
        <cylinderGeometry args={[0.11, 0.11, 0.055, 12]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>

      {/* 3. Clearly Separated Arms & Hands Holding Branch */}
      {/* Left Arm */}
      <mesh position={[-0.32, 0.32, 0.22]} rotation={[0.6, 0, 0.35]}>
        <cylinderGeometry args={[0.055, 0.05, 0.42, 8]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      {/* Left Peach Hand gripping branch */}
      <mesh position={[-0.36, 0.10, 0.36]}>
        <sphereGeometry args={[0.075, 8, 8]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>
      {/* Right Arm */}
      <mesh position={[0.32, 0.32, 0.22]} rotation={[0.6, 0, -0.35]}>
        <cylinderGeometry args={[0.055, 0.05, 0.42, 8]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      {/* Right Peach Hand gripping branch */}
      <mesh position={[0.36, 0.10, 0.36]}>
        <sphereGeometry args={[0.075, 8, 8]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>

      {/* 4. Clearly Separated Legs & Feet Clutching Branch */}
      {/* Left Thigh & Knee */}
      <mesh position={[-0.24, 0.24, 0.05]} scale={[0.85, 1.1, 1.0]}>
        <sphereGeometry args={[0.15, 10, 10]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <mesh position={[-0.23, 0.12, 0.14]} rotation={[0.45, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.05, 0.22, 8]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      {/* Left Peach Foot clutching branch */}
      <mesh position={[-0.22, 0.04, 0.22]} scale={[1.0, 0.55, 1.3]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>

      {/* Right Thigh & Knee */}
      <mesh position={[0.24, 0.24, 0.05]} scale={[0.85, 1.1, 1.0]}>
        <sphereGeometry args={[0.15, 10, 10]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <mesh position={[0.23, 0.12, 0.14]} rotation={[0.45, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.05, 0.22, 8]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      {/* Right Peach Foot clutching branch */}
      <mesh position={[0.22, 0.04, 0.22]} scale={[1.0, 0.55, 1.3]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>

      {/* 5. Long Playful Curled Monkey Tail */}
      {/* Base tail emerging from lower back */}
      <mesh position={[0, 0.26, -0.22]} rotation={[-0.7, 0, 0.2]}>
        <cylinderGeometry args={[0.042, 0.045, 0.32, 8]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      {/* Mid tail rising upward */}
      <mesh position={[0.08, 0.48, -0.34]} rotation={[-0.15, 0, 0.4]}>
        <cylinderGeometry args={[0.04, 0.042, 0.36, 8]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      {/* Graceful upward spiral loop */}
      <mesh position={[0.18, 0.75, -0.26]} rotation={[0, Math.PI / 2, 0.3]}>
        <torusGeometry args={[0.15, 0.035, 8, 16, Math.PI * 1.3]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      {/* Inner curl tip */}
      <mesh position={[0.16, 0.92, -0.20]} rotation={[0, Math.PI / 2, 0.6]}>
        <torusGeometry args={[0.08, 0.03, 8, 14, Math.PI * 1.1]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
    </group>
  );
}

// --- 5. HIPPO MODEL ---
// Bulky, lovable safari hippo with cohesive rounded grayish-purple body,
// four short sturdy legs with toenails, broad snout with nostrils,
// cute perked ears with pink interior, friendly mouth, and visible water splash setting
function HippoModel({ rotation = [0, 0.15, 0] }) {
  return (
    <group rotation={rotation} scale={1.22}>
      {/* 1. Cohesive Connected Torso & Neck */}
      {/* Central barrel body */}
      <mesh position={[0, 0.58, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.66, 0.70, 1.35, 16]} />
        <meshStandardMaterial color="#64748b" roughness={0.65} />
      </mesh>
      {/* Large rounded rump */}
      <mesh position={[0, 0.60, -0.70]}>
        <sphereGeometry args={[0.70, 16, 16]} />
        <meshStandardMaterial color="#64748b" roughness={0.65} />
      </mesh>
      {/* Smooth connecting neck sloping up into head */}
      <mesh position={[0, 0.76, 0.45]} rotation={[0.40, 0, 0]}>
        <cylinderGeometry args={[0.48, 0.64, 0.75, 14]} />
        <meshStandardMaterial color="#64748b" roughness={0.65} />
      </mesh>
      {/* Soft lighter grayish-purple belly accent */}
      <mesh position={[0, 0.40, 0]} scale={[0.88, 0.38, 1.25]}>
        <sphereGeometry args={[0.64, 14, 14]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.7} />
      </mesh>

      {/* 2. Four Short Sturdy Legs with Clear White Toenails */}
      {/* Front Left */}
      <mesh position={[-0.44, 0.26, 0.52]}>
        <cylinderGeometry args={[0.18, 0.20, 0.52, 12]} />
        <meshStandardMaterial color="#64748b" roughness={0.65} />
      </mesh>
      <mesh position={[-0.44, 0.05, 0.58]} scale={[1.1, 0.6, 1.1]}>
        <sphereGeometry args={[0.19, 10, 10]} />
        <meshStandardMaterial color="#575169" roughness={0.7} />
      </mesh>
      {[-0.08, 0, 0.08].map((xOff, idx) => (
        <mesh key={`hippo-nail-fl-${idx}`} position={[-0.44 + xOff, 0.04, 0.72]}>
          <boxGeometry args={[0.045, 0.03, 0.05]} />
          <meshStandardMaterial color="#f1f5f9" />
        </mesh>
      ))}

      {/* Front Right */}
      <mesh position={[0.44, 0.26, 0.52]}>
        <cylinderGeometry args={[0.18, 0.20, 0.52, 12]} />
        <meshStandardMaterial color="#64748b" roughness={0.65} />
      </mesh>
      <mesh position={[0.44, 0.05, 0.58]} scale={[1.1, 0.6, 1.1]}>
        <sphereGeometry args={[0.19, 10, 10]} />
        <meshStandardMaterial color="#575169" roughness={0.7} />
      </mesh>
      {[-0.08, 0, 0.08].map((xOff, idx) => (
        <mesh key={`hippo-nail-fr-${idx}`} position={[0.44 + xOff, 0.04, 0.72]}>
          <boxGeometry args={[0.045, 0.03, 0.05]} />
          <meshStandardMaterial color="#f1f5f9" />
        </mesh>
      ))}

      {/* Back Left */}
      <mesh position={[-0.44, 0.26, -0.55]}>
        <cylinderGeometry args={[0.19, 0.21, 0.52, 12]} />
        <meshStandardMaterial color="#64748b" roughness={0.65} />
      </mesh>
      <mesh position={[-0.44, 0.05, -0.52]} scale={[1.1, 0.6, 1.1]}>
        <sphereGeometry args={[0.20, 10, 10]} />
        <meshStandardMaterial color="#575169" roughness={0.7} />
      </mesh>
      {[-0.08, 0, 0.08].map((xOff, idx) => (
        <mesh key={`hippo-nail-bl-${idx}`} position={[-0.44 + xOff, 0.04, -0.38]}>
          <boxGeometry args={[0.045, 0.03, 0.05]} />
          <meshStandardMaterial color="#f1f5f9" />
        </mesh>
      ))}

      {/* Back Right */}
      <mesh position={[0.44, 0.26, -0.55]}>
        <cylinderGeometry args={[0.19, 0.21, 0.52, 12]} />
        <meshStandardMaterial color="#64748b" roughness={0.65} />
      </mesh>
      <mesh position={[0.44, 0.05, -0.52]} scale={[1.1, 0.6, 1.1]}>
        <sphereGeometry args={[0.20, 10, 10]} />
        <meshStandardMaterial color="#575169" roughness={0.7} />
      </mesh>
      {[-0.08, 0, 0.08].map((xOff, idx) => (
        <mesh key={`hippo-nail-br-${idx}`} position={[0.44 + xOff, 0.04, -0.38]}>
          <boxGeometry args={[0.045, 0.03, 0.05]} />
          <meshStandardMaterial color="#f1f5f9" />
        </mesh>
      ))}

      {/* 3. Clearly Elevated Head & Contrasting Lighter Face/Muzzle */}
      {/* Elevated Cranium */}
      <mesh position={[0, 1.12, 0.85]}>
        <sphereGeometry args={[0.50, 16, 16]} />
        <meshStandardMaterial color="#64748b" roughness={0.65} />
      </mesh>
      {/* Contrasting Lighter Broad Upper Muzzle */}
      <mesh position={[0, 0.96, 1.36]} scale={[1.28, 0.86, 1.14]}>
        <sphereGeometry args={[0.46, 16, 16]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.6} />
      </mesh>
      {/* Contrasting Lighter Lower Jaw */}
      <mesh position={[0, 0.68, 1.30]} scale={[1.16, 0.56, 1.05]}>
        <sphereGeometry args={[0.42, 14, 14]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
      </mesh>

      {/* Two Distinct Dark Nostrils on raised mounds */}
      <mesh position={[-0.18, 1.28, 1.64]} scale={[1.0, 0.75, 1.0]}>
        <sphereGeometry args={[0.11, 10, 10]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[-0.18, 1.31, 1.68]} rotation={[0.65, 0, 0]}>
        <torusGeometry args={[0.065, 0.03, 8, 12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      <mesh position={[0.18, 1.28, 1.64]} scale={[1.0, 0.75, 1.0]}>
        <sphereGeometry args={[0.11, 10, 10]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0.18, 1.31, 1.68]} rotation={[0.65, 0, 0]}>
        <torusGeometry args={[0.065, 0.03, 8, 12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Clearly visible curved mouth line across lower muzzle */}
      <mesh position={[0, 0.78, 1.84]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.56, 0.035, 0.06]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* Left lower tusk */}
      <mesh position={[-0.22, 0.85, 1.84]} rotation={[0.08, 0, -0.08]}>
        <coneGeometry args={[0.032, 0.08, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      {/* Right lower tusk */}
      <mesh position={[0.22, 0.85, 1.84]} rotation={[0.08, 0, 0.08]}>
        <coneGeometry args={[0.032, 0.08, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>

      {/* 4. Two Large Visible Eyes with White Eyeballs, Dark Pupils, and Highlights */}
      {/* Left Eye Socket & Sclera */}
      <mesh position={[-0.26, 1.38, 0.96]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh position={[-0.26, 1.42, 1.05]}>
        <sphereGeometry args={[0.085, 10, 10]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.25, 1.44, 1.13]}>
        <sphereGeometry args={[0.052, 8, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-0.23, 1.47, 1.17]}>
        <sphereGeometry args={[0.020, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Right Eye Socket & Sclera */}
      <mesh position={[0.26, 1.38, 0.96]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh position={[0.26, 1.42, 1.05]}>
        <sphereGeometry args={[0.085, 10, 10]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.25, 1.44, 1.13]}>
        <sphereGeometry args={[0.052, 8, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.23, 1.47, 1.17]}>
        <sphereGeometry args={[0.020, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* 5. Two Small Rounded Ears with Visible Pink Inner */}
      <mesh position={[-0.38, 1.56, 0.85]} rotation={[0.3, 0, -0.45]}>
        <cylinderGeometry args={[0.03, 0.08, 0.16, 8]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh position={[-0.37, 1.56, 0.89]} rotation={[0.3, 0, -0.45]}>
        <cylinderGeometry args={[0.02, 0.055, 0.14, 8]} />
        <meshStandardMaterial color="#fda4af" />
      </mesh>

      <mesh position={[0.38, 1.56, 0.85]} rotation={[0.3, 0, 0.45]}>
        <cylinderGeometry args={[0.03, 0.08, 0.16, 8]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh position={[0.37, 1.56, 0.89]} rotation={[0.3, 0, 0.45]}>
        <cylinderGeometry args={[0.02, 0.055, 0.14, 8]} />
        <meshStandardMaterial color="#fda4af" />
      </mesh>

      {/* 6. Short Hippo Tail */}
      <mesh position={[0, 0.60, -1.10]} rotation={[-0.65, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.36, 8]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh position={[0, 0.46, -1.24]}>
        <sphereGeometry args={[0.065, 8, 8]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
    </group>
  );
}

// --- MAIN SAFARI ANIMAL COMPONENT ---
export default function SafariAnimal({
  target,
  isTarget = false,
  isSnapped = false,
  onSnap,
}) {
  const groupRef = useRef();

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default';
    };
  }, []);

  const texture = useMemo(() => {
    return getLetterTexture(target.letter, {
      textColor: '#ffffff',
      fontSize: '48px',
      size: 128,
      circleBg: true,
      circleBgColor: '#f59e0b',
    });
  }, [target.letter]);

  useFrame((state) => {
    if (!groupRef.current) return;
    // Gentle lifelike breathing bob
    groupRef.current.position.y =
      target.position[1] + Math.sin(state.clock.elapsedTime * 1.8 + target.position[0]) * 0.06;
  });

  return (
    <group
      ref={groupRef}
      position={target.position}
      onClick={(e) => {
        e.stopPropagation();
        if (onSnap) onSnap(target);
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      {/* 1. Distinct Recognizable Animal 3D Model */}
      {target.animal === 'LION' && <LionModel />}
      {target.animal === 'ZEBRA' && <ZebraModel />}
      {target.animal === 'GIRAFFE' && <GiraffeModel />}
      {target.animal === 'MONKEY' && <MonkeyModel />}
      {target.animal === 'HIPPO' && <HippoModel />}

      {/* 2. Floating Phonics Letter Badge (placed neatly above head) */}
      <mesh
        position={[
          0,
          target.animal === 'GIRAFFE'
            ? 3.9
            : target.animal === 'ZEBRA'
            ? 2.85
            : target.animal === 'MONKEY'
            ? 2.45
            : target.animal === 'HIPPO'
            ? 2.15
            : 1.90,
          0,
        ]}
      >
        <planeGeometry args={[0.8, 0.8]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} side={2} />
      </mesh>

      {/* 3. Celebratory golden snap ring when successfully photographed (never spoils before snap) */}
      {isSnapped && (
        <mesh
          position={[
            0,
            target.animal === 'GIRAFFE'
              ? 2.2
              : target.animal === 'ZEBRA'
              ? 1.35
              : target.animal === 'HIPPO'
              ? 1.20
              : target.animal === 'LION'
              ? 1.10
              : 1.05,
            0,
          ]}
          rotation={[0, 0, 0]}
        >
          <ringGeometry args={[1.35, 1.75, 32]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.9} side={2} />
        </mesh>
      )}

      {/* 4. Accessible touch & click hitbox for forgiving selection on mobile & tablets */}
      <mesh
        position={[
          0,
          target.animal === 'GIRAFFE'
            ? 2.0
            : target.animal === 'ZEBRA'
            ? 1.15
            : target.animal === 'HIPPO'
            ? 1.05
            : target.animal === 'LION'
            ? 0.90
            : 0.90,
          0,
        ]}
        name={`hitbox-${target.animal.toLowerCase()}`}
      >
        <sphereGeometry
          args={[
            target.animal === 'GIRAFFE'
              ? 2.2
              : target.animal === 'HIPPO'
              ? 1.90
              : target.animal === 'ZEBRA'
              ? 1.85
              : target.animal === 'LION'
              ? 1.50
              : 1.55,
            12,
            12,
          ]}
        />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
