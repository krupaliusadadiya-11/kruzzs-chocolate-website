import * as THREE from "three";

/** value-noise canvas → tileable greyscale texture (bump / roughness detail) */
function noiseCanvas(size: number, scales: [number, number][], seed = 1) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const field = new Float32Array(size * size);
  for (const [cells, amp] of scales) {
    const g = Array.from({ length: cells * cells }, rnd);
    const at = (x: number, y: number) => g[((y + cells) % cells) * cells + ((x + cells) % cells)];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const fx = (x / size) * cells;
        const fy = (y / size) * cells;
        const ix = Math.floor(fx);
        const iy = Math.floor(fy);
        const tx = fx - ix;
        const ty = fy - iy;
        const sx = tx * tx * (3 - 2 * tx);
        const sy = ty * ty * (3 - 2 * ty);
        const a = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * sx;
        const b = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * sx;
        field[y * size + x] += (a + (b - a) * sy) * amp;
      }
    }
  }
  let min = Infinity;
  let max = -Infinity;
  for (const v of field) {
    min = Math.min(min, v);
    max = Math.max(max, v);
  }
  for (let i = 0; i < field.length; i++) {
    const v = Math.round(((field[i] - min) / (max - min)) * 255);
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

const cache = new Map<string, THREE.Texture>();
export function noiseTexture(key: string, size: number, scales: [number, number][], repeat = 1, seed = 1) {
  const k = key + size;
  if (cache.has(k)) return cache.get(k)!;
  const t = new THREE.CanvasTexture(noiseCanvas(size, scales, seed));
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 4;
  cache.set(k, t);
  return t;
}

/**
 * Tempered chocolate: deep brown, glossy-but-not-plastic. Clearcoat gives the
 * sharp mould sheen on the tops, the micro bump + roughness variation breaks up
 * reflections the way real cocoa butter crystals do.
 */
export function chocolateMaterial(color = "#3f1d11", low = false) {
  // broad, soft variation only — fine grain read as sandpaper
  const detail = noiseTexture("choc", low ? 128 : 256, [[4, 0.6], [12, 0.4]], 2, 3);
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness: 0.3,
    roughnessMap: detail,
    metalness: 0,
    bumpMap: detail,
    bumpScale: 0.012,
    clearcoat: 0.7,
    clearcoatRoughness: 0.12,
    sheen: 0.25,
    sheenColor: new THREE.Color("#a86b4c"),
    sheenRoughness: 0.5,
    specularIntensity: 0.6,
    specularColor: new THREE.Color("#ffe3cf"),
  });
}

/** cocoa-dusted / matte organic surface (truffles, nuts) */
export function matteMaterial(color: string, rough = 0.85, bump = 0.6) {
  const detail = noiseTexture("matte", 256, [[16, 0.5], [64, 0.35], [160, 0.15]], 3, 7);
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: rough, bumpMap: detail, bumpScale: bump });
}

/** soft blurred shadow texture (rounded-rect falloff) for cheap, controllable contact shadows */
let shadowTex: THREE.CanvasTexture | null = null;
export function softShadowTexture() {
  if (shadowTex) return shadowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.filter = "blur(22px)";
  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.beginPath();
  ctx.roundRect(64, 64, 128, 128, 40);
  ctx.fill();
  shadowTex = new THREE.CanvasTexture(c);
  return shadowTex;
}
