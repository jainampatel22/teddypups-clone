"use client";
import { useEffect, useState, useTransition } from "react";
import { reorderAction } from "@/lib/admin/actions";
import { useSortable } from "./useSortable";
import { toast } from "./Toaster";
import { IconGrip, IconUp, IconDown, IconEdit, IconTrash, IconPlus } from "./Icons";

type Field = { key: string; label: string; type?: "text" | "textarea"; required?: boolean; placeholder?: string };
type Item = { id: string; published: boolean; [k: string]: any };

/** Reorderable list of small records with inline add/edit forms (FAQs, testimonials). */
export default function SortableEditList({ title, intro, table, items, fields, render, onSave, onDelete, addLabel }: {
  title: string; intro?: string; table: "faqs" | "testimonials"; items: Item[]; fields: Field[];
  render: (it: Item) => React.ReactNode;
  onSave: (it: any) => Promise<{ ok: boolean; error?: string }>;
  onDelete: (id: string) => Promise<any>;
  addLabel: string;
}) {
  const [rows, setRows] = useState(items);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>({});
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  useEffect(() => setRows(items), [items]);
  const { itemProps, move } = useSortable(rows, (next) => { setRows(next); start(async () => { await reorderAction(table, next.map((r) => r.id)); toast("Order saved"); }); });
  const open = (it?: Item) => { setErr(null); setEditId(it?.id ?? "new"); setDraft(it ? { ...it } : { published: true, ...Object.fromEntries(fields.map((f) => [f.key, ""])) }); };
  const save = () => start(async () => {
    const res = await onSave({ ...draft, id: editId === "new" ? undefined : editId });
    if (!res.ok) { setErr(res.error || "Couldn't save."); return; }
    toast("Saved");
    setEditId(null);
  });
  const form = (
    <div className="adm-fieldset">
      {fields.map((f) => (
        <div key={f.key} className="adm-field">
          <label>{f.label}</label>
          {f.type === "textarea"
            ? <textarea className="adm-textarea" value={draft[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
            : <input className="adm-input" value={draft[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />}
        </div>
      ))}
      <label className="adm-switch"><input type="checkbox" checked={!!draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />Published</label>
      {err && <div className="adm-alert">{err}</div>}
      <div className="adm-row"><button className="adm-btn adm-btn-sm" onClick={save} disabled={pending}>{pending ? "Saving…" : "Save"}</button><button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setEditId(null)}>Cancel</button></div>
    </div>
  );
  return (
    <section className="adm-card adm-stack">
      <div className="adm-card-head" style={{ marginBottom: 0 }}>
        <div><h2>{title}</h2>{intro && <p>{intro}</p>}</div>
        <button className="adm-btn adm-btn-sm" onClick={() => open()} disabled={editId === "new"}><IconPlus width={14} />{addLabel}</button>
      </div>
      {editId === "new" && form}
      <div className="adm-list">
        {rows.map((it, i) => editId === it.id ? <div key={it.id}>{form}</div> : (
          <div key={it.id} className="adm-item" {...itemProps(i)}>
            <span className="adm-handle"><IconGrip width={16} /></span>
            <div className="adm-item-body">{render(it)}{!it.published && <span className="adm-badge" style={{ marginTop: 6 }}>hidden</span>}</div>
            <div className="adm-item-actions">
              <button className="adm-icon-btn" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up"><IconUp /></button>
              <button className="adm-icon-btn" onClick={() => move(i, i + 1)} disabled={i === rows.length - 1} aria-label="Move down"><IconDown /></button>
              <button className="adm-icon-btn" onClick={() => open(it)} aria-label="Edit"><IconEdit /></button>
              <button className="adm-icon-btn" aria-label="Delete" onClick={() => { if (confirm("Delete this for good?")) start(async () => { await onDelete(it.id); setRows((r) => r.filter((x) => x.id !== it.id)); toast("Deleted"); }); }}><IconTrash /></button>
            </div>
          </div>
        ))}
        {!rows.length && editId !== "new" && <div className="adm-empty"><b>Nothing yet</b></div>}
      </div>
    </section>
  );
}
