import { lazy, Suspense, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { device } from "../lib/device";
import { melt } from "../lib/film";
import { useInView } from "../three/useInView";
import { useScenePreloaded } from "../lib/scenePreload";
import ScenePoster from "./ScenePoster";
import Img from "./Img";

gsap.registerPlugin(ScrollTrigger);
const MeltScene = lazy(() => import("../three/MeltScene"));

const MACROS = [
  { n: "01", t: "Rich cocoa notes", s: "Deep, toasty, a little bit dramatic.", img: "t-swirl", alt: "Close-up of swirled, glossy melted chocolate" },
  { n: "02", t: "Silky texture", s: "Melts slow. Disappears fast.", img: "t-pour", alt: "A thick ribbon of liquid chocolate pouring" },
  { n: "03", t: "Perfectly crafted", s: "Glossy squares, clean break lines.", img: "t-macro", alt: "Macro shot of glossy chocolate bar squares" },
];

export default function Melt() {
  const root = useRef<HTMLElement>(null);
  const stream = useRef<HTMLDivElement>(null);
  const near = useInView(root, "150% 0px", true); // lazy-mount ~half a screen early
  const visible = useInView(stream, "80px");
  const has3D = device.tier !== "none";
  const preloaded = useScenePreloaded("melt"); // background warm-up queue reached this scene

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // flow front follows the scroll — reversible by construction
      ScrollTrigger.create({
        trigger: stream.current,
        start: "top 92%",
        end: "bottom 30%",
        scrub: true,
        onUpdate: (st) => (melt.p = st.progress),
      });
      // close-up texture reveals: circle wipes (skill "material morph" recipe)
      gsap.utils.toArray<HTMLElement>(".macro-media").forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: "circle(8% at 50% 60%)" },
          { clipPath: "circle(75% at 50% 50%)", ease: "none", scrollTrigger: { trigger: el, start: "top 92%", end: "top 45%", scrub: 0.6 } },
        );
        gsap.fromTo(el.querySelector("img"), { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 92%", end: "bottom 30%", scrub: 0.6 } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="melt" ref={root} className="melt section" aria-labelledby="melt-h">
      <div className="container melt-head">
        <div data-reveal>
          <p className="kicker">Melt mode: on</p>
          <h2 id="melt-h" className="h2">
            Smooth. Rich. <em>Unforgettable.</em>
          </h2>
        </div>
        <p className="lead" data-reveal>
          Glossy, slow and thick enough to stand a spoon in. Keep scrolling — it's already on its way.
        </p>
      </div>

      <div ref={stream} className="melt-stream" aria-hidden="true">
        {has3D ? (
          <>
            <ScenePoster name="melt" img="t-silk" sizes="100vw" variant="band" />
            {(near || preloaded) && (
              <Suspense fallback={null}>
                <MeltScene active={visible} />
              </Suspense>
            )}
          </>
        ) : (
          <Img name="t-silk" alt="" sizes="100vw" className="melt-fallback" />
        )}
      </div>

      <div className="container macro-grid">
        {MACROS.map((m) => (
          <article key={m.n} className="macro" data-reveal>
            <div className="macro-media">
              <Img name={m.img} alt={m.alt} sizes="(max-width: 760px) 92vw, 30vw" />
            </div>
            <p className="macro-n">{m.n} —</p>
            <h3>{m.t}</h3>
            <p>{m.s}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
