import { useState } from "react";
import { inr, productById } from "../data";
import { actions, useStore, type PageId } from "../lib/store";
import { scrollApi } from "../lib/scroll";
import { useDialog } from "./Overlays";
import Img from "./Img";
import { Bag, Close, Heart, User } from "./Icons";

/* ── Account / wishlist panel ─────────────────────────────── */
const closeAccount = () => actions.openAccount(false);
export function AccountDrawer() {
  const open = useStore((s) => s.account);
  const wish = useStore((s) => s.wish);
  const ref = useDialog(open, closeAccount);
  const t = open ? 0 : -1;
  return (
    <div className={`drawer-wrap${open ? " open" : ""}`} aria-hidden={!open}>
      <div className="scrim" onClick={closeAccount} />
      <div className="drawer" role="dialog" aria-modal="true" aria-label="Account and wishlist" ref={ref}>
        <div className="drawer-head">
          <h3>
            Your space <span>({wish.length} saved)</span>
          </h3>
          <button className="icon-btn" aria-label="Close account panel" onClick={closeAccount} tabIndex={t}>
            <Close />
          </button>
        </div>
        <div className="acct-note">
          <User size={20} />
          <p>Sign-in isn't available in this demo store, so nothing personal is collected. Your wishlist and bag are saved in this browser only.</p>
        </div>
        {wish.length === 0 ? (
          <div className="drawer-empty">
            <Heart size={40} />
            <p>No favourites yet. Tap the heart on any chocolate to save it here.</p>
            <button className="btn btn-dark" tabIndex={t} onClick={() => (closeAccount(), scrollApi.to("#bestsellers"))}>
              Browse bestsellers
            </button>
          </div>
        ) : (
          <ul className="lines">
            {wish.map((id) => {
              const p = productById(id);
              return (
                <li key={id} className="line">
                  <div className="line-img">
                    <Img name={p.img} alt="" sizes="88px" />
                  </div>
                  <div className="line-info">
                    <b>{p.name}</b>
                    <small>
                      {p.size} · {inr(p.price)}
                    </small>
                    <div className="line-actions">
                      <button className="link-btn small" tabIndex={t} onClick={() => actions.add(p.id, 1, p.name)}>
                        Add to bag
                      </button>
                      <button className="link-btn small" tabIndex={t} onClick={() => actions.quick(p.id)}>
                        Quick view
                      </button>
                    </div>
                  </div>
                  <div className="line-end">
                    <button className="link-btn small" tabIndex={t} onClick={() => actions.toggleWish(p.id, p.name)}>
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="drawer-foot">
          <button className="btn btn-ghost btn-block" tabIndex={t} onClick={() => actions.openCart(true)}>
            <Bag size={18} /> View bag
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Footer info pages (placeholder content for a fictional brand) ── */
const FAQS: [string, string][] = [
  ["Is KRUZZ'S a real brand?", "No. KRUZZ'S is a fictional brand and this is a demo website. Products, prices and orders are illustrative."],
  ["How should I store chocolate?", "Somewhere cool and dry, away from sunlight and strong smells. The fridge isn't ideal: it can leave a dull white bloom on the surface."],
  ["Can I change or cancel an order?", "Orders in this demo are never processed, so there's nothing to cancel. A live store would explain its policy here."],
  ["Do you list allergens?", "A live store would show full ingredient and allergen information on every product. This demo does not, so please don't rely on it."],
];

const PAGES: Record<Exclude<PageId, "contact">, { title: string; body: React.ReactNode }> = {
  faqs: {
    title: "FAQs",
    body: (
      <div className="faq">
        {FAQS.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    ),
  },
  delivery: {
    title: "Delivery information",
    body: (
      <>
        <p>This is placeholder copy for a demo store. No orders are shipped.</p>
        <p>A live store would describe delivery areas, timelines, warm-weather packaging and charges here. The free-delivery bar in the bag is illustrative only.</p>
      </>
    ),
  },
  privacy: {
    title: "Privacy policy",
    body: (
      <>
        <p>This demo has no backend. It does not collect, send or store personal data on a server.</p>
        <p>Your bag and wishlist are kept in your own browser's local storage so they survive a refresh; clearing site data removes them. The newsletter and contact forms only check what you type and do not send it anywhere.</p>
      </>
    ),
  },
  terms: {
    title: "Terms and conditions",
    body: (
      <>
        <p>KRUZZ'S is a fictional brand created for a website demonstration. Nothing on this site is an offer for sale.</p>
        <p>Photography comes from Unsplash under the Unsplash License and does not show real KRUZZ'S products.</p>
      </>
    ),
  },
};

function ContactForm() {
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  if (sent)
    return (
      <p className="sent-note" role="status">
        Thanks! This demo has no backend, so your message was not sent anywhere.
      </p>
    );
  return (
    <form
      className="contact-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const email = String(f.get("email") || "").trim();
        if (!String(f.get("name") || "").trim()) return setErr("Please add your name.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setErr("Please add a valid email address.");
        if (String(f.get("msg") || "").trim().length < 5) return setErr("Please write a short message.");
        setErr("");
        setSent(true);
      }}
    >
      <p>Placeholder contact details: hello@example.com · +91 00000 00000</p>
      <label>
        Name
        <input name="name" autoComplete="name" />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" />
      </label>
      <label>
        Message
        <textarea name="msg" rows={4} />
      </label>
      {err && (
        <p className="form-err" role="alert">
          {err}
        </p>
      )}
      <button className="btn btn-dark" type="submit">
        Send message
      </button>
      <p className="fine">Demo form: backend not configured, nothing is sent.</p>
    </form>
  );
}

const closePage = () => actions.openPage(null);
export function InfoPage() {
  const id = useStore((s) => s.page);
  const ref = useDialog(!!id, closePage);
  if (!id) return null;
  const title = id === "contact" ? "Contact" : PAGES[id].title;
  return (
    <div className="modal-wrap open">
      <div className="scrim" onClick={closePage} />
      <div className="modal info" role="dialog" aria-modal="true" aria-labelledby="info-title" ref={ref}>
        <button className="icon-btn modal-x" aria-label={`Close ${title}`} onClick={closePage}>
          <Close />
        </button>
        <div className="modal-body">
          <p className="kicker">KRUZZ'S · demo</p>
          <h3 id="info-title">{title}</h3>
          <div className="info-body">{id === "contact" ? <ContactForm /> : PAGES[id].body}</div>
        </div>
      </div>
    </div>
  );
}
