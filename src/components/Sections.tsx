import { lazy, Suspense, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BESTSELLERS, GIFTS, INGREDIENTS, TESTIMONIALS, productById } from "../data";
import { device } from "../lib/device";
import { gift } from "../lib/film";
import { useInView } from "../three/useInView";
import { scrollApi } from "../lib/scroll";
import { actions, type PageId } from "../lib/store";
import ProductCard from "./ProductCard";
import Img from "./Img";
import { Arrow, Facebook, Instagram, Pinterest } from "./Icons";
import { NAV, go } from "./Nav";

gsap.registerPlugin(ScrollTrigger);
const GiftScene = lazy(() => import("../three/GiftScene"));

/* ── Bestsellers ─────────────────────────────────────────── */
export function Bestsellers() {
  return (
    <section id="bestsellers" className="section bestsellers" aria-labelledby="best-h">
      <div className="container">
        <div className="sec-head" data-reveal>
          <div>
            <p className="kicker">Bestsellers</p>
            <h2 id="best-h" className="h2">
              The ones <em>everyone loves.</em>
            </h2>
          </div>
          <p className="fine">Demo store · illustrative prices in INR</p>
        </div>
        <div className="best-grid">
          {BESTSELLERS.map((id) => (
            <div key={id} data-reveal>
              <ProductCard p={productById(id)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Ingredients ─────────────────────────────────────────── */
export function Ingredients() {
  return (
    <section id="ingredients" className="section ingredients" aria-labelledby="ing-h">
      <div className="container">
        <div className="sec-head" data-reveal>
          <div>
            <p className="kicker">What goes in</p>
            <h2 id="ing-h" className="h2">
              Beauty begins with <em>the ingredients.</em>
            </h2>
          </div>
          <p className="lead">Six favourites that show up again and again across the KRUZZ'S line-up.</p>
        </div>
        <div className="ing-grid">
          {INGREDIENTS.map((x, i) => (
            <figure key={x.name} className="ing" data-reveal>
              <div className="ing-media">
                <Img name={x.img} alt={x.name} sizes="(max-width: 600px) 92vw, (max-width: 1100px) 45vw, 30vw" />
              </div>
              <figcaption>
                <span className="ing-n">0{i + 1}</span>
                <span>
                  <b>{x.name}</b>
                  <small>{x.line}</small>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Gifting: sticky 3D box that unwraps with the scroll ── */
/* boundaries match beats() in GiftScene */
const STEPS = ["Untie the bow", "Lift the lid", "Unfold the tissue", "Hello, truffles"];
const giftStep = (p: number) => (p < 0.32 ? 0 : p < 0.58 ? 1 : p < 0.74 ? 2 : 3);
export function Gifting() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const near = useInView(root, "150% 0px", true);
  const visible = useInView(stage, "60px");
  const has3D = device.tier !== "none";
  const [step, setStep] = useState(0);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: ".gift-track",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (st) => {
          gift.p = st.progress;
          setStep(giftStep(st.progress));
        },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="gifting" ref={root} className="gifting" aria-labelledby="gift-h">
      <div className="gift-track">
        <div className="gift-stage" ref={stage}>
          <div className="container gift-grid">
            <div className="gift-copy">
              <p className="kicker">Gifting</p>
              <h2 id="gift-h" className="h2">
                Give a little <em>happiness.</em>
              </h2>
              <p className="lead">A rigid ivory box, a gold-foil lid, a satin bow and tissue over nine truffles. The unboxing is half the gift.</p>
              <ol className="gift-steps" aria-label="Unboxing">
                {STEPS.map((s, i) => (
                  <li key={s} className={i === step ? "on" : i < step ? "done" : ""}>
                    <span>0{i + 1}</span> {s}
                  </li>
                ))}
              </ol>
              <a href="#gift-list" className="btn btn-dark" onClick={(e) => (e.preventDefault(), scrollApi.to("#gift-list"))}>
                Explore gift collection <Arrow size={18} />
              </a>
            </div>
            <div className="gift-canvas" aria-hidden="true">
              {has3D ? (
                near && (
                  <Suspense fallback={null}>
                    <GiftScene active={visible} />
                  </Suspense>
                )
              ) : (
                <Img name="g-box" alt="" sizes="(max-width: 760px) 92vw, 45vw" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div id="gift-list" className="container gift-list">
        {GIFTS.map((g) => (
          <article key={g.name} className="gcard" data-reveal>
            <div className="gcard-media">
              <Img name={g.img} alt={g.name} sizes="(max-width: 600px) 92vw, (max-width: 1100px) 45vw, 24vw" />
            </div>
            <h3>{g.name}</h3>
            <p>{g.line}</p>
            <button className="link-btn" onClick={() => actions.quick(g.product)}>
              Shop {g.name.toLowerCase()} <Arrow size={16} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ── Brand story ─────────────────────────────────────────── */
export function Story() {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (device.reducedMotion) return;
      gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
        const sp = parseFloat(el.dataset.speed || "0");
        gsap.fromTo(el, { yPercent: sp * 30 }, { yPercent: -sp * 30, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="story" ref={root} className="section story" aria-labelledby="story-h">
      <div className="container story-grid">
        <div className="story-media">
          <div className="sm sm-a" data-speed="0.12">
            <Img name="s-stack" alt="A stack of chocolate squares with a glossy drip on a blush background" sizes="(max-width: 760px) 70vw, 30vw" />
          </div>
          <div className="sm sm-b" data-speed="-0.18">
            <Img name="s-pinkbars" alt="Pink-glazed chocolate bars" sizes="(max-width: 760px) 50vw, 22vw" />
          </div>
          <div className="sm sm-c" data-speed="0.28">
            <Img name="s-raspberry" alt="Pink chocolates with raspberries" sizes="(max-width: 760px) 50vw, 18vw" />
          </div>
        </div>
        <div className="story-copy">
          <p className="kicker" data-reveal>
            Our story
          </p>
          <h2 id="story-h" className="h2" data-reveal>
            More than chocolate. <em>It's a mood.</em>
          </h2>
          <p className="lead" data-reveal>
            KRUZZ'S started with one slightly selfish idea: make chocolate so good you'd rather not share it.
          </p>
          <p data-reveal>
            So we went loud — bold flavours, a little drama, packaging you'll want to keep long after the last square. We make treats for group chats and
            late nights, for small wins and big moods, for the people who say "just one piece" and mean the whole bar.
          </p>
          <p className="signoff" data-reveal>
            — Team KRUZZ'S
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials (placeholder demo content) ──────────────── */
export function Testimonials() {
  return (
    <section className="section testimonials" aria-labelledby="t-h">
      <div className="container">
        <div className="sec-head center" data-reveal>
          <div>
            <p className="kicker">Shared moments</p>
            <h2 id="t-h" className="h2">
              Sweet memories, <em>zero leftovers.</em>
            </h2>
          </div>
          <p className="demo-note">Sample reviews — placeholder demo content, not real or verified customers.</p>
        </div>
        <div className="t-grid">
          {TESTIMONIALS.map((t, i) => (
            <figure key={i} className={`tcard t${i}`} data-reveal>
              <blockquote>“{t.quote}”</blockquote>
              <figcaption>
                <b>{t.who}</b>
                <span>{t.tag}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Newsletter (front-end only) ──────────────────────────── */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "error" | "done">("idle");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
    setState(ok ? "done" : "error");
  };
  return (
    <section className="newsletter" aria-labelledby="nl-h">
      <div className="container nl-inner" data-reveal>
        <p className="kicker">The KRUZZ'S club</p>
        <h2 id="nl-h" className="h2">
          A little sweetness <em>in your inbox.</em>
        </h2>
        <p className="lead">Discover new collections, special treats and beautiful moments.</p>
        {state === "done" ? (
          <p className="nl-done" role="status">
            You're on the list (in spirit). This demo has no email backend configured, so nothing was sent or stored.
          </p>
        ) : (
          <form className="nl-form" onSubmit={submit} noValidate>
            <label htmlFor="nl-email" className="sr-only">
              Email address
            </label>
            <input
              id="nl-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              aria-invalid={state === "error"}
              aria-describedby="nl-msg"
              onChange={(e) => (setEmail(e.target.value), setState("idle"))}
            />
            <button className="btn btn-pink" type="submit">
              Subscribe
            </button>
          </form>
        )}
        <p id="nl-msg" className={`nl-msg${state === "error" ? " err" : ""}`}>
          {state === "error"
            ? "That email doesn't look quite right — try again?"
            : "We'll only use your email for KRUZZ'S news. Unsubscribe anytime. (Demo: backend not connected.)"}
        </p>
      </div>
    </section>
  );
}

/* ── Footer ───────────────────────────────────────────────── */
export function Footer() {
  const extra: [string, PageId][] = [
    ["Contact", "contact"],
    ["FAQs", "faqs"],
    ["Delivery Information", "delivery"],
    ["Privacy Policy", "privacy"],
    ["Terms and Conditions", "terms"],
  ];
  return (
    <footer className="footer">
      <div className="container">
        <div className="f-top">
          <div className="f-brand">
            <a href="#top" className="logo logo-lg" onClick={(e) => go(e, "#top")}>
              KRUZZ<span>'</span>S
            </a>
            <p>Chocolate, crafted to melt moments. Too Good to Share.</p>
            <div className="socials">
              <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram (opens in a new tab)">
                <Instagram />
              </a>
              <a href="https://www.pinterest.com/" target="_blank" rel="noopener noreferrer" aria-label="Pinterest (opens in a new tab)">
                <Pinterest />
              </a>
              <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook (opens in a new tab)">
                <Facebook />
              </a>
            </div>
          </div>
          <nav className="f-col" aria-label="Footer — shop">
            <h4>Explore</h4>
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={(e) => go(e, n.href)}>
                {n.label}
              </a>
            ))}
          </nav>
          <nav className="f-col" aria-label="Footer — help">
            <h4>Help</h4>
            {extra.map(([label, id]) => (
              <a key={id} href={`#${id}`} onClick={(e) => (e.preventDefault(), actions.openPage(id))}>
                {label}
              </a>
            ))}
          </nav>
          <div className="f-col">
            <h4>Say hi</h4>
            <button className="f-link" onClick={() => actions.openPage("contact")}>
              hello@example.com
            </button>
            <button className="f-link" onClick={() => actions.openPage("contact")}>
              +91 00000 00000
            </button>
            <p className="fine">Placeholder contact details</p>
          </div>
        </div>
        <div className="f-bottom">
          <span>© 2026 KRUZZ'S. All Rights Reserved.</span>
          <span>Fictional brand · demo website · photos via Unsplash</span>
        </div>
      </div>
      <div className="f-giant" aria-hidden="true">
        KRUZZ'S
      </div>
    </footer>
  );
}
