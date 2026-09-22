import * as THREE from 'three';

// Renders a single letter onto a small 2D canvas and turns it into a
// THREE.CanvasTexture. This intentionally avoids @react-three/drei's <Text>
// (which depends on troika-three-text fetching remote font data and spinning
// up a Web Worker) so letter rendering works reliably even in sandboxed /
// restricted-network environments. Textures are cached per (letter, style)
// combination since the same letters repeat constantly across coins/gates.

const textureCache = new Map();

export function getLetterTexture(letter, { textColor = '#0b3d5c', size = 128, fontWeight = 800 } = {}) {
  const safeLetter = (letter || '').toUpperCase();
  const key = `${safeLetter}|${textColor}|${size}|${fontWeight}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = textColor;
    if (!safeLetter) {
      // Render a crisp golden star on non-letter coins
      ctx.font = `${fontWeight} ${Math.floor(size * 0.58)}px "Segoe UI Symbol", "Apple Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', size / 2, size / 2 + size * 0.02);
    } else {
      ctx.font = `${fontWeight} ${Math.floor(size * 0.68)}px "Baloo 2", "Nunito", "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(safeLetter, size / 2, size / 2 + size * 0.04);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.anisotropy = 4;
  textureCache.set(key, texture);
  return texture;
}
