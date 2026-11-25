"use client";
import { useState, useTransition } from "react";
import type { Settings } from "@/lib/types";
import { saveSettingsAction } from "@/lib/admin/actions";
import { toast } from "./Toaster";
import { IconTrash, IconPlus, IconUp, IconDown } from "./Icons";

export default function SettingsForm({ settings }: { settings: Settings }) {
  const [s, setS] = useState<Settings>({ ...settings, socials: settings.socials ?? [], seo: settings.seo ?? { title: "", description: "", ogImage: "" } });
  const [saved, setSaved] = useState(JSON.stringify(s));
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof Settings, v: any) => setS((x) => ({ ...x, [k]: v }));
  const dirty = JSON.stringify(s) !== saved;
  const field = (k: keyof Settings, label: string, hint?: string, textarea = false) => (
    <div className="adm-field">
      <label>{label}{hint && <small> ({hint})</small>}</label>
      {textarea ? <textarea className="adm-textarea" style={{ minHeight: 80 }} value={(s[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} />
        : <input className="adm-input" value={(s[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} />}
    </div>
  );
  const save = () => start(async () => {
    setErr(null);
    const res = await saveSettingsAction(s);
    if (!res.ok) { setErr(res.error || "Couldn't save"); toast(res.error || "Couldn't save", "error"); return; }
    setSaved(JSON.stringify(s));
    toast("Settings saved");
  });
  const wa = `https://wa.me/${s.whatsappNumber}?text=${encodeURIComponent(s.whatsappMessage || "")}`;
  return (
    <div className="adm-stack" style={{ gap: 18 }}>
      <section className="adm-card adm-stack">
        <h2>Brand</h2>
        <div className="adm-grid adm-grid-3">{field("siteName", "Site name")}{field("shortName", "Short name")}{field("tagline", "Tagline", "handwritten line")}</div>
        <div className="adm-grid adm-grid-2">{field("footerHeading", "Footer heading")}{field("footerBlurb", "Footer text", undefined, true)}</div>
      </section>
      <section className="adm-card adm-stack">
        <h2>Contact</h2>
        <div className="adm-grid adm-grid-2">
          {field("whatsappNumber", "WhatsApp number", "digits with country code, no +")}
          {field("whatsappMessage", "WhatsApp opening message")}
          {field("phoneDisplay", "Phone (as shown)")}
          {field("phoneTel", "Phone (for tel: links)", "e.g. +971500000000")}
          {field("email", "Email")}
          {field("address", "Address")}
          {field("mapsUrl", "Google Maps link", "optional")}
        </div>
        <p className="adm-hint">Test the WhatsApp link: <a className="adm-link" href={wa} target="_blank" rel="noreferrer">{wa.length > 80 ? wa.slice(0, 80) + "…" : wa}</a></p>
      </section>
      <section className="adm-card adm-stack">
        <div className="adm-card-head" style={{ marginBottom: 0 }}><h2>Social links</h2><button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => set("socials", [...s.socials, { label: "", href: "" }])}><IconPlus width={14} />Add link</button></div>
        {s.socials.map((so, i) => (
          <div key={i} className="adm-row" style={{ flexWrap: "nowrap" }}>
            <input className="adm-input" style={{ maxWidth: 180 }} placeholder="Label" value={so.label} onChange={(e) => set("socials", s.socials.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <input className="adm-input" placeholder="https://…" value={so.href} onChange={(e) => set("socials", s.socials.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)))} />
            <button className="adm-icon-btn" disabled={i === 0} onClick={() => { const n = [...s.socials]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set("socials", n); }} aria-label="Move up"><IconUp /></button>
            <button className="adm-icon-btn" disabled={i === s.socials.length - 1} onClick={() => { const n = [...s.socials]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; set("socials", n); }} aria-label="Move down"><IconDown /></button>
            <button className="adm-icon-btn" onClick={() => set("socials", s.socials.filter((_, j) => j !== i))} aria-label="Remove"><IconTrash /></button>
          </div>
        ))}
      </section>
      <section className="adm-card adm-stack">
        <h2>SEO (home page and defaults)</h2>
        <div className="adm-field"><label>Title <small>({s.seo.title.length}/60)</small></label><input className="adm-input" value={s.seo.title} onChange={(e) => set("seo", { ...s.seo, title: e.target.value })} /></div>
        <div className="adm-field"><label>Description <small>({s.seo.description.length}/160)</small></label><textarea className="adm-textarea" style={{ minHeight: 80 }} value={s.seo.description} onChange={(e) => set("seo", { ...s.seo, description: e.target.value })} /></div>
        <div className="adm-field"><label>Social share image <small>(path or URL)</small></label><input className="adm-input" value={s.seo.ogImage} onChange={(e) => set("seo", { ...s.seo, ogImage: e.target.value })} /></div>
      </section>
      {err && <div className="adm-alert">{err}</div>}
      <div className="adm-savebar">
        {dirty && <span className="adm-dirty">Unsaved changes</span>}
        <button className="adm-btn" disabled={!dirty || pending} onClick={save}>{pending ? "Saving…" : "Save settings"}</button>
      </div>
    </div>
  );
}
