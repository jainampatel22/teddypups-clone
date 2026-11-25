"use client";
import { useEffect, useState, useTransition } from "react";
import { saveTaxonomyAction, deleteTaxonomyAction, reorderAction } from "@/lib/admin/actions";
import { useSortable } from "./useSortable";
import { toast } from "./Toaster";
import { IconGrip, IconUp, IconDown, IconEdit, IconTrash } from "./Icons";

type Row = { slug: string; name: string; count: number };

export default function TaxonomyManager({ table, title, rows: initial, hint }: { table: "breeds" | "origins" | "collections"; title: string; rows: Row[]; hint?: string }) {
  const [rows, setRows] = useState(initial);
  const [edit, setEdit] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  useEffect(() => setRows(initial), [initial]);
  const { itemProps, move } = useSortable(rows, (next) => { setRows(next); start(async () => { await reorderAction(table, next.map((r) => r.slug)); toast("Order saved"); }); });
  const open = (r?: Row) => { setErr(null); setEdit(r ? r.slug : "__new"); setName(r?.name ?? ""); setSlug(r?.slug ?? ""); };
  const save = () => start(async () => {
    const res = await saveTaxonomyAction(table, edit === "__new" ? null : edit, name, slug);
    if (!res.ok) { setErr(res.error || "Couldn't save"); return; }
    toast("Saved"); setEdit(null);
  });
  const form = (
    <div className="adm-fieldset">
      <div className="adm-field"><label>Name</label><input className="adm-input" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></div>
      <div className="adm-field"><label>Slug <small>(URL)</small></label><input className="adm-input" value={slug} placeholder="auto from name" onChange={(e) => setSlug(e.target.value)} /></div>
      {err && <div className="adm-alert">{err}</div>}
      <div className="adm-row"><button className="adm-btn adm-btn-sm" disabled={pending} onClick={save}>Save</button><button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setEdit(null)}>Cancel</button></div>
    </div>
  );
  return (
    <section className="adm-card adm-stack">
      <div className="adm-card-head" style={{ marginBottom: 0 }}><h2>{title}</h2><button className="adm-btn adm-btn-sm" onClick={() => open()}>Add</button></div>
      {hint && <p className="adm-hint">{hint}</p>}
      {edit === "__new" && form}
      <div className="adm-list">
        {rows.map((r, i) => edit === r.slug ? <div key={r.slug}>{form}</div> : (
          <div key={r.slug} className="adm-item" {...itemProps(i)} style={{ alignItems: "center" }}>
            <span className="adm-handle"><IconGrip width={16} /></span>
            <div className="adm-item-body"><b>{r.name}</b> <span className="adm-muted adm-small">/{r.slug} · {r.count} pupp{r.count === 1 ? "y" : "ies"}</span></div>
            <div className="adm-item-actions">
              <button className="adm-icon-btn" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up"><IconUp /></button>
              <button className="adm-icon-btn" onClick={() => move(i, i + 1)} disabled={i === rows.length - 1} aria-label="Move down"><IconDown /></button>
              <button className="adm-icon-btn" onClick={() => open(r)} aria-label="Edit"><IconEdit /></button>
              <button className="adm-icon-btn" aria-label="Delete" onClick={() => { if (confirm(`Delete “${r.name}”?${r.count ? ` It will be removed from ${r.count} pupp${r.count === 1 ? "y" : "ies"}.` : ""}`)) start(async () => { await deleteTaxonomyAction(table, r.slug); setRows((x) => x.filter((y) => y.slug !== r.slug)); toast("Deleted"); }); }}><IconTrash /></button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
