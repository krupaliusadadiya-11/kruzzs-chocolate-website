import { useSyncExternalStore } from "react";
import { isSceneReady, onFilmReady, subscribeScenes, type SceneName } from "./film";
import { device } from "./device";

/**
 * Prepares the below-the-fold 3D scenes before the visitor reaches them.
 *
 * Once the hero is on screen (and the splash has finished), each scene is
 * mounted in page order during idle time, one at a time — the next starts only
 * after the previous one has warmed up and drawn its first frame — so the work
 * never stacks into one long freeze. Sections still mount themselves early on
 * approach (IntersectionObserver), whichever comes first, which covers fast
 * scrolling and jump links before the queue gets there.
 */
const ORDER: SceneName[] = ["melt", "pack", "gift"];
const queued = new Set<SceneName>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((f) => f());
let started = false;

type Idle = (cb: () => void, o?: { timeout: number }) => number;
const idle = (cb: () => void) => {
  const ric = (window as unknown as { requestIdleCallback?: Idle }).requestIdleCallback;
  if (ric) ric(cb, { timeout: 1200 });
  else setTimeout(cb, 200);
};

function waitReady(name: SceneName, cap: number) {
  return new Promise<void>((resolve) => {
    if (isSceneReady(name)) return resolve();
    const off = subscribeScenes(() => {
      if (isSceneReady(name)) done();
    });
    const t = setTimeout(done, cap);
    function done() {
      off();
      clearTimeout(t);
      resolve();
    }
  });
}

/** start the background queue (called by App once the splash is out of the way) */
export function startScenePreload() {
  if (started || device.tier === "none") return;
  started = true;
  // normally after the hero has drawn; if the visitor has already scrolled past
  // the hero (it never draws while off-screen), start after a short delay anyway
  let go = false;
  const begin = (run: () => void) => () => {
    if (go) return;
    go = true;
    run();
  };
  const run = () => {
    (async () => {
      for (const name of ORDER) {
        await new Promise<void>((r) => idle(r));
        if (!queued.has(name)) {
          queued.add(name);
          emit();
        }
        await waitReady(name, 6000);
      }
    })();
  };
  onFilmReady(begin(run));
  setTimeout(begin(run), 2500);
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => void listeners.delete(cb);
};

/** true once the queue has reached this scene — mount its canvas */
export function useScenePreloaded(name: SceneName) {
  return useSyncExternalStore(
    subscribe,
    () => queued.has(name),
    () => false,
  );
}

/** true once the scene has drawn its first frame — fade its poster out */
export function useSceneReady(name: SceneName) {
  return useSyncExternalStore(
    subscribeScenes,
    () => isSceneReady(name),
    () => false,
  );
}
