// Convert React-SSR HTML (from _reference/html/*.html) into JSX source.
// Usage:  node scripts/html2jsx.mjs _reference/html/home.html [startMarker] [endMarker] > out.jsx
//   or    import { html2jsx } from "./html2jsx.mjs"
import fs from "node:fs";

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const ATTR_MAP = {
  class: "className", for: "htmlFor", tabindex: "tabIndex", readonly: "readOnly", maxlength: "maxLength", minlength: "minLength",
  autocomplete: "autoComplete", autofocus: "autoFocus", inputmode: "inputMode", srcset: "srcSet", crossorigin: "crossOrigin",
  fetchpriority: "fetchPriority", "xlink:href": "xlinkHref", "xml:space": "xmlSpace", enterkeyhint: "enterKeyHint",
  playsinline: "playsInline", novalidate: "noValidate", spellcheck: "spellCheck", colspan: "colSpan", rowspan: "rowSpan",
  datetime: "dateTime", frameborder: "frameBorder", allowfullscreen: "allowFullScreen", contenteditable: "contentEditable",
};
const BOOL = new Set(["hidden", "disabled", "required", "checked", "selected", "readOnly", "autoFocus", "multiple", "muted", "loop", "autoPlay", "playsInline", "noValidate", "controls", "open", "async", "defer", "allowFullScreen", "noModule", "inert"]);
const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

function decode(s) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&#160;|&nbsp;/g, "\u00a0");
}

function styleToObj(style) {
  const out = [];
  for (const decl of style.split(/;(?![^(]*\))/)) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const k = decl.slice(0, i).trim();
    const v = decl.slice(i + 1).trim();
    if (!k) continue;
    const key = k.startsWith("--") ? JSON.stringify(k) : /^-ms-/.test(k) ? camel(k.slice(1)) : /^-webkit-/.test(k) ? "Webkit" + camel(k.slice(7)).replace(/^./, (c) => c.toUpperCase()).slice(0) : camel(k);
    out.push(`${key.startsWith("Webkit") ? key.replace(/^Webkit(.)/, (m, c) => "Webkit" + c.toUpperCase()) : key}: ${JSON.stringify(decode(v))}`);
  }
  return `{{ ${out.join(", ")} }}`;
}

function attrName(n) {
  if (n.startsWith("data-") || n.startsWith("aria-")) return n;
  if (ATTR_MAP[n]) return ATTR_MAP[n];
  if (n.includes("-") || n.includes(":")) return camel(n.replace(":", "-"));
  return n;
}

function textToJsx(t) {
  if (!t) return "";
  const d = decode(t);
  if (/[{}<>]/.test(d)) return `{${JSON.stringify(d)}}`;
  return d;
}

/** Original optimizer URL or /media/<id>/<hash>/<file> -> local /media/<id>.webp (or .mp4), /brand/logo.png -> /brand/logo.webp */
export function localSrc(src) {
  let u = src;
  const opt = /^\/_next\/image\?url=([^&]+)/.exec(u);
  if (opt) u = decodeURIComponent(opt[1]);
  const m = /^\/media\/([^/]+)\/[^/]+\/[^?]+?\.(\w+)$/.exec(u);
  if (m) return /^(mp4|mov|webm)$/i.test(m[2]) ? `/media/${m[1]}.mp4` : `/media/${m[1]}.webp`;
  if (u === "/brand/logo.png") return "/brand/logo.webp";
  return u;
}

export function html2jsx(html, indent = "") {
  html = html.replace(/<!--[\s\S]*?-->/g, "");
  // Local media: drop original srcset/sizes, point src/poster/href at local webp/mp4 files.
  html = html.replace(/\s(?:srcSet|srcset|imageSrcSet|sizes)="[^"]*"/g, "").replace(/\s(src|poster|href)="([^"]*)"/g, (all, a, v) => ` ${a}="${localSrc(v.replace(/&amp;/g, "&")).replace(/&/g, "&amp;")}"`);
  let out = "";
  let i = 0;
  let depth = 0;
  const pad = () => "\n" + indent + "  ".repeat(depth);
  while (i < html.length) {
    if (html[i] === "<") {
      if (html[i + 1] === "/") {
        const end = html.indexOf(">", i);
        const tag = html.slice(i + 2, end).trim();
        depth--;
        out += `</${tag}>`;
        i = end + 1;
        continue;
      }
      const m = /^<([a-zA-Z][\w:-]*)/.exec(html.slice(i));
      const tag = m[1];
      let j = i + m[0].length;
      const attrs = [];
      while (j < html.length) {
        while (/\s/.test(html[j])) j++;
        if (html[j] === ">" || (html[j] === "/" && html[j + 1] === ">")) break;
        const am = /^([^\s=>\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/.exec(html.slice(j));
        const name = am[1];
        const val = am[2] ?? am[3] ?? am[4];
        j += am[0].length;
        const jn = attrName(name);
        if (name === "style" && val != null) attrs.push(`style=${styleToObj(val)}`);
        else if (val === undefined || (val === "" && BOOL.has(jn))) attrs.push(jn);
        else attrs.push(`${jn}=${JSON.stringify(decode(val))}`);
      }
      const selfClose = html[j] === "/";
      j = html.indexOf(">", j) + 1;
      const isVoid = VOID.has(tag.toLowerCase());
      out += pad() + `<${tag}${attrs.length ? " " + attrs.join(" ") : ""}${selfClose || isVoid ? " />" : ">"}`;
      if (!(selfClose || isVoid)) depth++;
      if (isVoid && html.slice(j).startsWith(`</${tag}>`)) j += tag.length + 3;
      i = j;
    } else {
      const next = html.indexOf("<", i);
      const t = html.slice(i, next < 0 ? html.length : next);
      if (t.trim()) out += textToJsx(t);
      else if (t.length && /\S/.test(t) === false && t.includes(" ") && !t.includes("\n")) out += "{\" \"}";
      i = next < 0 ? html.length : next;
    }
  }
  return out.replace(/>\n\s*<\//g, "></");
}

if (process.argv[1] && process.argv[1].endsWith("html2jsx.mjs")) {
  const [, , file, start, end] = process.argv;
  let h = fs.readFileSync(file, "utf8");
  if (start) { const a = h.indexOf(start); if (a < 0) throw new Error("start marker not found"); h = h.slice(a); }
  if (end) { const b = h.indexOf(end); if (b < 0) throw new Error("end marker not found"); h = h.slice(0, b); }
  process.stdout.write(html2jsx(h));
}
