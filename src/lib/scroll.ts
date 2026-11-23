import type Lenis from "lenis";

/** shared handle so nav links / CTAs can drive the (smooth) scroll */
export const scrollApi = {
  lenis: null as Lenis | null,
  to(target: number | string | HTMLElement, opts: { immediate?: boolean; offset?: number } = {}) {
    const offset = opts.offset ?? -72;
    if (this.lenis) {
      this.lenis.scrollTo(target as never, { offset, duration: 1.4, immediate: opts.immediate, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
      return;
    }
    if (typeof target === "number") {
      window.scrollTo({ top: target, behavior: opts.immediate ? "auto" : "smooth" });
      return;
    }
    const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top: y, behavior: opts.immediate ? "auto" : "smooth" });
  },
};
