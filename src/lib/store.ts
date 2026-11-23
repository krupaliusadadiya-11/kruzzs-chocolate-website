import { useSyncExternalStore } from "react";

/** Tiny front-end cart / wishlist / UI store (demo — no backend). */
type Line = { id: string; qty: number };
export type PageId = "contact" | "faqs" | "delivery" | "privacy" | "terms";
type State = {
  cart: Line[];
  wish: string[];
  cartOpen: boolean;
  quick: string | null;
  account: boolean;
  page: PageId | null;
  toast: { id: number; text: string } | null;
};

const load = <T,>(k: string, d: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : d;
  } catch {
    return d;
  }
};
const save = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* private mode etc. */
  }
};

let state: State = { cart: load("kz-cart", []), wish: load("kz-wish", []), cartOpen: false, quick: null, account: false, page: null, toast: null };
const subs = new Set<() => void>();
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  if (patch.cart) save("kz-cart", state.cart);
  if (patch.wish) save("kz-wish", state.wish);
  subs.forEach((f) => f());
};

let toastTimer = 0;
export const actions = {
  add(id: string, qty = 1, name?: string) {
    const ex = state.cart.find((l) => l.id === id);
    const cart = ex ? state.cart.map((l) => (l.id === id ? { ...l, qty: Math.min(20, l.qty + qty) } : l)) : [...state.cart, { id, qty }];
    set({ cart });
    actions.toast(`${name ?? "Item"} added to your bag`);
  },
  setQty(id: string, qty: number) {
    set({ cart: qty <= 0 ? state.cart.filter((l) => l.id !== id) : state.cart.map((l) => (l.id === id ? { ...l, qty: Math.min(20, qty) } : l)) });
  },
  remove(id: string) {
    set({ cart: state.cart.filter((l) => l.id !== id) });
  },
  toggleWish(id: string, name?: string) {
    const on = state.wish.includes(id);
    set({ wish: on ? state.wish.filter((w) => w !== id) : [...state.wish, id] });
    actions.toast(on ? `${name ?? "Item"} removed from wishlist` : `${name ?? "Item"} saved to wishlist`);
  },
  openCart(open = true) {
    set({ cartOpen: open, quick: null, account: false, page: null });
  },
  openAccount(open = true) {
    set({ account: open, cartOpen: false, quick: null, page: null });
  },
  openPage(page: PageId | null) {
    set({ page, cartOpen: false, account: false, quick: null });
  },
  clearCart() {
    set({ cart: [] });
  },
  quick(id: string | null) {
    set({ quick: id, cartOpen: false, account: false, page: null });
  },
  toast(text: string) {
    clearTimeout(toastTimer);
    set({ toast: { id: Date.now(), text } });
    toastTimer = window.setTimeout(() => set({ toast: null }), 2600);
  },
};

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => sel(state),
  );
}
