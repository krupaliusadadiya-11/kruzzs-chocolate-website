import { type RefObject, useEffect, useState } from "react";

/** true while the element is within `margin` of the viewport — used to pause render loops / lazy-mount scenes */
export function useInView(ref: RefObject<Element | null>, margin = "0px", once = false) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        if (once && e.isIntersecting) io.disconnect();
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin, once]);
  return inView;
}
