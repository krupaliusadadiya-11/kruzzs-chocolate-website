# KRUZZ'S — Too Good to Share.

Homepage for a fictional Gen Z chocolate brand. Built with the **scroll-site-generator** skill's
GSAP-hybrid architecture (Lenis on the GSAP ticker, sticky stages, scrubbed reversible timelines,
full brand page after the film). Its AI-video pipeline is replaced by **real-time procedural 3D**.

```bash
npm install
npm run dev        # http://localhost:5190
npm run build && npm run preview   # production preview on :5191
npm run images     # re-download / re-encode the Unsplash photos (tools/images.json)
```

Debug flags: `?intro` replays the opening (it normally plays once per session), `?tier=high|low|none` forces a quality tier.

## What's real 3D vs. photography
| Element | How it's made |
|---|---|
| Intro piece, hero bar, snap/exploded view | Procedural Three.js geometry (`src/three/geometry.ts`): 18 pieces = slab cell + bevelled pillow, PBR clearcoat material |
| Hazelnuts, pistachios, cocoa nibs | Procedural displaced meshes with vertex colour, instanced |
| Melted chocolate stream | Displaced plane, custom vertex shader on a physical material; flow front driven by scroll |
| Gift box | Procedural box/lid/ribbon/bow/truffles; ribbon slips off → lid hinges open on scroll |
| Product, ingredient, gifting, story imagery | Real photos (Unsplash License), see `CREDITS.md` — stand-ins, not actual KRUZZ'S products |

## Where things live
- `src/components/Film.tsx` — intro + hero + "The Snap" scrubbed timeline (one sticky stage)
- `src/three/FilmScene.tsx` — bar, ingredients, label projection, studio lighting
- `src/components/Melt.tsx`, `src/three/MeltScene.tsx` — melt stream + circle-wipe macro reveals
- `src/components/Collection.tsx` — pinned horizontal rail (desktop) / swipe rail (tablet, mobile)
- `src/components/Sections.tsx` — bestsellers, ingredients, gifting (3D box), story, testimonials, newsletter, footer
- `src/lib/store.ts` — cart / wishlist / quick view (front-end demo, localStorage)
- `src/data.ts` — products, prices (illustrative INR), ingredients, gifts, sample reviews
- `PLAN.md` — skill mapping, asset strategy, performance strategy, section layout

## Performance notes
- Entry JS ≈ 92 KB gz + GSAP 32 KB gz; three.js/drei (~260 KB gz) is a lazy chunk, so the page paints and is usable before 3D arrives.
- Melt and gift scenes mount only near the viewport; every canvas pauses its render loop off-screen.
- Tiers: `low` (mobile / ≤4 cores) lowers DPR and geometry density; `none` (no WebGL) swaps every 3D scene for photos.
- Reduced motion: no intro, no Lenis, no idle motion or parallax; reveals are instant.
