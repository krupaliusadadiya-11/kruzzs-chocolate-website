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
    if (l) {
      if (locked) l.stop();
      else l.start();
    }
    // the lock hides the scrollbar, so everything below the hero was measured at
    // the wrong width — re-measure once the page is scrollable again
    if (!locked) {
      const id = requestAnimationFrame(() => ScrollTrigger.refresh());
      return () => cancelAnimationFrame(id);
    }
  }, [locked]);

  /* re-measure whenever the page height changes (late images, fonts, lazy sections) */
  useEffect(() => {
    let last = document.body.scrollHeight;
    let t = 0;
    const ro = new ResizeObserver(() => {
      const h = document.body.scrollHeight;
      if (Math.abs(h - last) < 2) return;
      last = h;
      clearTimeout(t);
      t = window.setTimeout(() => {
        ScrollTrigger.refresh();
        last = document.body.scrollHeight;
      }, 200);
    });
    ro.observe(document.body);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, []);

  return <>{children}</>;
}
