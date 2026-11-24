import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { film, labelEls } from "../lib/film";
import { device } from "../lib/device";
import { scrollApi } from "../lib/scroll";
import { useInView } from "../three/useInView";
import Img from "./Img";
import { Arrow } from "./Icons";

gsap.registerPlugin(ScrollTrigger);
const FilmScene = lazy(() => import("../three/FilmScene"));

const LABELS = [
  { n: "01", t: "18 snappable squares", s: "Bevelled pillows, clean break lines", side: "left" },
  { n: "02", t: "Real crunch inside", s: "Roasted hazelnut + pistachio", side: "right" },
  { n: "03", t: "Glossy, tempered finish", s: "That loud, satisfying snap", side: "right" },
];

/**
 * The opening act (skill: GSAP hybrid — one sticky stage, one scrubbed
 * timeline in gsap.context): intro → hero → "The Snap" exploded view.
 */
export default function Film({ introPlaying, onIntroDone }: { introPlaying: boolean; onIntroDone: () => void }) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const inView = useInView(root, "100px");
  const has3D = device.tier !== "none";

  /* ── intro (once per session, skippable, skipped for reduced motion) ── */
  useLayoutEffect(() => {
    if (!introPlaying) {
      film.intro = 1;
      return;
    }
    film.intro = 0;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: onIntroDone });
      tl.to(film, { intro: 1, duration: 3.1, ease: "power2.inOut" }, 0.15)
        .fromTo(".intro-word .ch", { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.05, ease: "power4.out" }, 0.35)
        .fromTo(".intro-tag", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 1.0)
        .to(".intro-word, .intro-tag", { autoAlpha: 0, scale: 0.94, duration: 0.6, ease: "power2.in" }, 2.35)
        .to(".intro", { autoAlpha: 0, duration: 0.7 }, 2.55);
      const skip = () => tl.timeScale(5);
      const evs = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
      evs.forEach((e) => window.addEventListener(e, skip, { once: true, passive: true }));
      return () => evs.forEach((e) => window.removeEventListener(e, skip));
    }, root);
    return () => ctx.revert();
  }, [introPlaying, onIntroDone]);

  /* ── hero entrance after the intro ── */
  useEffect(() => {
    if (introPlaying) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-copy > *",
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.9, ease: "power3.out", delay: 0.05, clearProps: "transform" },
      );
      gsap.fromTo(".hero-title .ln > span", { yPercent: 105 }, { yPercent: 0, stagger: 0.1, duration: 1.05, ease: "power4.out" });
    }, root);
    return () => ctx.revert();
  }, [introPlaying]);

  /* ── the scrubbed film timeline ── */
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.8, invalidateOnRefresh: true },
      });
      const bg = stage.current!;
      // 0 → 1.4 hero hands over to centre stage
      tl.to(".hero-copy", { autoAlpha: 0, y: -70, duration: 0.9, ease: "power1.in" }, 0)
        .to(".hero-blob", { scale: 0.6, autoAlpha: 0, duration: 1 }, 0)
        .to(".scroll-cue", { autoAlpha: 0, duration: 0.3 }, 0)
        .to(film, { hero: 0, size: 0.5, lift: -0.18, rotX: 1.05, rotY: 0.1, rotZ: 0, idle: 0.2, duration: 1.4, ease: "power2.inOut" }, 0)
        .to(bg, { backgroundColor: "#F7DCD6", duration: 1.4 }, 0)
        .fromTo(".cap-1", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 1.0)
        // 1.6 → 3.6 SNAP: pieces separate, camera pushes in, angle shows the thickness
        .to(film, { explode: 1, camZ: 8.4, camY: 1.5, rotX: 0.55, orbit: 0.45, lift: -0.22, size: 0.42, duration: 2, ease: "power2.inOut" }, 1.6)
        .to(".cap-1", { autoAlpha: 0, y: -24, duration: 0.5 }, 2.5)
        .to(film, { ingredients: 1, duration: 1.6, ease: "power1.out" }, 2.6)
        // 3.6 → 6 hold, labels, slow orbit
        .to(film, { orbit: 1.0, duration: 2.4 }, 3.6)
        .to(film, { labels: 1, duration: 0.6 }, 3.8)
        .fromTo(".anno", { autoAlpha: 0, filter: "blur(6px)" }, { autoAlpha: 1, filter: "blur(0px)", stagger: 0.18, duration: 0.5 }, 3.8)
        .fromTo(".anno .tick", { scaleX: 0 }, { scaleX: 1, stagger: 0.18, duration: 0.4 }, 4.0)
        .fromTo(".cap-2", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 4.0)
        .to(".cap-2", { autoAlpha: 0, y: -24, duration: 0.5 }, 5.6)
        .to(".anno", { autoAlpha: 0, duration: 0.4 }, 5.6)
        .to(film, { labels: 0, duration: 0.4 }, 5.6)
        // 6 → 8 pieces come home, bar lands at the showcase angle
        .to(film, { ingredients: 0, duration: 1.0, ease: "power1.in" }, 6.0)
        .to(film, { explode: 0, camZ: 8.6, camY: 1.0, orbit: 0, rotX: 0.62, rotY: -0.42, rotZ: 0.08, lift: -0.16, size: 0.46, duration: 2, ease: "power2.inOut" }, 6.0)
        .to(bg, { backgroundColor: "#F4DDA8", duration: 2 }, 6.4)
        .to(film, { idle: 0.7, duration: 1 }, 7.6)
        .fromTo(".cap-3", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 7.8)
        .to({}, { duration: 1.4 }, 8.4);
    }, root);
    return () => ctx.revert();
  }, []);


  return (
    <section id="top" ref={root} className="film" aria-label="KRUZZ'S chocolate bar — hero and snap story">
      <div ref={stage} className={`film-stage${introPlaying ? " intro-front" : ""}`}>
        <div className="hero-blob" aria-hidden="true" />
        {introPlaying && (
          <div className="intro" aria-hidden="true">
            <div className="intro-word">
              {"KRUZZ'S".split("").map((c, i) => (
                <span className="ch-wrap" key={i}>
                  <span className="ch">{c}</span>
                </span>
              ))}
            </div>
            <p className="intro-tag">Too Good to Share.</p>
            <span className="intro-skip">Scroll or tap to skip</span>
          </div>
        )}
        <div className="stage-canvas" aria-hidden="true">
          {has3D ? (
            <Suspense fallback={null}>
              <FilmScene active={inView} />
            </Suspense>
          ) : !has3D ? (
            <div className="film-fallback">
              <Img name="p-milky" alt="" eager sizes="(max-width: 760px) 80vw, 40vw" />
            </div>
          ) : null}
        </div>

        {/* hero copy — lives in its own grid column, never under the bar */}
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="kicker">
              <span className="dot" /> Handcrafted chocolate
            </p>
            <h1 className="hero-title">
              <span className="ln">
                <span>Unexpected</span>
              </span>
              <span className="ln">
                <span>
                  <em>Pairings.</em>
                </span>
              </span>
            </h1>
            <p className="lead">
              Bold flavours. Beautifully crafted.
              <br />A little indulgence, a lot of personality.
            </p>
            <div className="btn-row">
              <a href="#chocolates" className="btn btn-dark" onClick={(e) => (e.preventDefault(), scrollApi.to("#chocolates"))}>
                Explore Collection <Arrow size={18} />
              </a>
              <a href="#story" className="btn btn-ghost" onClick={(e) => (e.preventDefault(), scrollApi.to("#story"))}>
                Our Story
              </a>
            </div>
            <p className="hero-foot">Made for the moments worth savouring.</p>
          </div>
        </div>

        {/* featured-flavour tag beside the bar; shares the hero-copy class so the
            existing hero fade/entrance tweens carry it — no timeline changes */}
        <p className="hero-feature hero-copy" aria-label="Featured flavour: Midnight Dark, 70% dark chocolate">
          <span className="hf-k">Featured flavour</span>
          <span className="hf-name">Midnight Dark</span>
          <span className="hf-sub">70% dark chocolate</span>
        </p>

        {/* ivory information strip along the bottom of the hero (also rides the hero-copy fade) */}
        <div className="hero-strip hero-copy">
          <ul className="container hero-strip-inner" aria-label="Brand highlights">
            {[
              ["01", "Crafted with Care", "Every chocolate has its own story."],
              ["02", "Unexpected Flavours", "A new twist in every bite."],
              ["03", "Made to Be Shared", "Little moments. Big happiness."],
            ].map(([n, t, s]) => (
              <li key={n}>
                <span className="hs-n">{n}</span>
                <span className="hs-t">
                  <b>{t}</b>
                  <small>{s}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="scroll-cue" aria-hidden="true">
          <span>Scroll to snap</span>
          <i />
        </div>

        {/* snap captions — top band, clear of the bar */}
        <div className="caps container" aria-live="off">
          <div className="cap cap-1">
            <p className="kicker">The Snap</p>
            <h2>
              Eighteen squares.
              <br />
              <em>All of them yours.</em>
            </h2>
          </div>
          <div className="cap cap-2">
            <p className="kicker">Inside the bar</p>
            <h2>
              Crunch, <em>unpacked.</em>
            </h2>
            <ul className="cap-list">
              {LABELS.map((l) => (
                <li key={l.n}>
                  <b>{l.n}</b> {l.t}
                </li>
              ))}
            </ul>
          </div>
          <div className="cap cap-3">
            <p className="kicker">Back in one piece</p>
            <h2>
              Snap it. Share it? <em>Nah.</em>
            </h2>
            <a href="#chocolates" className="btn btn-dark" onClick={(e) => (e.preventDefault(), scrollApi.to("#chocolates"))}>
              Shop the bars <Arrow size={18} />
            </a>
          </div>
        </div>

        {/* annotation labels, positioned from projected 3D anchors */}
        <div className="annos" aria-hidden="true">
          {LABELS.map((l, i) => (
            <div key={l.n} className={`anno ${l.side}`} ref={(el) => void (labelEls[i] = el)}>
              <span className="pin" />
              <span className="tick" />
              <span className="anno-text">
                <b>
                  {l.n} — {l.t}
                </b>
                <small>{l.s}</small>
              </span>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
