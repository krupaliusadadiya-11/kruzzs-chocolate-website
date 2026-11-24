import { useEffect, useState } from "react";
import type { SceneName } from "../lib/film";
import { useSceneReady } from "../lib/scenePreload";
import Img from "./Img";

/**
 * Loading fallback for a 3D section: an existing photo that holds the space
 * until the scene has drawn its first frame, then fades out underneath the
 * canvas and unmounts. If the scene was already prepared in the background it
 * never renders at all.
 */
export default function ScenePoster({ name, img, sizes, variant }: { name: SceneName; img: string; sizes: string; variant: "band" | "card" }) {
  const ready = useSceneReady(name);
  const [gone, setGone] = useState(ready);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setGone(true), 650);
    return () => clearTimeout(t);
  }, [ready]);
  if (gone) return null;
  return (
    <div className={`scene-poster ${variant}${ready ? " out" : ""}`} aria-hidden="true">
      <Img name={img} alt="" sizes={sizes} />
    </div>
  );
}
