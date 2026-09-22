import { useMemo } from 'react';
import { getLetterTexture } from '../../utils/textTexture';

// A flat textured plane showing a single letter, used in place of drei's
// <Text> everywhere in the 3D world (see textTexture.js for why).
export default function LetterPlane({ letter, size = 0.6, color = '#0b3d5c', position = [0, 0, 0], rotation = [0, 0, 0] }) {
  const texture = useMemo(() => getLetterTexture(letter, { textColor: color }), [letter, color]);

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
