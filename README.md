# TeddyPups clone

Pixel-perfect clone of https://puppy.instabizweb.com (TeddyPups U.A.E.) with its own SQLite backend and admin panel.

**How it was built:** most of this project was built with AI: Claude, running in the Aside AI browser, as the coding agent. I directed it step by step: research and data extraction from the live site, architecture, page-by-page builds checked side by side against the original at 1440px and 390px, the admin panel, testing and deployment.

## Run it

```bash
cd ~/codes/teddypups-clone
npm install
npm run dev
```

Site: http://localhost:3077 · Admin: http://localhost:3077/admin

Admin login: `data/ADMIN_CREDENTIALS.txt` (created on first run; change the password in the admin, or set `ADMIN_EMAIL` / `ADMIN_PASSWORD` before the first run).

Production: `npm run build && npm start` (port 3077). Needs Node 22.13+ (uses the built-in `node:sqlite`). Keep `data/` and `public/media/` on persistent disk. Set `SITE_URL` for the sitemap, robots and OG tags.

## Deploying (Vercel)

Set these environment variables, then deploy (Node 22.13+ / 24):

| Variable | Value |
|---|---|
| `TP_DB_FILE` | `/tmp/teddypups.db` (serverless functions can only write to /tmp) |
| `MEDIA_DIR` | `/tmp/media` (admin uploads; served via `/api/media/*`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | first admin login |
| `ADMIN_SESSION_SECRET` | any long random string (signs the admin session cookie) |
| `SITE_URL` | the live URL |

On Vercel the database re-seeds from `data/seed/` on each cold start, so admin edits, uploads and enquiries are temporary in the demo. For production, point the data layer at a hosted database (Postgres / Turso) and uploads at object storage (S3 / R2), or run `npm start` on a server with a persistent disk.

## What is where

- `app/(site)/` public pages: `/`, `/puppies`, `/puppies/[slug]`, `/gone-home`, `/happy-families`, `/how-it-works`, `/faq`, `/contact`, 404 poster.
- `app/admin/` admin panel: dashboard, puppies (+ media manager), enquiries (CSV export), happy families, testimonials, FAQs, page content (every heading/paragraph/button on the site), media library, breeds/origins/collections, settings (WhatsApp, phone, email, address, socials, SEO).
- `lib/db.ts` SQLite schema, seed, reads. `lib/admin/` writes. `lib/actions.ts` enquiry server action (honeypot + validation).
- `app/styles/site.css` + `fonts.css`: the original compiled CSS and fonts, unchanged (this is what makes it pixel-perfect).
- `components/pup/runtime.tsx`: header, mobile menu, smooth scroll (Lenis), route curtain, paw cursor trail, reveal-on-scroll and the Teddy mascot engine. Generated from the original site's client code by `components/pup/gen-runtime.cjs` (edit the generator, not the output).
- `components/{home,puppies,families,howitworks,faq,contact,shell}/` page components.
- `data/seed/` original content (42 puppies, 64 family photos, FAQs, page copy, settings). `npm run seed -- --reset` restores it (keeps enquiries and admin users); `node scripts/seed.ts --sections` adds new page-copy rows without overwriting edits.
- `public/media/` every image as WebP (`<id>.webp` up to 1920px + `<id>-640.webp`), videos as MP4. Admin uploads are converted to WebP in the browser before upload.
- `_reference/` original HTML/CSS/JS used for the clone (not shipped).

## Before going live

- Replace the WhatsApp number/message (currently Insta Biz Web's demo number), phone, email, address and social links in Admin, Settings.
- The puppy and family photos belong to the real TeddyPups business; get permission or replace them.
- Parts of `components/pup/runtime.tsx` and `app/styles/site.css` are the original site's code; treat them as such.
