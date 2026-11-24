/**
 * Mutable state the scroll timelines write and the render loops read.
 * Nothing here triggers React renders: GSAP tweens numbers, useFrame consumes them.
 */
export const film = {
  // bar placement: hero = 1 → the hero column pose (layout-aware), 0 → centre stage
  hero: 1,
  size: 0.56, // centre-stage size, fraction of viewport width taken by the bar
  lift: 0, // centre-stage vertical offset, fraction of half-viewport height
  rotX: 0.55,
  rotY: -0.5,
  rotZ: 0.12,
  idle: 1, // idle float / sway amount
  // camera
  camZ: 9,
  camY: 0.9,
  orbit: 0, // extra yaw of the whole rig
  // effects 0..1
  explode: 0, // pieces separate
  ingredients: 0, // nuts + nibs drift in
  labels: 0, // annotation opacity
  // intro: 0 = single piece solo, 1 = assembled bar in hero pose
  intro: 1,
};

export type FilmState = typeof film;

if (import.meta.env.DEV) (window as unknown as { __film: FilmState }).__film = film;

/** DOM label elements registered by the Film component; positioned by the 3D rig every frame */
export const labelEls: (HTMLElement | null)[] = [];
/** melt section scroll progress (0 → dry, 1 → fully flowed across) */
export const melt = { p: 0 };
/** gifting section scroll progress (0 closed → 1 open + revealed) */
export const gift = { p: 0 };
/** pack-shot section scroll progress (0 carton front → 1 bar lifted out) */
export const pack = { p: 0 };

/**
 * Hero 3D readiness: resolved after the film scene has drawn its first frame.
 * The splash waits on this (with a short safety timeout) so the chocolate is
 * on screen from the first beat instead of popping in halfway through.
 */
let filmIsReady = false;
const readyListeners = new Set<() => void>();
export function markFilmReady() {
  if (filmIsReady) return;
  filmIsReady = true;
  if (typeof performance !== "undefined") performance.mark("kz-film-ready");
  readyListeners.forEach((f) => f());
  readyListeners.clear();
}
export function onFilmReady(cb: () => void) {
  if (filmIsReady) {
    cb();
    return () => {};
  }
  readyListeners.add(cb);
  return () => void readyListeners.delete(cb);
}

/* ── below-the-fold 3D scenes: first-frame readiness (drives the poster fallbacks) ── */
export type SceneName = "melt" | "pack" | "gift";
const sceneIsReady: Record<SceneName, boolean> = { melt: false, pack: false, gift: false };
const sceneListeners = new Set<() => void>();
export function markSceneReady(name: SceneName) {
  if (sceneIsReady[name]) return;
  sceneIsReady[name] = true;
  if (typeof performance !== "undefined") performance.mark(`kz-${name}-ready`);
  sceneListeners.forEach((f) => f());
}
export const isSceneReady = (name: SceneName) => sceneIsReady[name];
export function subscribeScenes(cb: () => void) {
  sceneListeners.add(cb);
  return () => void sceneListeners.delete(cb);
}
