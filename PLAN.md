# KRUZZ'S — homepage plan

Brand: **KRUZZ'S** · "Too Good to Share." · Gen Z chocolate boutique (fictional).
Palette: chocolate `#5A3026` · blush `#E9B7B5` · butter `#F4DDA8` · pistachio `#C7D6B9` · cream `#FFF8EF`.
Type: **Fraunces** (soft, wonky display serif — oversized headlines, italic accents) + **Bricolage Grotesque** (body/UI).

## 1. How the Scroll Site Generator skill is used

Skill location: `D:\scroll-site-generator\scroll-site-generator` (SKILL.md + 5 references + engine assets).

| Skill part | Used? | How |
|---|---|---|
| Architecture choice → **GSAP hybrid** (`references/gsap-nextjs.md`) | Yes | Brief reads like a marketing-page spec with labels/sections → hybrid, not the single vanilla film. Vite+React instead of Next (same pattern, no SSR needed). |
| `assets/SmoothScroll.tsx` (Lenis on the GSAP ticker) | Yes, verbatim pattern | One clock for Lenis + ScrollTrigger → scrubbed timelines are reversible and glitch-free scrolling backwards. |
| Section pattern: tall section + `sticky top-0 h-screen` stage + one `scrub` timeline in `gsap.context` | Yes | The "film" (intro → hero → snap/exploded view) and the gift box use this. |
| Pipeline step 1 — storyboard into chapters | Yes | See §4. |
| Exploded-view recipe | Adapted | The skill slices a still into strips because AI video duplicates objects. We have *real geometry*, so the bar literally splits into its 12 pieces — strictly better. Labels with scaleX ticks after pieces settle (skill recipe). |
| Material-morph recipe (`clipPath: circle()` wipes, not crossfades) | Yes | Close-up texture reveals in the melt section. |
| Spec/label callouts entering with `blur(6px) → 0` | Yes | Exploded-view labels. |
| Brand page (`references/brand-page.md`): film is the opening act, then full homepage, sticky nav, simple `top 75%` reveals, real footer | Yes | §4 sections 5–13 use non-scrubbed reveal triggers. |
| `.img-blend` radial masks | Partly | Used where photos sit on coloured bands; product cards keep clean rounded crops (e-commerce needs crisp product shots). |
| Higgsfield stills + Kling clips + `build_master.py` frame film, `useFrameSequence` | **No** | `.env` HF key is incomplete (no `key:secret`), no ffmpeg/Python on this machine, and the brief demands genuine interactive 3D. Same decision as the VELOCITY X1 build. |
| Dark default aesthetic | **Overridden** | Brief requires light, colourful Gen Z palette. |
| Verification gotchas (hidden preview tab stalls GSAP → verify in real Chrome) | Yes | Final QA in Chrome. |

## 2. Asset strategy (audit result: project folder was empty — no 3D models, no photos)

**Real-time 3D (procedural Three.js, PBR, written for this project — honest, genuine geometry):**
- Chocolate bar: 6×3 grid (18 pieces). Each piece = base slab cell + raised "pillow" segment (extruded rounded rect with sloped bevels), so the bar breaks along its real grooves and shows true thickness when exploded.
- Material: `MeshPhysicalMaterial`, deep milk-dark brown, roughness ~0.35 with a procedural micro-noise roughness/normal map (temper bloom + mould sheen), thin clearcoat → glossy tops vs. satin sides.
- Lighting: local `Environment` built from `Lightformer`s (no HDR download), warm key + rim; soft blob floor shadows (cheaper and more controllable than ContactShadows, which showed hard plane edges).
- Ingredients for the exploded view: procedural hazelnuts, pistachio kernels, cocoa nibs (displaced geometry).
- Melt section: a displaced liquid sheet (custom shader on physical material) whose flow front is scroll-driven across the section.
- Gift box: rounded box + lid in blush paper, satin chocolate-brown ribbon + bow, truffles inside; scroll scrubs ribbon loosening → lid opening → reveal.

**Photography:** 27 real Unsplash photos (free Unsplash License, no Unsplash+), one distinct photo per product/ingredient/gift slot, credited in `CREDITS.md`. They are stand-ins for product photography of a fictional brand.

**Not used:** AI image/video generation (no working key; also spends credits), stock 3D downloads (none present; licensing + size risk).

## 3. Performance strategy
- Page is usable immediately: no blocking loader. The intro is a ≤3 s overlay, once per session (`sessionStorage`), skippable (click/scroll/Esc), skipped entirely for reduced motion.
- Hero 3D chunk loads first; melt + gift scenes are `React.lazy` chunks mounted only when within ~1 viewport.
- Every `<Canvas>` pauses its render loop (`frameloop="never"`) when off-screen.
- Quality tiers: `high` desktop, `low` mobile/≤4 cores (DPR ≤1.5, fewer segments, no melt displacement detail), `none` no WebGL → photo fallbacks. Force via `?tier=`.
- Photos: WebP in two sizes (`srcset`), explicit width/height, `loading="lazy"` below the fold. Total target < 3 MB.
- Fonts: 2 families, `display=swap`, preconnect.

## 4. Homepage section layout (12-col grid, max-width 1360px, 8px spacing scale)
0. **Intro** (once/session): a single chocolate piece turns in studio light, the KRUZZ'S wordmark rises behind it, the other 17 pieces snap in to form the bar → hands off to the hero.
1. **Nav** (sticky, cream): logo · Shop / Collection / Our Story / Ingredients / Gifting · search, account, bag(count) · SHOP NOW. Mobile: full-screen menu.
2. **Hero** — two columns: left copy ("Too good to share." oversized), right the floating, rotating 3D bar on a blush blob. Text column and 3D column never overlap (separate grid areas; on mobile the bar sits above the copy).
3. **The Snap** (pinned, scrubbed, reversible): bar moves to centre → camera pushes in → snaps into 18 pieces that float apart, showing thickness → hazelnuts/pistachios/nibs drift in → labels → pieces return and the bar lands at the showcase angle.
4. **Melt** — "Melt mode: on." Liquid chocolate flows across the section as you scroll; three macro photo reveals (circle wipes) with 01/02/03 labels.
5. **Collection** — 8 products. Desktop: pinned horizontal rail, background colour shifts per product; tablet/mobile: native swipe rail (no pin).
6. **Bestsellers** — 4 cards: image, name, note, size, ₹ price, Add to bag, Quick view, wishlist. Working cart drawer, quick-view modal, wishlist (localStorage).
7. **Ingredients** — 6 photo tiles with short labels; no certification/health/sourcing claims.
8. **Gifting** — sticky 3D gift box opening on scroll + 4 occasion cards + CTA.
9. **Story** — "More than chocolate. It's a mood." Editorial photo collage + short fictional brand story (no dates, places or claims).
10. **Testimonials** — 3 cards, clearly labelled "Sample reviews (demo content)".
11. **Newsletter** — validated form; states that no backend is connected.
12. **Footer** — links, socials, placeholder contact, © 2026 KRUZZ'S.
