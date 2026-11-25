# How this was built: AI tools and exact prompts

**Tools:** Claude (Anthropic) running inside **Aside**, an AI browser that can drive a real browser, read pages, run code and edit files. One Aside session did the research and the shared foundation, then split the build across 5 parallel Claude sub-agents (shell, home, puppies, content pages, admin), and finally integrated, tested and deployed.

**My role:** I gave the direction (below), reviewed results in the browser, and made the calls on scope, login, GitHub, hosting and the submission.

---

## 1. My prompts (verbatim, in order)

1. > i want to clone this site end to end. so first gather all info of this https://puppy.instabizweb.com/

   Result: crawl of all 49 URLs, page copy, design tokens (colours, fonts, easing), screenshots at desktop and mobile, interaction tests (filters, FAQ search, lightbox, mobile menu), the full puppy data model from the Next.js payload, 220 assets, and a clone spec.

2. > ok so based on this let's start cloning from frontend to backend. we will create a admin panel for the data and make sure to use webp images ( use actual images from the site )
   > i want pixel perfect design + responsivness and animations, scrolling everything

   Result: the whole app (foundation, 5 parallel workers, integration, QA, production build).

3. > so now we can record the video right?

4. > 2-3 mins loom will work i guess just showing on local host of cloned site and admin pane;

5. > email pass is wrong keep it simple like my email address and my name as pass

6. > use my personal github of pateljainams122@gmail.com and host it live and show me draft message and tell them that most of the things are made using AI ( claude + aside )

7. > send email instead

8. > can u upload on loom and get a link

9. > also share our prompts in email or something

---

## 2. How the agent worked (decisions it made, which I reviewed)

- **Data first:** extracted the original CMS records (42 puppies, 64 family photos, FAQs, page sections) from the site's server-rendered payload into `data/seed/*.json`.
- **Pixel parity:** kept the original compiled CSS and class names, and converted the original server-rendered HTML to JSX with a small script (`scripts/html2jsx.mjs`). The animation runtime (header, smooth scroll, page curtain, mascot engine) reuses the original client code via a generator (`components/pup/gen-runtime.cjs`).
- **Backend:** SQLite through Node's built-in `node:sqlite` (no native dependencies), a server action for enquiries with a honeypot, and an admin panel with scrypt password hashes and signed session cookies.
- **Images:** every image re-encoded to WebP (1920px + 640px), in the browser, from the original files. Admin uploads are converted to WebP in the browser too.
- **QA:** compared page heights and section heights against the original at 1440x900 and 390x844 (all pages match; the photo wall is 36px off on mobile from image rounding), checked every page for runtime errors, tested the forms end to end into the admin inbox, and ran a production build.
- **Deploy:** Vercel, with the database in `/tmp` (re-seeds on cold start) and stateless admin sessions.

---

## 3. Build instructions the agent gave its 5 parallel workers (verbatim)

All workers shared `BUILD-NOTES.md` (in this repo) for conventions and file ownership.

### Shell + mascot engine
> You are the SHELL worker for the TeddyPups clone at /Users/jainam/codes/teddypups-clone. Read BUILD-NOTES.md first and follow it (ownership, rules, dev server already running on :3077, do not start/stop servers, no git commits).
>
> Your job: replace the static shell (`_gen/StaticCurtain.tsx`, `_gen/StaticHeader.tsx`, `_gen/StaticFooter.tsx`) with real components in `components/shell/**` and `components/pup/**`, wired in `app/(site)/layout.tsx`, behaving exactly like the original:
> 1. Header: HeaderBehavior (data-scrolled / data-hidden on scroll, focusin unhides, data-home on "/"), NavLink with active state (aria-current, data-active, paw svg), logo (/brand/logo.webp via next/image), WhatsApp button from settings, MobileMenu dialog with closing animation, closes on tp:navigate.
> 2. Footer from getSettings() (heading, blurb, explore links, say hello list with real email link (no Cloudflare obfuscation), socials, stars, moon, basket with the snug pup-stop), and the mobile sticky WhatsApp + Call bar.
> 3. RouteCurtain (intro state on first load, covering/covered/lifting/snap states, prints, runner SVG, tp:navigate / tp:arrived events, html[data-curtain]), skipping /admin links.
> 4. SmoothScroll (Lenis with the original options, hash-link handling, only on fine pointers, disabled on reduced motion) and the reduced-motion helpers.
> 5. RevealScope / [data-reveal] behaviour if it is global (check where the original sets the revealed state) and the full-screen `<canvas class="pointer-events-none fixed inset-0 z-[70]">` effect (find what it draws in the chunks, e.g. paw cursor trail/confetti, and port it).
> 6. The Teddy mascot: port the Teddy SVG drawing with all poses (module in 177ya708_1zuj.js) as `components/pup/Teddy.tsx`, and the global PupBuddy engine (`.pup-probe`, `.pup-prints`, `.pup-layer`, `.pup-actor`, bubbles, `pup:cue` event, `cuePup()` helper, html[data-pup]) as `components/pup/PupBuddy.tsx`, mounted globally so it drives every `[data-pup-stop]` in the DOM like the original (on home it walks between the stops with paw prints; check what it does on inner pages). Export a `PupStop` component (renders the original `pup-stop` + `pup-buddy` markup for a pose/facing/act/behind/lane) for page owners to use, and tell the parent its props in your final report.
>
> Match the original pixel for pixel at 1440x900 and 390x844 (compare against https://puppy.instabizweb.com in your own browser tabs; open a new tab and setViewportSize before goto). Verify: header hide/show on scroll, mobile menu open/close, curtain on load and on internal navigation, smooth scroll feel, mascot walking/prints on the home page (home markup is currently the static _gen/StaticHomeMain.tsx which already contains the original pup-stop markup), reduced motion. Keep `npx tsc --noEmit -p .` clean for your files. Close your browser tabs when done.
> Final report: files created, what matches, anything that does not match yet, and the PupStop/Teddy API.

### Admin panel + backend
> You are the ADMIN worker for the TeddyPups clone at /Users/jainam/codes/teddypups-clone. Read BUILD-NOTES.md first and follow it (ownership, rules, dev server already running on :3077, do not start/stop servers, no git commits, no new npm dependencies).
>
> Build the backend admin panel at /admin (files: app/admin/**, app/api/**, components/admin/**, lib/admin/**, app/styles/admin.css, app/sitemap.ts, app/robots.ts, proxy/middleware). It must NOT import app/styles/site.css; give it its own clean, warm design consistent with the brand (milk/cocoa/toffee/honey palette, Figtree body + Fraunces headings via the font CSS variables already on <html>), responsive down to mobile.
> Requirements:
> 1. Auth: login page (email + password), scrypt password hashes in `admin_users`, httpOnly session cookie in `admin_sessions` (14 days), logout. First admin created from env ADMIN_EMAIL/ADMIN_PASSWORD on first run; if unset, create admin@teddypups.local with a random password printed once to the server console AND written to data/ADMIN_CREDENTIALS.txt (gitignored via data/*.txt; tell the parent so it can add the ignore rule). Protect every /admin page and every mutating action/API route.
> 2. Dashboard: counts (available, gone home, enquiries new), recent enquiries.
> 3. Puppies: list with search, status filter (available / reserved / home = gone home), publish toggle, drag or up/down reorder; create/edit form with all fields (name, displayName, breed text, gender + label, age, colour, description, records list, status, featured, origin, breeds multi, collections multi, SEO description, slug auto from name with uniqueness), media manager (upload multiple images/videos, reorder, set cover, alt/caption/focal point picker, delete). Marking a puppy "home" moves it from /puppies to /gone-home automatically (the public pages read status).
> 4. Media upload pipeline: convert images to WebP IN THE BROWSER (canvas/OffscreenCanvas convertToBlob type image/webp quality 0.82) producing <id>.webp (max 1920 wide) and <id>-640.webp, plus a tiny blurDataUrl (16px wide webp data URL), width/height, dominant colour; upload via a protected route/server action that writes into public/media and inserts the `media` row (id via shortId()). Videos: store mp4 as is, generate a WebP poster frame in the browser. Reject non-image/video files; size limit 25MB.
> 5. Happy families photos: upload, caption, show-on-home toggle, reorder, delete. Testimonials CRUD. FAQs CRUD + reorder. Breeds / origins / collections CRUD.
> 6. Page sections editor: list sections grouped by page (from the `sections` table; other workers add rows via data/seed/sections/*.json), edit heading/body and the `data` JSON with a friendly editor (key/value fields and lists of items; fall back to a JSON textarea with validation), and media pick from the media library.
> 7. Settings editor (all fields in lib/types Settings incl. socials list and SEO).
> 8. Enquiries inbox: list with filters (new/read/archived), detail view with puppy link, mark read/archive, quick WhatsApp reply link (wa.me/<phone digits>), CSV export.
> 9. Media library page: grid of all media with usage info, upload, edit alt/caption/focal, delete when unused.
> 10. After every mutation call revalidatePath for the affected public pages (pages are force-dynamic now, but keep it correct).
> 11. app/sitemap.ts (all public pages + every published puppy with image entries) and app/robots.ts (disallow /admin and /api) using SITE_URL env or http://localhost:3077.
> Put DB write helpers in lib/admin/*.ts using getDb() from lib/db.ts (do not edit lib/db.ts; ask the parent if you need a schema change). Test every flow in the browser on http://localhost:3077/admin (create a test puppy with an uploaded image, verify it shows on /puppies and its WebP files exist, then delete it; edit a FAQ and revert). Keep `npx tsc --noEmit -p .` clean for your files. Close your browser tabs when done.
> Final report: routes, features, test results, credentials file location, anything the parent must do (e.g. .gitignore entries).

### Home page
> You are the HOME worker for the TeddyPups clone at /Users/jainam/codes/teddypups-clone. Read BUILD-NOTES.md first and follow it (ownership, rules, dev server already running on :3077, do not start/stop servers, no git commits).
>
> Replace the static `_gen/StaticHomeMain.tsx` with a real, data-driven home page in `app/(site)/page.tsx` + `components/home/**`, pixel-perfect against https://puppy.instabizweb.com/ at 1440x900 and 390x844, with every animation and scroll effect:
> - Hero (copy from sections; HeroLineup arches fed by available puppies, mobile name tag behaviour, quilt edge, sun)
> - Meet the pups (Meet component: pinned horizontal scroll with doors that open, Available tags, floor, the treadmill pup-stop, "Meet them all" door; mobile 2-column grid), fed by available puppies (`friends` prop in the original = available puppies with id, slug, displayName, breed, cover, age/gender meta).
> - Two ways (signpost, shopfront photo with skyline, flight route Korea to Dubai with plane), Your puppy journey (PupJourney + Chat phone with per-step messages, video bubble, typing dots, route to house; data from sections/home.json `journey` incl. its media), Why families trust (passport book with stamps), Happy families (photo wall with polaroids from listHappyPhotos({homeOnly:true}), testimonial from listTestimonials(), opens the photo viewer dialog with all 64 photos), Questions answered (first 3 FAQs from listFaqs()), Ready to meet (Dusk: house facade, lamp, door opening, welcome home photo, bowing pup).
> - The day-to-night colour progression and every [data-reveal] / scroll-linked effect.
> Port the client components from `_reference/js/1wa3jfz4v5w2v.js` (HeroLineup, Meet, PupJourney, Chat, Dusk) and the photo viewer from `_reference/js/37w5q0adtoy9q.js` into readable TSX. Keep the original `pup-stop` / `pup-buddy` markup where it appears (the SHELL worker is building `components/pup/PupBuddy.tsx` + `PupStop`; until it exists keep the html2jsx output for those stops; if PupStop exists when you finish, use it). Every heading/body/CTA must come from getSection('home', key, fallback) with the original copy seeded in data/seed/sections/home.json (keep the existing meet/journey/families entries; add hero, ways, trust, faq, dusk, etc.), then run `node scripts/seed.ts --sections`. Static decorative SVGs stay inline. Images via components/ui/TpImage.tsx or next/image with local /media/<id>.webp.
> Verify section by section with screenshots of the original and the clone side by side at both sizes, including scroll states of the pinned doors and the chat steps. Keep `npx tsc --noEmit -p .` clean for your files. Delete `_gen/StaticHomeMain.tsx` when replaced. Close your browser tabs when done.
> Final report: files, what matches, what differs, sections keys added.

### Puppies, puppy detail, gone home
> You are the PUPPIES worker for the TeddyPups clone at /Users/jainam/codes/teddypups-clone. Read BUILD-NOTES.md first and follow it (ownership, rules, dev server already running on :3077, do not start/stop servers, no git commits).
>
> Build, pixel-perfect against https://puppy.instabizweb.com at 1440x900 and 390x844, with all animations:
> 1. `/puppies` (app/(site)/puppies/page.tsx + components/puppies/**): sketchbook header (kicker, h1 with drawn underline, lede, self-portrait Teddy circle), PuppyBrowser port from `_reference/js/05_bi2sw5g1xo.js` (filters where/breed/boy-or-girl from DB breeds/origins/collections, only showing options that have available puppies like the original, single select per row, toggle off, Clear filters, URL params ?origin= ?breed= ?gender= ?collection= exactly like the original, live count text, sketch cards with wash colours, masks, doodles, Available sticker, video badge, tilt/delay vars, reveal), the "Already gone home" strip (first 5 gone-home puppies). Data: listPuppies({status:'available'}) and listPuppies({status:'home'}).
> 2. `/puppies/[slug]` (generateMetadata with title "<Name>, <Breed> puppy" + description like the original, BreadcrumbList JSON-LD, notFound for unknown/unpublished): StoryRibbon, chapters 1 to 4 with handwritten titles, PuppyGallery (stacked frame, prev/next, counter, thumbnails, video playback with poster, photo viewer dialog) from `_reference/js/2nuczo_oug6l2.js`, info card (status pill, name, breed, Breed/Boy or girl/Age/Where grid, Ask about <name> on WhatsApp with the original prefilled text, Send an enquiry scroll), "Every Teddy Pup comes" list, the way home steps (imported vs local variants; check both on the original, e.g. maltipoo-mia-girl is local), EnquiryForm (port; uses `sendEnquiry` from lib/actions.ts with source="puppy" and puppyId; success/error states like the original; message prefilled "Hi! I'd love to know more about <Name> (<Breed>)."), previous/next pup cards, gone-home variant ("the day they went home" etc.; compare pomeranian-ace-boy). Use the original's ordering for prev/next.
> 3. `/gone-home`: header with booth + peeking Teddy, tickets grid for all gone-home puppies (tilt, route text TEDDYPUPS vs DUBAI SHOWROOM for local origin), linking to their pages.
> Copy (headings, ledes, button labels, chapter titles, promise list, way-home steps) must be editable: getSection('puppies'|'puppy'|'gone-home', key, fallback) with seeds in data/seed/sections/{puppies,puppy,gone-home}.json, then `node scripts/seed.ts --sections`. Keep the original pup-stop/pup-buddy markup where present (SHELL worker builds components/pup/PupStop; use it if it exists when you finish). Test the enquiry form locally (submit a test enquiry, confirm the row in data/teddypups.db with `node -e` + node:sqlite, then delete that test row). Never submit forms on the original site. Verify every filter combination and URL state, gallery, viewer, mobile layouts. Keep `npx tsc --noEmit -p .` clean for your files. Close your browser tabs when done.
> Final report: files, what matches, what differs, section keys added.

### Happy families, How it works, FAQ, Contact
> You are the PAGES worker for the TeddyPups clone at /Users/jainam/codes/teddypups-clone. Read BUILD-NOTES.md first and follow it (ownership, rules, dev server already running on :3077, do not start/stop servers, no git commits).
>
> Build these pages pixel-perfect against https://puppy.instabizweb.com at 1440x900 and 390x844, with all animations and interactions:
> 1. `/happy-families`: header, taped testimonial note (listTestimonials()), "N moments and counting", MemoryWall photo wall of all 64 photos (listHappyPhotos(); polaroids with tilt, tape/paw pins, reveal) + photo viewer dialog (counter, close, previous/next, keyboard, backdrop click) ported from `_reference/js/37w5q0adtoy9q.js`, closing line.
> 2. `/how-it-works`: header + 4 chapter chips (anchor links, smooth scroll), Journeys switch (In Dubai / Imported) with both journey contents from data/seed/journeys.json (move into a section row e.g. getSection('how-it-works','journeys') with data.journeys), Downtown Dubai postcard/sun and imported variant, step cards, puppy passport stamps (stamp animation), Delivery & collection (#delivery) with Flight (plane over skyline Korea to Dubai, sun set), Why choose us cards and CTAs. Port from `_reference/js/3gnj9-_12x8lt.js` and `0te0tivnjcmcm.js`.
> 3. `/faq`: corkboard NoticeBoard from `_reference/js/0l31q30pdlxu0.js`: search input with live filtering and "N notes on the board / N notes found" text, auto-expanding matches, accordion notes with pins/tilts, empty state note, reading Teddy, "Ask your own question" WhatsApp; FAQPage JSON-LD like the original. Data: listFaqs().
> 4. `/contact`: LetterForm from `_reference/js/1cuytp2cyhxp8.js` (inline blanks sized by --size, puppy select listing available puppies "Name (Breed, boy)" like the original, message, honeypot, "Post my letter", the full envelope/posting/sent animation sequence and error states) using `sendEnquiry` from lib/actions.ts with source="contact"; contact details from getSettings() (WhatsApp button, call us, email, visit card with awning, Open in Google Maps link).
> Each page: generateMetadata title/description like the original. All copy editable via getSection('<page>', key, fallback) with seeds in data/seed/sections/{happy-families,how-it-works,faq,contact}.json, then `node scripts/seed.ts --sections`. Keep original pup-stop/pup-buddy markup where present (SHELL worker builds components/pup/PupStop; use it if it exists when you finish). Test the contact form locally (submit, confirm the enquiries row with node + node:sqlite, then delete the test row). Never submit forms on the original site. Keep `npx tsc --noEmit -p .` clean for your files. Close your browser tabs when done.
> Final report: files, what matches, what differs, section keys added.
