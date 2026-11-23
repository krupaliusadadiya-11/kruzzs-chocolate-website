import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PRODUCTS, inr } from "../data";
import { actions } from "../lib/store";
import Img from "./Img";
import { Arrow, Plus } from "./Icons";

gsap.registerPlugin(ScrollTrigger);

const TONE_BG: Record<string, string> = {
  pistachio: "#C7D6B9",
  dark: "#5A3026",
  cream: "#FFF8EF",
  butter: "#F4DDA8",
  blush: "#E9B7B5",
  cocoa: "#E3CBB8",
};

/**
 * Collection transitions: on desktop a pinned horizontal rail whose background
 * melts into each bar's colour as it reaches the centre. Tablet / mobile get
 * a native swipe rail (no pin, no scroll-jacking).
 */
export default function Collection() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const el = track.current!;
      const dist = () => el.scrollWidth - window.innerWidth + parseFloat(getComputedStyle(el).paddingLeft);
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => "+=" + dist(),
          pin: ".coll-pin",
          scrub: 0.6,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
      tl.to(el, { x: () => -dist(), duration: PRODUCTS.length - 1 }, 0);
      PRODUCTS.forEach((p, i) => {
        if (i === 0) return;
        tl.to(root.current, { backgroundColor: TONE_BG[p.tone], color: p.tone === "dark" ? "#FFF8EF" : "#5A3026", duration: 0.6 }, i - 0.8);
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section id="chocolates" ref={root} className="collection" style={{ backgroundColor: TONE_BG.pistachio }} aria-labelledby="coll-h">
      <div className="coll-pin">
        <div className="container coll-head">
          <div>
            <p className="kicker">The line-up · 08 flavours</p>
            <h2 id="coll-h" className="h2">
              Find your kind <em>of indulgence.</em>
            </h2>
          </div>
          <p className="lead">From deep and moody to soft and creamy — pick the flavour that matches your main-character energy.</p>
        </div>
        <div className="coll-rail" ref={track} role="list">
          {PRODUCTS.map((p, i) => (
            <article key={p.id} className={`coll-card tone-${p.tone}`} role="listitem">
              <div className="coll-media">
                <Img name={p.img} alt={`${p.name}: ${p.short}`} sizes="(max-width: 760px) 80vw, 30vw" />
                <span className="coll-num">
                  {String(i + 1).padStart(2, "0")}/{String(PRODUCTS.length).padStart(2, "0")}
                </span>
                {p.tag && <span className="chip">{p.tag}</span>}
              </div>
              <div className="coll-body">
                <h3>{p.name}</h3>
                <p>{p.short}</p>
                <p className="note">{p.note}</p>
                <div className="coll-foot">
                  <span className="price">{inr(p.price)}</span>
                  <div className="coll-actions">
                    <button className="link-btn" onClick={() => actions.quick(p.id)}>
                      Explore <Arrow size={16} />
                    </button>
                    <button className="icon-btn round" aria-label={`Add ${p.name} to bag`} onClick={() => actions.add(p.id, 1, p.name)}>
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
