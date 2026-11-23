import { type ReactNode, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { scrollApi } from "../lib/scroll";
import { device } from "../lib/device";

gsap.registerPlugin(ScrollTrigger);

/**
 * From the scroll-site-generator skill (assets/SmoothScroll.tsx): Lenis on
 * GSAP's ticker so Lenis and ScrollTrigger share one clock — scrubbed
 * timelines stay in sync both directions. Native scroll for reduced motion.
 */
export default function SmoothScroll({ children, locked }: { children: ReactNode; locked: boolean }) {
  useEffect(() => {
    if (device.reducedMotion) return;
    const lenis = new Lenis({ lerp: device.mobile ? 0.14 : 0.1, smoothWheel: true, wheelMultiplier: 0.95, touchMultiplier: 1.3 });
    scrollApi.lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      scrollApi.lenis = null;
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("locked", locked);
    const l = scrollApi.lenis;
    if (!l) return;
    if (locked) l.stop();
    else l.start();
  }, [locked]);

  return <>{children}</>;
}
