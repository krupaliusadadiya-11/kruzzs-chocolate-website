import meta from "../images-meta.json";

type Meta = Record<string, { w: number; h: number; by: string; bw: number; sw: number }>;
const M = meta as Meta;

/**
 * Responsive WebP photo with intrinsic width/height (reserves its box → no CLS).
 * `sizes` describes the rendered width so the browser picks the small file on mobile.
 */
export default function Img({
  name,
  alt,
  sizes = "(max-width: 760px) 92vw, 40vw",
  eager = false,
  className,
}: {
  name: string;
  alt: string;
  sizes?: string;
  eager?: boolean;
  className?: string;
}) {
  const m = M[name];
  return (
    <img
      className={className}
      src={`img/${name}-s.webp`}
      srcSet={`img/${name}-s.webp ${m?.sw ?? 720}w, img/${name}.webp ${m?.bw ?? 1400}w`}
      sizes={sizes}
      width={m?.w}
      height={m?.h}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      title={m ? `Photo: ${m.by} / Unsplash` : undefined}
    />
  );
}
