import meta from "../images-meta.json";

type Meta = Record<string, { w: number; h: number; by: string; bw: number; sw: number }>;
const M = meta as Meta;

/**
 * Responsive AVIF/WebP photo with intrinsic width/height (reserves its box → no CLS).
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
  const sw = m?.sw ?? 720;
  const bw = m?.bw ?? 1400;
  // AVIF (encoded from the originals, ~20% smaller) with the WebP set as fallback.
  // <picture> is display: contents, so layout and CSS targeting the <img> are unchanged.
  return (
    <picture>
      <source type="image/avif" srcSet={`img/${name}-s.avif ${sw}w, img/${name}.avif ${bw}w`} sizes={sizes} />
      <img
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        // below-the-fold photos never compete with the hero 3D / critical scripts for bandwidth
        fetchPriority={eager ? "auto" : "low"}
        sizes={sizes}
        srcSet={`img/${name}-s.webp ${sw}w, img/${name}.webp ${bw}w`}
        src={`img/${name}-s.webp`}
        className={className}
        width={m?.w}
        height={m?.h}
        alt={alt}
        title={m ? `Photo: ${m.by} / Unsplash` : undefined}
      />
    </picture>
  );
}
