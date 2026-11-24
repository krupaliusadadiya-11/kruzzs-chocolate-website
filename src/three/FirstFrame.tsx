import { useEffect, useRef } from "react";
import type * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { markSceneReady, type SceneName } from "../lib/film";

/**
 * Warm-up + readiness for a below-the-fold scene.
 *
 * The expensive parts of a scene's first frame — shader compilation, GPU
 * texture uploads, the Environment cube render — used to happen the moment the
 * section scrolled into view (the canvas loop is paused until then), which
 * froze the page for up to ~1.3 s and made the animation start late.
 *
 * This runs them ahead of time, while the scene is still off-screen:
 *  1. compile every material with `compileAsync` (uses KHR_parallel_shader_compile
 *     where available, so compilation doesn't block the main thread),
 *  2. upload the listed textures one per frame (e.g. carton prints that are only
 *     swapped in mid-animation),
 *  3. draw one real frame via `advance`, then report the scene as ready.
 * The canvas then stays paused until it is actually visible, exactly as before.
 */
export function FirstFrame({ name, textures }: { name: SceneName; textures?: (THREE.Texture | null | undefined)[] }) {
  const { gl, scene, camera, advance } = useThree();
  const sent = useRef(false);

  useFrame(() => {
    if (sent.current) return;
    sent.current = true;
    requestAnimationFrame(() => markSceneReady(name));
  });

  useEffect(() => {
    let dead = false;
    const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
    (async () => {
      await nextFrame(); // tree committed, environment target attached to the scene
      try {
        await gl.compileAsync(scene, camera);
      } catch {
        /* older drivers: the first frame compiles synchronously instead */
      }
      for (const t of textures ?? []) {
        if (dead) return;
        if (t) gl.initTexture(t);
        await nextFrame();
      }
      if (!dead && !sent.current) advance(performance.now());
    })();
    return () => {
      dead = true;
    };
  }, [gl, scene, camera, advance, textures]);

  return null;
}
