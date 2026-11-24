import * as THREE from "three";
import { noiseTexture } from "./materials";

/* ── shared packaging helpers: printed carton artwork, foil, satin ribbon ── */

export type Flavour = {
  key: string;
  name: [string, string]; // two lines, second set in italic
  line: string;
  bg: string;
  ink: string;
  accent: string;
  pattern: string;
  foil?: string; // hot-foil colour; defaults to cognac gold
};

/* carton prints in the three brand colours: ivory, deep cocoa and cognac */
export const PACK_FLAVOURS: Flavour[] = [
  { key: "pistachio", name: ["Pistachio", "Crunch"], line: "MILK CHOCOLATE · ROASTED PISTACHIO · 100 g", bg: "#F6F0E7", ink: "#2B1A14", accent: "rgba(196,145,108,0.32)", pattern: "rgba(196,145,108,0.16)" },
  { key: "midnight", name: ["Midnight", "Dark"], line: "70% DARK CHOCOLATE · 100 g", bg: "#2B1A14", ink: "#F6F0E7", accent: "rgba(196,145,108,0.3)", pattern: "rgba(246,240,231,0.05)" },
  { key: "hazelnut", name: ["Hazelnut", "Heaven"], line: "MILK CHOCOLATE · WHOLE HAZELNUTS · 100 g", bg: "#C4916C", ink: "#2B1A14", accent: "rgba(43,26,20,0.14)", pattern: "rgba(43,26,20,0.06)", foil: "#2B1A14" },
];

const GOLD = "#C4916C";

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function tex(c: HTMLCanvasElement, color = true) {
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** little illustrated chocolate bar used on the pack front */
function drawBar(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, cols: number, rows: number, fill: string, hi: string) {
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const px = x + c * cell;
      const py = y + r * cell;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.roundRect(px + 4, py + 4, cell - 8, cell - 8, 14);
      ctx.fill();
      ctx.fillStyle = hi;
      ctx.beginPath();
      ctx.roundRect(px + 18, py + 18, cell - 36, cell - 36, 10);
      ctx.fill();
    }
}

/**
 * Front of the carton (landscape). Returns colour map + a metal mask so the
 * KRUZZ'S wordmark and keyline read as real hot-foil gold under the studio lights.
 */
export function packFront(f: Flavour) {
  const foil = f.foil ?? GOLD;
  const W = 2048;
  const H = 1078;
  const [c, ctx] = canvas(W, H);
  const [m, mx] = canvas(W, H);
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = f.bg;
    ctx.fillRect(0, 0, W, H);
    // tonal dot pattern
    ctx.fillStyle = f.pattern;
    for (let y = 30; y < H; y += 56) for (let x = (y / 56) % 2 ? 58 : 30; x < W; x += 56) ctx.fillRect(x, y, 6, 6);
    // accent blob + illustrated bar on the right
    ctx.fillStyle = f.accent;
    ctx.beginPath();
    ctx.ellipse(1560, 560, 430, 400, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(1560, 560);
    ctx.rotate(-0.32);
    ctx.shadowColor = "rgba(40,15,8,0.35)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 24;
    drawBar(ctx, -330, -165, 110, 6, 3, "#4a2416", "#6a3520");
    ctx.restore();
    // keyline frame (foil)
    ctx.strokeStyle = foil;
    ctx.lineWidth = 6;
    ctx.strokeRect(48, 48, W - 96, H - 96);
    // wordmark (foil)
    ctx.fillStyle = foil;
    ctx.textBaseline = "alphabetic";
    ctx.font = "italic 600 210px 'Cormorant Garamond', Georgia, serif";
    ctx.fillText("KRUZZ'S", 130, 330);
    // flavour
    ctx.fillStyle = f.ink;
    ctx.font = "500 150px 'Cormorant Garamond', Georgia, serif";
    ctx.fillText(f.name[0], 130, 560);
    ctx.font = "italic 400 150px 'Cormorant Garamond', Georgia, serif";
    ctx.fillText(f.name[1], 130, 710);
    ctx.font = "600 38px Manrope, Arial, sans-serif";
    ctx.globalAlpha = 0.85;
    ctx.fillText(f.line.split("").join(String.fromCharCode(8202)), 134, 840);
    ctx.globalAlpha = 1;
    // bottom band
    ctx.fillStyle = f.ink;
    ctx.fillRect(48, H - 150, W - 96, 102);
    ctx.fillStyle = f.bg;
    ctx.font = "700 40px Manrope, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("T O O   G O O D   T O   S H A R E", W / 2, H - 85);
    ctx.textAlign = "left";

    // metal mask: white where foil
    mx.fillStyle = "#000";
    mx.fillRect(0, 0, W, H);
    mx.strokeStyle = "#fff";
    mx.fillStyle = "#fff";
    mx.lineWidth = 6;
    mx.strokeRect(48, 48, W - 96, H - 96);
    mx.font = "italic 600 210px 'Cormorant Garamond', Georgia, serif";
    mx.fillText("KRUZZ'S", 130, 330);
  };
  draw();
  const map = tex(c);
  const metal = tex(m, false);
  // redraw once the web fonts are in (canvas falls back to Georgia before that)
  document.fonts?.ready.then(() => {
    draw();
    map.needsUpdate = metal.needsUpdate = true;
  });
  return { map, metal };
}

export function packBack(f: Flavour) {
  const foil = f.foil ?? GOLD;
  const W = 2048;
  const H = 1078;
  const [c, ctx] = canvas(W, H);
  const draw = () => {
    ctx.fillStyle = f.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = f.ink;
    ctx.font = "italic 500 130px 'Cormorant Garamond', Georgia, serif";
    ctx.fillText("Too good to share.", 130, 300);
    ctx.font = "500 46px Manrope, Arial, sans-serif";
    ctx.globalAlpha = 0.8;
    ["Snap a square. Then another.", "Tell everyone it was just one piece.", "We won't say anything."].forEach((l, i) => ctx.fillText(l, 134, 430 + i * 70));
    ctx.globalAlpha = 1;
    ctx.strokeStyle = f.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(1300, 200, 620, 620, 30);
    ctx.stroke();
    ctx.font = "600 34px Manrope, Arial, sans-serif";
    ["FICTIONAL BRAND", "DEMO PACKAGING", "", f.name.join(" ").toUpperCase(), "100 g"].forEach((l, i) => ctx.fillText(l, 1350, 290 + i * 70));
    ctx.fillStyle = foil;
    ctx.font = "italic 600 90px 'Cormorant Garamond', Georgia, serif";
    ctx.fillText("KRUZZ'S", 130, H - 120);
  };
  draw();
  const map = tex(c);
  document.fonts?.ready.then(() => {
    draw();
    map.needsUpdate = true;
  });
  return map;
}

/** narrow side panels: flavour colour with a repeated small wordmark */
export function packEdge(f: Flavour) {
  const [c, ctx] = canvas(2048, 256);
  const draw = () => {
    ctx.fillStyle = f.bg;
    ctx.fillRect(0, 0, 2048, 256);
    ctx.fillStyle = f.ink;
    ctx.font = "italic 600 120px 'Cormorant Garamond', Georgia, serif";
    ctx.textBaseline = "middle";
    ctx.fillText("KRUZZ'S", 90, 132);
    ctx.font = "600 64px Manrope, Arial, sans-serif";
    ctx.fillText(f.name.join(" ").toUpperCase(), 1080, 132);
  };
  draw();
  const map = tex(c);
  document.fonts?.ready.then(() => {
    draw();
    map.needsUpdate = true;
  });
  return map;
}

/** laminated paperboard: printed colour + gold hot-foil areas + satin varnish */
export function cartonMaterial(map: THREE.Texture, metal?: THREE.Texture) {
  return new THREE.MeshPhysicalMaterial({
    map,
    metalnessMap: metal ?? null,
    metalness: metal ? 1 : 0,
    roughness: 0.42,
    clearcoat: 0.55,
    clearcoatRoughness: 0.28,
    bumpMap: noiseTexture("board", 256, [[48, 0.6], [160, 0.4]], 6, 19),
    bumpScale: 0.15,
  });
}

/** crinkled gold foil */
export function foilMaterial(color = "#C4916C") {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.9,
    roughness: 0.34,
    bumpMap: noiseTexture("foil", 256, [[6, 0.6], [18, 0.4]], 1, 23),
    bumpScale: 0.03,
    side: THREE.DoubleSide,
  });
}

/** add soft creases to a subdivided plane so foil / tissue isn't perfectly flat */
export function crinkle(geo: THREE.BufferGeometry, amp: number, seed = 1) {
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const n =
      Math.sin(x * 7.1 + seed) * Math.sin(y * 9.3 + seed * 2) * 0.6 +
      Math.sin(x * 19.7 - y * 13.1 + seed * 3) * 0.3 +
      Math.sin(x * 23.3 + y * 17.9 + seed) * 0.1;
    p.setZ(i, p.getZ(i) + n * amp);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Flat satin ribbon swept along a curve (for bow loops and tails). `up` sets
 * which way the ribbon's width faces; tails get an angled cut end.
 */
export function ribbonAlong(curve: THREE.Curve<THREE.Vector3>, width: number, segments: number, up = new THREE.Vector3(0, 0, 1), angledEnd = false) {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const tan = new THREE.Vector3();
  const side = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = curve.getPointAt(t);
    curve.getTangentAt(t, tan);
    side.copy(up).projectOnPlane(tan).normalize().multiplyScalar(width / 2);
    // angled cut at the end of a tail: one edge runs a little longer than the other
    const skew = angledEnd && i === segments ? width * 0.6 : 0;
    pos.push(p.x - side.x, p.y - side.y, p.z - side.z, p.x + side.x + tan.x * skew, p.y + side.y + tan.y * skew, p.z + side.z + tan.z * skew);
    uv.push(t, 0, t, 1);
    if (i < segments) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** satin: strong anisotropic-looking sheen along the ribbon */
export function satinMaterial(color = "#5A3026") {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.34,
    sheen: 1,
    sheenColor: new THREE.Color("#d49a7c"),
    sheenRoughness: 0.3,
    clearcoat: 0.25,
    clearcoatRoughness: 0.4,
    side: THREE.DoubleSide,
  });
}

/** global pointer (−1…1) for subtle parallax tilt of the product scenes */
export const pointer = { x: 0, y: 0 };
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true },
  );
}
