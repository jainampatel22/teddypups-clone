// Generates components/home/sections/*.tsx from the original home HTML.
// Text tokens are swapped for CMS expressions, data subtrees for slot props.
import fs from "node:fs";
import { html2jsx } from "../scripts/html2jsx.mjs";

const H = fs.readFileSync("_reference/html/home.html", "utf8");
const main = H.slice(H.indexOf("<main"), H.indexOf("</main>"));
const sec = (name) => {
  const html = main.replace(/<!--[\s\S]*?-->/g, "");
  const a = html.indexOf(`<div data-section="${name}"`);
  const re = /<(\/?)div(?=[\s>])[^>]*>/g; re.lastIndex = a; let d = 0, m;
  while ((m = re.exec(html))) { d += m[1] ? -1 : 1; if (!d) return html.slice(a, re.lastIndex); }
};

/** Replace the balanced element whose opening tag contains `marker` (and optional following siblings up to an element containing `untilMarker`). */
function replaceEl(html, marker, slot, untilMarker) {
  const mi = html.indexOf(marker);
  if (mi < 0) throw new Error("marker not found: " + marker);
  const start = html.lastIndexOf("<", mi);
  const endOf = (s) => {
    const tag = /^<([a-zA-Z][\w-]*)/.exec(html.slice(s))[1];
    let depth = 0, i = s;
    const re = new RegExp(`<(/?)${tag}(?=[\\s>/])[^>]*?(/?)>`, "g");
    re.lastIndex = s;
    let m;
    while ((m = re.exec(html))) {
      if (m[1]) depth--; else if (!m[2]) depth++;
      if (depth === 0) return re.lastIndex;
    }
    throw new Error("unbalanced " + tag);
  };
  let end = endOf(start);
  if (untilMarker) {
    const ui = html.indexOf(untilMarker, end);
    end = endOf(html.lastIndexOf("<", ui));
  }
  return html.slice(0, start) + `<x-slot data-name="${slot}"></x-slot>` + html.slice(end);
}

function tok(html, text, name, { all = false } = {}) {
  const enc = text.includes("&#x27;") ? text : text.replace(/&/g, "&amp;").replace(/'/g, "&#x27;");
  if (!html.includes(enc)) throw new Error("text not found: " + text);
  return all ? html.split(enc).join(`@@${name}@@`) : html.replace(enc, `@@${name}@@`);
}

function toTsx(html, compName, propsSig) {
  let jsx = html2jsx(html, "    ");
  jsx = jsx.replace(/<x-slot data-name="(\w+)"><\/x-slot>/g, "{slots.$1}");
  jsx = jsx.replace(/style=\{\{ ([^{}]*"--[^{}]*) \}\}/g, "style={{ $1 } as CSSProperties}");
  jsx = jsx.replace(/="@@([\w.]+)@@"/g, "={$1}").replace(/@@([\w.]+)@@/g, "{$1}");
  return `/* Generated from the original markup (_gen/gen-home.mjs), then wired to CMS data. */
import type { CSSProperties, ReactNode } from "react";

export default function ${compName}(${propsSig}) {
  return (<>${jsx}
  </>);
}
`;
}

const WA = "https://wa.me/919898124987?text=Hi%20Insta%20Biz%20Web%2C%20I&#x27;d%20like%20to%20discuss%20a%20project.";
const out = "components/home/sections";
fs.mkdirSync(out, { recursive: true });
const sig = "{ t, slots }: { t: Record<string, any>; slots: Record<string, ReactNode> }";

// HERO
let h = sec("hero");
h = replaceEl(h, 'class="tp-lineup"', "lineup", 'class="tp-lineup__wings"');
h = tok(h, ">every puppy is family<", "t.note").replace("@@t.note@@", ">@@t.note@@<");
h = tok(h, "Premium teacup", "t.line1");
h = tok(h, "puppies in Dubai", "t.line2");
h = tok(h, "Meet your new best friend in our Dubai showroom, or order a rare miniature breed from trusted breeders worldwide.", "t.body");
h = tok(h, 'href="/puppies">View available puppies', "t.cta1").replace("@@t.cta1@@", 'href="@@t.ctaHref@@">@@t.ctaLabel@@');
h = tok(h, WA, "t.whatsappHref");
h = tok(h, "Enquire on WhatsApp", "t.cta2Label");
fs.writeFileSync(`${out}/HeroSection.tsx`, toTsx(h, "HeroSection", sig));

// PATHS
let p = sec("paths");
p = tok(p, "Two ways to meet your puppy", "t.heading");
fs.writeFileSync(`${out}/PathsSection.tsx`, toTsx(p, "PathsSection", sig));

// TRUST
let tr = sec("trust");
tr = tok(tr, ">puppy passport<", "t.kicker").replace("@@t.kicker@@", ">@@t.kicker@@<");
tr = tok(tr, "Why families trust TeddyPups", "t.heading");
fs.writeFileSync(`${out}/TrustSection.tsx`, toTsx(tr, "TrustSection", sig));

// QUESTIONS
let q = sec("questions");
q = replaceEl(q, 'class="tp-night__list"', "faqs");
q = tok(q, "Questions, answered", "t.heading");
q = tok(q, 'href="/faq">Read all questions', "t.cta").replace("@@t.cta@@", 'href="@@t.ctaHref@@">@@t.ctaLabel@@');
fs.writeFileSync(`${out}/QuestionsSection.tsx`, toTsx(q, "QuestionsSection", sig));
// one FAQ dt icon svg for the list
const qsvg = /<dt class="font-plush tp-qa__q">(<svg[\s\S]*?<\/svg>)/.exec(sec("questions"))[1];
fs.writeFileSync(`${out}/QaSpark.tsx`, `export default function QaSpark() {\n  return (<>${html2jsx(qsvg, "    ")}\n  </>);\n}\n`);

// CTA (house)
let c = sec("cta");
c = tok(c, "Ready to meet your new best friend?", "t.heading");
c = tok(c, "Bring home a healthy, happy teacup or designer puppy with expert guidance every step of the way. We help you find the right match and ensure a smooth, safe delivery across the UAE.", "t.body");
c = tok(c, WA, "t.whatsappHref", { all: true });
fs.writeFileSync(`${out}/CtaSection.tsx`, toTsx(c, "CtaSection", sig));

// Mascot stops used inside client sections (meet, journey, families) + door peephole paw
const stops = {};
for (const [name, cls] of [["MeetTeddy", "tp-meet__teddy"], ["ChatTeddy", "tp-chat__teddy"], ["DuskTeddy", "tp-dusk__teddy"]]) {
  const all = main;
  const i = all.indexOf(`pup-stop ${cls}`);
  const s0 = all.lastIndexOf("<div", i);
  let depth = 0, j = s0;
  const re = /<(\/?)div(?=[\s>])[^>]*>/g; re.lastIndex = s0; let m;
  while ((m = re.exec(all))) { depth += m[1] ? -1 : 1; if (!depth) { j = re.lastIndex; break; } }
  stops[name] = html2jsx(all.slice(s0, j), "    ");
}
const meetHtml = sec("meet");
const paw = /<span class="tp-door__leaf">(<svg[\s\S]*?<\/svg>)/.exec(meetHtml)[1];
let stopSrc = `/* Generated mascot stop markup (static SVG poses from the original). The global PupBuddy engine drives these. */\n`;
for (const [n, j] of Object.entries(stops)) stopSrc += `export function ${n}() {\n  return (<>${j}\n  </>);\n}\n\n`;
stopSrc += `export function DoorPaw() {\n  return (<>${html2jsx(paw, "    ")}\n  </>);\n}\n`;
fs.writeFileSync("components/home/stops.tsx", stopSrc);
console.log("ok", fs.readdirSync(out));
