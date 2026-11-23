import type { Product } from "../data";
import { inr } from "../data";
import { actions, useStore } from "../lib/store";
import Img from "./Img";
import { Eye, Heart } from "./Icons";

export default function ProductCard({ p, sizes = "(max-width: 600px) 92vw, (max-width: 1100px) 45vw, 24vw" }: { p: Product; sizes?: string }) {
  const wished = useStore((s) => s.wish.includes(p.id));
  return (
    <article className={`pcard tone-${p.tone}`}>
      <div className="pcard-media">
        <Img name={p.img} alt={`${p.name} — ${p.short}`} sizes={sizes} />
        {p.tag && <span className="chip">{p.tag}</span>}
        <button className={`wish${wished ? " on" : ""}`} aria-pressed={wished} aria-label={wished ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`} onClick={() => actions.toggleWish(p.id, p.name)}>
          <Heart filled={wished} />
        </button>
        <button className="quick" onClick={() => actions.quick(p.id)}>
          <Eye size={18} /> Quick view
        </button>
      </div>
      <div className="pcard-body">
        <h3>{p.name}</h3>
        <p className="pcard-short">{p.short}</p>
        <div className="pcard-meta">
          <span className="size">{p.size}</span>
          <span className="price">{inr(p.price)}</span>
        </div>
        <button className="btn btn-dark btn-block" onClick={() => actions.add(p.id, 1, p.name)}>
          Add to bag
        </button>
      </div>
    </article>
  );
}
