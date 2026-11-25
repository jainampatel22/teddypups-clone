# TeddyPups clone: build notes (read first)

Goal: pixel-perfect, fully responsive clone of https://puppy.instabizweb.com with every animation, scroll effect and interaction, driven by our own SQLite backend and an admin panel. All images are WebP.

## Stack
- Next.js 16 App Router + TypeScript (strict off), React 19. Turbopack dev server on **http://localhost:3077** (already running, started by the parent agent; do NOT start another server, do NOT kill it).
- Styling: the ORIGINAL compiled CSS, verbatim: `app/styles/site.css` (site) and `app/styles/fonts.css` (fonts). Do not edit these two files. Use the exact original class names and DOM structure. If you truly need extra CSS, put it in your own file (e.g. `app/styles/clone-<area>.css`) and keep it minimal.
- Smooth scroll: `lenis` (installed). Everything else is hand-written (no animation libs).
- Data: `lib/db.ts` (node:sqlite, file `data/teddypups.db`, auto-seeded from `data/seed/*.json`). Types in `lib/types.ts` mirror the original CMS shapes, so ported components can take the same props.
- Images: stored as `/public/media/<id>.webp` (≤1920px) + `/public/media/<id>-640.webp`; videos `/public/media/<id>.mp4`. Use `components/ui/TpImage.tsx` for CMS media (blur placeholder, focal point, dominant colour, like the original). Logo: `/brand/logo.webp`.
- Forms: server action `sendEnquiry` in `lib/actions.ts` (honeypot `website`, saves to `enquiries`). Use with `useActionState`.
- Page copy must be editable: read headings/body/CTA labels via `getSection(page, key, fallback)`; put the original copy as seed in `data/seed/sections/<page>.json` (`{ "<key>": { "heading", "body", "data": {...}, "media": [Media...] } }`), then run `node scripts/seed.ts --sections` (adds missing rows, never overwrites). `data` holds lists like steps/items/CTAs.
- Settings (WhatsApp number/message, phone, email, address, socials, footer copy, SEO): `getSettings()`, `whatsappHref()`.

## Reference material (`_reference/`)
- `_reference/html/<page>.html`: original server-rendered body HTML for every URL (home, puppies, gone-home, happy-families, how-it-works, faq, contact, puppies__<slug>).
- `_reference/js/*.js`: the original app's client components (Turbopack chunks, lightly line-broken). Exports by chunk:
  - `04u0_mknmf3rz.js`: HeaderBehavior, MobileMenu, NavLink, Lenis + SmoothScroll
  - `177ya708_1zuj.js`: Teddy SVG drawing (poses), PupBuddy (global mascot engine), runner, RouteCurtain, reduced-motion hooks (module 18535: F() = prefers reduced motion, z() hook, R(query) hook)
  - `1wa3jfz4v5w2v.js`: HeroLineup, Meet (doors), PupJourney, Chat, Dusk (home)
  - `1llon2cx5n3pm.js`: frame loop / pup helpers
  - `05_bi2sw5g1xo.js`: PuppyBrowser (filters), RevealScope
  - `2nuczo_oug6l2.js`: PuppyGallery, StoryRibbon, EnquiryForm, photo viewer
  - `37w5q0adtoy9q.js`: MemoryWall (happy families) + photo viewer
  - `3gnj9-_12x8lt.js` / `0te0tivnjcmcm.js`: Flight, Journeys (how it works)
  - `0l31q30pdlxu0.js`: NoticeBoard (faq)
  - `1cuytp2cyhxp8.js`: LetterForm (contact)
  - `_reference/css/all.css`: original CSS (same as app/styles).
- `scripts/html2jsx.mjs`: converts original HTML to JSX and rewrites image URLs to the local WebP files. `node scripts/html2jsx.mjs _reference/html/faq.html '<startMarker>' '<endMarker>'`.
- `data/seed/*.json`: puppies (42), happy-photos (64), faqs, testimonials, journeys (how-it-works), settings, sections/home.json, media-index.json.
- Clone kit with page copy/screenshots: `~/Downloads/teddypups-clone-kit/`.

## Method (per page)
1. Generate the static JSX from `_reference/html/<page>.html` with html2jsx.
2. Turn repeated items into loops over DB data; move copy into sections seed.
3. Port the client component(s) from `_reference/js` into readable `"use client"` TSX under `components/<area>/`. Keep behaviour identical (timings, easing, data-* state attributes the CSS keys off, reduced-motion fallbacks). Long geometry/path tables may be copied verbatim.
4. Verify in the browser side by side with the original at 1440x900 and 390x844 (open a NEW tab, call setViewportSize BEFORE goto; check innerWidth). Compare screenshots section by section, plus scroll/hover/click behaviour. Fix until they match.

## Ownership (do not edit files you don't own; ask the parent if you need a change)
| Owner | Files |
|---|---|
| shell | `app/(site)/layout.tsx`, `components/shell/**`, `components/pup/**` (Teddy SVG + global mascot engine), `_gen/Static{Curtain,Header,Footer}.tsx` (delete when replaced) |
| home | `app/(site)/page.tsx`, `components/home/**`, `data/seed/sections/home.json`, `_gen/StaticHomeMain.tsx` (delete when replaced) |
| puppies | `app/(site)/puppies/**`, `app/(site)/gone-home/**`, `components/puppies/**`, `data/seed/sections/{puppies,gone-home,puppy}.json` |
| pages | `app/(site)/{happy-families,how-it-works,faq,contact}/**`, `components/{families,howitworks,faq,contact}/**`, `data/seed/sections/{happy-families,how-it-works,faq,contact}.json` |
| admin | `app/admin/**`, `app/api/**`, `components/admin/**`, `lib/admin/**`, `app/styles/admin.css`, `app/sitemap.ts`, `app/robots.ts`, `middleware.ts` / `proxy.ts` |
| parent | `lib/db.ts`, `lib/types.ts`, `lib/actions.ts`, `lib/image-loader.ts`, `components/ui/**`, `next.config.ts`, `package.json`, `app/layout.tsx`, `app/styles/site.css`, `app/styles/fonts.css`, this file |

The global mascot (`.pup-layer`, `.pup-prints`, `.pup-probe`) attaches to `[data-pup-stop]` elements in the DOM; page owners keep the original `pup-stop`/`pup-buddy` markup where the original has it (from html2jsx), and the shell owner's engine drives it.

## Rules
- No new dependencies without asking the parent. No `npm install` in other folders.
- Do not start/stop dev servers. Do not git commit (parent commits).
- Do not submit forms on the ORIGINAL site (it would message a real business). Testing our local forms is fine.
- Keep TypeScript compiling: `npx tsc --noEmit -p .` should show no errors in your files.
