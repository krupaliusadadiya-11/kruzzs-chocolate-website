import { useEffect, useState } from "react";
import { Bag, Close, Menu, Search, User } from "./Icons";
import { actions, useStore } from "../lib/store";
import { PRODUCTS, inr } from "../data";
import { scrollApi } from "../lib/scroll";

export const NAV = [
  { label: "Home", href: "#top" },
  { label: "Our Chocolates", href: "#chocolates" },
  { label: "Our Story", href: "#story" },
  { label: "Ingredients", href: "#ingredients" },
  { label: "Gifting", href: "#gifting" },
];

export function go(e: React.MouseEvent, href: string) {
  e.preventDefault();
  if (href === "#top") scrollApi.to(0);
  else scrollApi.to(href);
}

export default function Nav() {
  const count = useStore((s) => s.cart.reduce((n, l) => n + l.qty, 0));
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const results = term
    ? PRODUCTS.filter((p) => (p.name + " " + p.short + " " + p.note + " " + p.size).toLowerCase().includes(term))
    : PRODUCTS.slice(0, 4);
  const pick = (id: string) => {
    setSearching(false);
    setQ("");
    actions.quick(id);
  };

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", open);
    if (open) scrollApi.lenis?.stop();
    else scrollApi.lenis?.start();
    const k = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(false), setSearching(false));
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  const link = (e: React.MouseEvent, href: string) => {
    setOpen(false);
    go(e, href);
  };

  return (
    <>
    <header className={`nav${scrolled ? " scrolled" : ""}`}>
      <div className="nav-inner container">
        <a href="#top" className="logo" onClick={(e) => link(e, "#top")} aria-label="KRUZZ'S home">
          KRUZZ<span>'</span>S
        </a>
        <nav className="nav-links" aria-label="Main">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} onClick={(e) => link(e, n.href)}>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <button className="icon-btn hide-sm" aria-label="Search" onClick={() => setSearching((v) => !v)}>
            <Search />
          </button>
          <button className="icon-btn hide-sm" aria-label="Account and wishlist" onClick={() => actions.openAccount(true)}>
            <User />
          </button>
          <button className="icon-btn bag-btn" aria-label={`Shopping bag, ${count} items`} onClick={() => actions.openCart(true)}>
            <Bag />
            {count > 0 && <span className="bag-count">{count}</span>}
          </button>
          <a href="#chocolates" className="btn btn-dark btn-sm hide-md" onClick={(e) => link(e, "#chocolates")}>
            Shop now
          </a>
          <button className="icon-btn burger" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? <Close /> : <Menu />}
          </button>
        </div>
      </div>

      {searching && (
        <form
          className="search-bar container"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (results[0]) pick(results[0].id);
            else actions.toast(`No chocolates match “${q.trim()}”`);
          }}
        >
          <div className="search-row">
            <Search size={18} />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search bars, truffles, flavours…"
              aria-label="Search products"
              aria-controls="search-results"
            />
            <button type="button" className="icon-btn" aria-label="Close search" onClick={() => (setSearching(false), setQ(""))}>
              <Close size={18} />
            </button>
          </div>
          <ul id="search-results" className="search-results" aria-live="polite">
            {!term && <li className="search-hint">Popular right now</li>}
            {results.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => pick(p.id)}>
                  <span>{p.name}</span>
                  <small>
                    {p.size} · {inr(p.price)}
                  </small>
                </button>
              </li>
            ))}
            {term && results.length === 0 && <li className="search-hint">No matches. Try “dark”, “nut” or “truffle”.</li>}
          </ul>
        </form>
      )}
    </header>

      <div className={`mobile-menu${open ? " open" : ""}`} aria-hidden={!open}>
        <nav aria-label="Mobile">
          {NAV.map((n, i) => (
            <a key={n.href} href={n.href} onClick={(e) => link(e, n.href)} style={{ transitionDelay: `${open ? 80 + i * 50 : 0}ms` }} tabIndex={open ? 0 : -1}>
              <span>0{i + 1}</span>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="mobile-menu-foot">
          <a href="#chocolates" className="btn btn-dark" onClick={(e) => link(e, "#chocolates")} tabIndex={open ? 0 : -1}>
            Shop now
          </a>
          <button className="btn btn-ghost" onClick={() => (setOpen(false), actions.openAccount(true))} tabIndex={open ? 0 : -1}>
            <User size={18} /> Account
          </button>
        </div>
      </div>
    </>
  );
}
