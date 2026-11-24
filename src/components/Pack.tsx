import { lazy, Suspense, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { device } from "../lib/device";
import { pack } from "../lib/film";
import { scrollApi } from "../lib/scroll";
import { useInView } from "../three/useInView";
import Img from "./Img";
import { Arrow } from "./Icons";

gsap.registerPlugin(ScrollTrigger);
const PackScene = lazy(() => import("../three/PackScene"));

/* thresholds mirror packBeats() in PackScene (kept here so the DOM never pulls in three.js) */
const FLAVOURS = [
  { name: "Pistachio Crunch", bg: "#E3EBD8", fg: "#3b221b" },
  { name: "Midnight Dark", bg: "#24130d", fg: "#FFF8EF" },
  { name: "Hazelnut Heaven", bg: "#FBEFD3", fg: "#3b221b" },
];
const flavourAt = (p: number) => (p < 0.1 ? 0 : p < 0.26 ? 1 : 2);
const STEPS = [
  { t: "Pick your mood", until: 0.36 },
  { t: "Slide it open", until: 0.66 },
  { t: "Peel the foil", until: 0.83 },
  { t: "Snap time", until: 1.01 },
];
const stepAt = (p: number) => STEPS.findIndex((s) => p < s.until);

/**
 * Pack shot: a real 3D printed carton. Scroll spins it through three flavours
 * (the print swaps while its back faces you), lays it down, slides the tray
 * out of the sleeve, peels the gold foil and lifts the bar out.
 */
export default function Pack() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const near = useInView(root, "150% 0px", true);
  const visible = useInView(stage, "60px");
  const has3D = device.tier !== "none";
  const [flv, setFlv] = useState(0);
  const [step, setStep] = useState(0);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      let last = -1;
      ScrollTrigger.create({
        trigger: ".pack-track",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (st) => {
          const p = st.progress;
          pack.p = p;
          setStep(stepAt(p));
          const f = flavourAt(p);
          setFlv(f);
          if (f !== last) {
            last = f;
            gsap.to(root.current, { backgroundColor: FLAVOURS[f].bg, color: FLAVOURS[f].fg, duration: 0.7, ease: "power2.out", overwrite: true });
          }
        },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="pack" ref={root} className={`pack flv-${flv}`} style={{ backgroundColor: FLAVOURS[0].bg, ["--pbg" as string]: FLAVOURS[flv].bg }} aria-labelledby="pack-h">
      <div className="pack-track">
        <div className="pack-stage" ref={stage}>
          <div className="pack-ghost" aria-hidden="true">
            {FLAVOURS.map((f, i) => (
              <span key={f.name} className={i === flv ? "on" : ""}>
                {f.name}
              </span>
            ))}
          </div>
          <div className="container pack-grid">
            <div className="pack-copy">
              <p className="kicker">The pack</p>
              <h2 id="pack-h" className="h2">
                Dressed to <em>impress.</em>
              </h2>
              <p className="lead">Printed board, hot-foil gold and a foil wrap that crinkles just right. Keep scrolling to unbox one.</p>
              <p className="pack-flavour" aria-live="polite">
                <small>Now showing</small>
                <b key={flv}>{FLAVOURS[flv].name}</b>
              </p>
              <ol className="gift-steps pack-steps" aria-label="Unboxing">
                {STEPS.map((s, i) => (
                  <li key={s.t} className={i === step ? "on" : i < step ? "done" : ""}>
                    <span>
                      <b>0{i + 1}</b>
                    </span>{" "}
                    {s.t}
                  </li>
                ))}
              </ol>
              <a href="#bestsellers" className="btn btn-dark" onClick={(e) => (e.preventDefault(), scrollApi.to("#bestsellers"))}>
                Shop the bars <Arrow size={18} />
              </a>
            </div>
            <div className="pack-canvas" aria-hidden="true">
              {has3D ? (
                near && (
                  <Suspense fallback={null}>
                    <PackScene active={visible} />
                  </Suspense>
                )
              ) : (
                <Img name="p-pistachio" alt="" sizes="(max-width: 760px) 92vw, 50vw" />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
