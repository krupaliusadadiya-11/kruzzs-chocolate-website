import { useCallback, useLayoutEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SmoothScroll from "./components/SmoothScroll";
import Nav from "./components/Nav";
import Film from "./components/Film";
import Melt from "./components/Melt";
import Collection from "./components/Collection";
import { Bestsellers, Footer, Gifting, Ingredients, Newsletter, Story, Testimonials } from "./components/Sections";
import { CartDrawer, QuickView, Toast } from "./components/Overlays";
import { AccountDrawer, InfoPage } from "./components/Extras";
import { device } from "./lib/device";

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
