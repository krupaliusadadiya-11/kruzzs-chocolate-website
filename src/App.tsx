import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SmoothScroll from "./components/SmoothScroll";
import Nav from "./components/Nav";
import Film from "./components/Film";
import Melt from "./components/Melt";
import Collection from "./components/Collection";
import Pack from "./components/Pack";
import { Bestsellers, Footer, Gifting, Ingredients, Newsletter, Story, Testimonials } from "./components/Sections";
import { CartDrawer, QuickView, Toast } from "./components/Overlays";
import { AccountDrawer, InfoPage } from "./components/Extras";
import { device } from "./lib/device";
import { onFilmReady } from "./lib/film";

gsap.registerPlugin(ScrollTrigger);
if (import.meta.env.DEV) (window as unknown as { __ST: typeof ScrollTrigger }).__ST = ScrollTrigger;

function shouldPlayIntro() {
  if (device.reducedMotion || device.tier === "none") return false;
  if (new URLSearchParams(location.search).has("intro")) return true;
  try {
    return !sessionStorage.getItem("kz-intro");
  } catch {
    return true;
  }
}

export default function App() {
  const [intro, setIntro] = useState(shouldPlayIntro);

  const introDone = useCallback(() => {
    try {
      sessionStorage.setItem("kz-intro", "1");
    } catch {
      /* ignore */
    }
    setIntro(false);
  }, []);

  /* warm up the below-the-fold 3D scenes while the visitor is still on the hero,
     so they are compiled and ready the first time they scroll down */
  useEffect(() => {
    if (device.tier === "none") return;
    const warm = () => {
      void import("./three/MeltScene");
      void import("./three/PackScene");
      void import("./three/GiftScene");
    };
    // only after the hero chocolate is on screen, so it never competes with it
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const later = () => (ric ? ric(warm, { timeout: 2500 }) : setTimeout(warm, 800));
    return onFilmReady(later);
  }, []);

  useLayoutEffect(() => {
    history.scrollRestoration = "manual";
    if (intro) window.scrollTo(0, 0);
    document.documentElement.classList.toggle("intro-on", intro);
  }, [intro]);

  /* shared non-scrubbed reveals (skill brand-page rule: fade + rise, start "top 85%") */
  useLayoutEffect(() => {
    if (device.reducedMotion) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 88%",
        once: true,
        onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.85, ease: "power3.out", overwrite: true }),
      });
    });
    const fontsReady = document.fonts?.ready.then(() => ScrollTrigger.refresh());
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    void fontsReady;
    return () => {
      ctx.revert();
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return (
    <SmoothScroll locked={intro}>
      <a href="#chocolates" className="skip-link">
        Skip to products
      </a>
      <Nav />
      <main>
        <Film introPlaying={intro} onIntroDone={introDone} />
        <Melt />
        <Collection />
        <Pack />
        <Bestsellers />
        <Ingredients />
        <Gifting />
        <Story />
        <Testimonials />
        <Newsletter />
      </main>
      <Footer />
      <CartDrawer />
      <AccountDrawer />
      <InfoPage />
      <QuickView />
      <Toast />
    </SmoothScroll>
  );
}
