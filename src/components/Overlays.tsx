import { useEffect, useRef, useState } from "react";
import { inr, productById } from "../data";
import { actions, useStore } from "../lib/store";
import { scrollApi } from "../lib/scroll";
import Img from "./Img";
import { Bag, Close, Heart, Minus, Plus } from "./Icons";

/** Esc to close + keep focus inside while open + lock page scroll */
export function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    el?.querySelector<HTMLElement>("button, a, input, textarea, summary")?.focus();
    scrollApi.lenis?.stop();
    document.documentElement.classList.add("modal-open");
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && el) {
        const f = [...el.querySelectorAll<HTMLElement>("button, a[href], input, textarea, summary")].filter((x) => !x.hasAttribute("disabled"));
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      scrollApi.lenis?.start();
      document.documentElement.classList.remove("modal-open");
      prev?.focus?.();
    };
  }, [open, onClose]);
  return ref;
}

const closeCart = () => actions.openCart(false);
const closeQuick = () => actions.quick(null);

export function CartDrawer() {
  const open = useStore((s) => s.cartOpen);
  const cart = useStore((s) => s.cart);
  const ref = useDialog(open, closeCart);
  const [step, setStep] = useState<"bag" | "review" | "done">("bag");
  const [orderRef, setOrderRef] = useState("");
  useEffect(() => {
    if (!open) setStep("bag");
  }, [open]);
  const subtotal = cart.reduce((n, l) => n + productById(l.id).price * l.qty, 0);
  const free = 999;

  return (
    <div className={`drawer-wrap${open ? " open" : ""}`} aria-hidden={!open}>
      <div className="scrim" onClick={closeCart} />
      <div className="drawer" role="dialog" aria-modal="true" aria-label="Shopping bag" ref={ref}>
        <div className="drawer-head">
          <h3>
            Your bag <span>({cart.reduce((n, l) => n + l.qty, 0)})</span>
          </h3>
          <button className="icon-btn" aria-label="Close bag" onClick={closeCart} tabIndex={open ? 0 : -1}>
            <Close />
          </button>
        </div>
        {step === "done" ? (
          <div className="drawer-empty">
            <Bag size={40} />
            <p>
              <b>Demo order {orderRef} placed.</b>
              <br />
              No payment was taken and nothing was shipped — this store is a front-end demo.
            </p>
            <button className="btn btn-dark" tabIndex={open ? 0 : -1} onClick={() => (closeCart(), scrollApi.to("#chocolates"))}>
              Keep browsing
            </button>
          </div>
        ) : cart.length === 0 ? (
          <div className="drawer-empty">
            <Bag size={40} />
            <p>Your bag is empty. Bold move.</p>
            <button className="btn btn-dark" tabIndex={open ? 0 : -1} onClick={() => (closeCart(), scrollApi.to("#chocolates"))}>
              Find your flavour
            </button>
          </div>
        ) : (
          <>
            <div className="ship-bar">
              {subtotal >= free ? "Free delivery unlocked (demo)" : `Add ${inr(free - subtotal)} more for free delivery (demo)`}
              <i style={{ transform: `scaleX(${Math.min(1, subtotal / free)})` }} />
            </div>
            <ul className="lines">
              {cart.map((l) => {
                const p = productById(l.id);
                return (
                  <li key={l.id} className="line">
                    <div className="line-img">
                      <Img name={p.img} alt="" sizes="88px" />
                    </div>
                    <div className="line-info">
                      <b>{p.name}</b>
                      <small>{p.size}</small>
                      <div className="qty">
                        <button aria-label={`Decrease ${p.name}`} onClick={() => actions.setQty(l.id, l.qty - 1)} tabIndex={open ? 0 : -1}>
                          <Minus size={14} />
                        </button>
                        <span aria-live="polite">{l.qty}</span>
                        <button aria-label={`Increase ${p.name}`} onClick={() => actions.setQty(l.id, l.qty + 1)} tabIndex={open ? 0 : -1}>
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="line-end">
                      <span>{inr(p.price * l.qty)}</span>
                      <button className="link-btn small" onClick={() => actions.remove(l.id)} tabIndex={open ? 0 : -1}>
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="drawer-foot">
              <div className="subtotal">
                <span>Subtotal</span>
                <b>{inr(subtotal)}</b>
              </div>
              {step === "bag" ? (
                <>
                  <button className="btn btn-dark btn-block" onClick={() => setStep("review")} tabIndex={open ? 0 : -1}>
                    Checkout
                  </button>
                  <p className="fine">Taxes and delivery calculated at checkout.</p>
                </>
              ) : (
                <>
                  <p className="review-note" role="status">
                    Demo checkout: no payment details are collected and no money is charged. Place a demo order for {inr(subtotal)}?
                  </p>
                  <div className="btn-row">
                    <button
                      className="btn btn-dark grow"
                      tabIndex={open ? 0 : -1}
                      onClick={() => {
                        setOrderRef("#KZ" + String(Date.now()).slice(-5));
                        actions.clearCart();
                        setStep("done");
                      }}
                    >
                      Place demo order
                    </button>
                    <button className="btn btn-ghost" tabIndex={open ? 0 : -1} onClick={() => setStep("bag")}>
                      Back
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function QuickView() {
  const id = useStore((s) => s.quick);
  const wished = useStore((s) => (s.quick ? s.wish.includes(s.quick) : false));
  const ref = useDialog(!!id, closeQuick);
  const [qty, setQty] = useState(1);
  useEffect(() => setQty(1), [id]);
  if (!id) return null;
  const p = productById(id);
  return (
    <div className="modal-wrap open">
      <div className="scrim" onClick={closeQuick} />
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="qv-title" ref={ref}>
        <button className="icon-btn modal-x" aria-label="Close quick view" onClick={closeQuick}>
          <Close />
        </button>
        <div className={`modal-media tone-${p.tone}`}>
          <Img name={p.img} alt={`${p.name} — ${p.short}`} sizes="(max-width: 760px) 92vw, 460px" eager />
        </div>
        <div className="modal-body">
          {p.tag && <span className="chip static">{p.tag}</span>}
          <h3 id="qv-title">{p.name}</h3>
          <p className="price-lg">{inr(p.price)}</p>
          <p>{p.short}</p>
          <p className="note">{p.note}</p>
          <dl className="specs">
            <div>
              <dt>Size</dt>
              <dd>{p.size}</dd>
            </div>
            <div>
              <dt>Store</dt>
              <dd>Demo · illustrative price</dd>
            </div>
          </dl>
          <div className="qv-actions">
            <div className="qty lg">
              <button aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus size={16} />
              </button>
              <span aria-live="polite">{qty}</span>
              <button aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(20, q + 1))}>
                <Plus size={16} />
              </button>
            </div>
            <button className="btn btn-dark grow" onClick={() => (actions.add(p.id, qty, p.name), closeQuick())}>
              Add to bag · {inr(p.price * qty)}
            </button>
            <button className={`icon-btn round wish-inline${wished ? " on" : ""}`} aria-pressed={wished} aria-label="Toggle wishlist" onClick={() => actions.toggleWish(p.id, p.name)}>
              <Heart filled={wished} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Toast() {
  const t = useStore((s) => s.toast);
  return (
    <div className="toast-wrap" aria-live="polite" role="status">
      {t && (
        <div className="toast" key={t.id}>
          <span className="toast-dot" />
          {t.text}
          {t.text.includes("bag") && (
            <button className="link-btn small" onClick={() => actions.openCart(true)}>
              View bag
            </button>
          )}
        </div>
      )}
    </div>
  );
}
