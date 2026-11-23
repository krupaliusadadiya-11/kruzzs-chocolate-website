import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/* ── chocolate bar ─────────────────────────────────────────────
 * Real bars are a thin slab with raised, bevel-sided "pillows" separated by
 * grooves — and they break along those grooves. So each piece = one slab cell
 * + one pillow, and the bar is a 6 × 3 grid of identical pieces.
 */
export const BAR = {
  cols: 6,
  rows: 3,
  cell: 0.55,
  baseH: 0.085,
  get length() {
    return this.cols * this.cell;
  },
  get depth() {
    return this.rows * this.cell;
  },
};

function roundedRect(hs: number, r: number) {
  const s = new THREE.Shape();
  s.moveTo(-hs + r, -hs);
  s.lineTo(hs - r, -hs);
  s.quadraticCurveTo(hs, -hs, hs, -hs + r);
  s.lineTo(hs, hs - r);
  s.quadraticCurveTo(hs, hs, hs - r, hs);
  s.lineTo(-hs + r, hs);
  s.quadraticCurveTo(-hs, hs, -hs, hs - r);
  s.lineTo(-hs, -hs + r);
  s.quadraticCurveTo(-hs, -hs, -hs + r, -hs);
  return s;
}

export function pieceGeometry(low = false) {
  const { cell, baseH } = BAR;
  const groove = 0.032;
  const bevelSize = 0.075;
  const bevelThickness = 0.07;
  const depth = 0.035;
  const hs = cell / 2 - groove - bevelSize;

  const base = new RoundedBoxGeometry(cell, baseH, cell, low ? 1 : 2, 0.014);
  base.translate(0, baseH / 2, 0);

  const pillow = new THREE.ExtrudeGeometry(roundedRect(hs, 0.035), {
    depth,
    bevelEnabled: true,
    bevelThickness,
    bevelSize,
    bevelSegments: low ? 3 : 6,
    curveSegments: low ? 3 : 6,
  });
  pillow.rotateX(-Math.PI / 2); // extrusion axis z → y
  pillow.translate(0, baseH - 0.004, 0);

  const merged = mergeGeometries([base.toNonIndexed(), pillow.toNonIndexed()], false)!;
  merged.computeBoundingBox();
  base.dispose();
  pillow.dispose();
  return merged;
}

/** piece rest positions (bar centred at origin, slab bottom at y = -height/2) */
export function piecePositions() {
  const { cols, rows, cell } = BAR;
  const out: THREE.Vector3[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push(new THREE.Vector3((c - (cols - 1) / 2) * cell, -0.1, (r - (rows - 1) / 2) * cell));
  return out;
}

/* ── organic ingredients ───────────────────────────────────── */

const h3 = (x: number, y: number, z: number) => {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
};
function lumpy(geo: THREE.BufferGeometry, amp: number, freq: number, seed: number) {
  const p = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n =
      Math.sin(v.x * freq + seed) * Math.sin(v.y * freq * 1.3 + seed * 2) * Math.sin(v.z * freq * 0.9 + seed * 3) +
      (h3(Math.round(v.x * 40), Math.round(v.y * 40), Math.round(v.z * 40)) - 0.5) * 0.15;
    v.multiplyScalar(1 + n * amp);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

function paint(geo: THREE.BufferGeometry, fn: (v: THREE.Vector3) => THREE.Color) {
  const p = geo.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(p.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const c = fn(v);
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return geo;
}

export function hazelnutGeometry() {
  const g = new THREE.SphereGeometry(0.13, 28, 20);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    // slightly pointed tip, flatter base
    const k = y > 0 ? 1 - (y / 0.13) * 0.18 : 1;
    p.setXYZ(i, p.getX(i) * k, y * (y > 0 ? 1.18 : 0.92), p.getZ(i) * k);
  }
  lumpy(g, 0.03, 18, 1.7);
  const shell = new THREE.Color("#7b4526");
  const dark = new THREE.Color("#5a2f19");
  const scar = new THREE.Color("#c99d6d");
  return paint(g, (v) => {
    const stripe = Math.sin(Math.atan2(v.z, v.x) * 14 + v.y * 20) * 0.5 + 0.5;
    const c = shell.clone().lerp(dark, stripe * 0.45);
    return v.y < -0.085 ? c.lerp(scar, Math.min(1, (-0.085 - v.y) / 0.03)) : c;
  });
}

export function pistachioGeometry() {
  const g = new THREE.SphereGeometry(0.1, 24, 16);
  g.scale(0.72, 0.62, 1.45);
  lumpy(g, 0.05, 16, 4.1);
  const green = new THREE.Color("#8fae4f");
  const lime = new THREE.Color("#b9c96a");
  const skin = new THREE.Color("#7d4a52");
  return paint(g, (v) => {
    const n = Math.sin(v.x * 60 + v.z * 23) * Math.sin(v.y * 70 - v.z * 31);
    const base = green.clone().lerp(lime, Math.max(0, v.y) * 6);
    return n > 0.55 ? base.lerp(skin, 0.75) : base;
  });
}

export function nibGeometry() {
  const g = new THREE.IcosahedronGeometry(0.055, 0);
  g.scale(1.3, 0.7, 1);
  return g;
}
