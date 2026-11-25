"use client";
import { useState } from "react";
import { IconTrash, IconPlus, IconUp, IconDown } from "./Icons";

const human = (k: string) => k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ").replace(/^./, (c) => c.toUpperCase());

/** Empty value with the same shape (used when adding list items). */
function blank(v: any): any {
  if (Array.isArray(v)) return [];
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)]));
  if (typeof v === "number") return 0;
  if (typeof v === "boolean") return false;
  return "";
}

function Value({ value, onChange, name }: { value: any; onChange: (v: any) => void; name: string }) {
  if (typeof value === "boolean") return <label className="adm-switch"><input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />{value ? "On" : "Off"}</label>;
  if (typeof value === "number") return <input className="adm-input" type="number" value={value} onChange={(e) => onChange(e.target.value === "" ? 0 : +e.target.value)} />;
  if (value === null || value === undefined || typeof value === "string") {
    const s = value ?? "";
    return s.length > 70 || s.includes("\n") || /body|text|answer|description|note|quote/i.test(name)
      ? <textarea className="adm-textarea" style={{ minHeight: 70 }} value={s} onChange={(e) => onChange(e.target.value)} />
      : <input className="adm-input" value={s} onChange={(e) => onChange(e.target.value)} />;
  }
  if (Array.isArray(value)) return <ListEditor value={value} onChange={onChange} name={name} />;
  return <ObjectEditor value={value} onChange={onChange} />;
}

function ListEditor({ value, onChange, name }: { value: any[]; onChange: (v: any[]) => void; name: string }) {
  const tmpl = value[0];
  const mv = (i: number, d: number) => { const n = [...value]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  return (
    <div className="adm-stack" style={{ gap: 8 }}>
      {value.map((item, i) => (
        <div key={i} className="adm-item" style={{ padding: 10 }}>
          <span className="adm-badge" style={{ flex: "none" }}>{i + 1}</span>
          <div className="adm-item-body"><Value value={item} name={name} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} /></div>
          <div className="adm-item-actions" style={{ flexDirection: "column" }}>
            <button type="button" className="adm-icon-btn" onClick={() => mv(i, -1)} disabled={i === 0} aria-label="Move up"><IconUp /></button>
            <button type="button" className="adm-icon-btn" onClick={() => mv(i, 1)} disabled={i === value.length - 1} aria-label="Move down"><IconDown /></button>
            <button type="button" className="adm-icon-btn" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove"><IconTrash /></button>
          </div>
        </div>
      ))}
      <div><button type="button" className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => onChange([...value, tmpl !== undefined ? blank(tmpl) : ""])}><IconPlus width={14} />Add item</button></div>
    </div>
  );
}

export function ObjectEditor({ value, onChange, hide = [] }: { value: Record<string, any>; onChange: (v: Record<string, any>) => void; hide?: string[] }) {
  const [newKey, setNewKey] = useState("");
  return (
    <div className="adm-stack" style={{ gap: 12 }}>
      {Object.entries(value).filter(([k]) => !hide.includes(k)).map(([k, v]) => (
        <div key={k} className="adm-field">
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {human(k)} <small style={{ fontFamily: "ui-monospace, monospace" }}>{k}</small>
            <button type="button" className="adm-link adm-small" style={{ marginLeft: "auto", fontWeight: 600 }} onClick={() => { if (confirm(`Remove “${k}”?`)) { const n = { ...value }; delete n[k]; onChange(n); } }}>remove</button>
          </label>
          <Value value={v} name={k} onChange={(nv) => onChange({ ...value, [k]: nv })} />
        </div>
      ))}
      <div className="adm-row">
        <input className="adm-input" style={{ maxWidth: 200, minHeight: 34 }} placeholder="newFieldName" value={newKey} onChange={(e) => setNewKey(e.target.value.replace(/[^A-Za-z0-9_]/g, ""))} />
        <button type="button" className="adm-btn adm-btn-ghost adm-btn-sm" disabled={!newKey || newKey in value} onClick={() => { onChange({ ...value, [newKey]: "" }); setNewKey(""); }}>Add text field</button>
        <button type="button" className="adm-btn adm-btn-ghost adm-btn-sm" disabled={!newKey || newKey in value} onClick={() => { onChange({ ...value, [newKey]: [] }); setNewKey(""); }}>Add list</button>
      </div>
    </div>
  );
}

/** Friendly editor with a validated raw-JSON fallback. */
export default function DataEditor({ value, onChange, hide }: { value: Record<string, any>; onChange: (v: Record<string, any>) => void; hide?: string[] }) {
  const [raw, setRaw] = useState(false);
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="adm-stack">
      <div className="adm-seg">
        <button type="button" data-on={!raw} onClick={() => { if (raw && err) return; setRaw(false); }}>Fields</button>
        <button type="button" data-on={raw} onClick={() => { setText(JSON.stringify(value, null, 2)); setErr(null); setRaw(true); }}>JSON</button>
      </div>
      {raw ? (
        <>
          <textarea className="adm-textarea mono" value={text} aria-invalid={!!err} onChange={(e) => {
            setText(e.target.value);
            try { const v = JSON.parse(e.target.value); if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("Must be a JSON object { … }"); setErr(null); onChange(v); }
            catch (x: any) { setErr(x.message); }
          }} />
          {err ? <div className="adm-alert">{err}</div> : <p className="adm-hint">Valid JSON. Changes apply when you save.</p>}
        </>
      ) : <ObjectEditor value={value} onChange={onChange} hide={hide} />}
    </div>
  );
}
