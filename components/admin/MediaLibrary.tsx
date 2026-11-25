"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Media } from "@/lib/types";
import { deleteMediaAction } from "@/lib/admin/actions";
import DropZone from "./DropZone";
import MediaEditModal from "./MediaEditModal";
import { thumbUrl } from "./upload";
import { toast } from "./Toaster";

type Usage = { type: string; label: string; href: string };
type Item = Media & { createdAt: string; usage: Usage[] };

export default function MediaLibrary({ media }: { media: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState(media);
  const [filter, setFilter] = useState<"all" | "image" | "video" | "unused">("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Item | null>(null);
  const [editing, setEditing] = useState<Media | null>(null);
  const [pending, start] = useTransition();
  useEffect(() => setItems(media), [media]);
  const posterIds = useMemo(() => new Set(items.map((m) => m.poster?.id).filter(Boolean)), [items]);
  const list = items.filter((m) => !posterIds.has(m.id) && (filter === "all" || (filter === "unused" ? m.usage.length === 0 : m.kind === filter)) && (!q || `${m.alt} ${m.caption} ${m.id}`.toLowerCase().includes(q.toLowerCase())));
  const del = (m: Item) => {
    if (!confirm("Delete this file for good?")) return;
    start(async () => {
      const r = await deleteMediaAction(m.id);
      if (!r.ok) { toast(r.error || "Can't delete", "error"); return; }
      setItems((x) => x.filter((y) => y.id !== m.id));
      setSel(null);
      toast("File deleted");
    });
  };
  return (
    <div className="adm-split">
      <section className="adm-card adm-stack">
        <DropZone onUploaded={(m) => { setItems((x) => [...m.map((y) => ({ ...y, createdAt: new Date().toISOString(), usage: [] })), ...x]); router.refresh(); }} />
        <div className="adm-row">
          <div className="adm-seg">
            {(["all", "image", "video", "unused"] as const).map((f) => <button key={f} data-on={filter === f} onClick={() => setFilter(f)}>{f === "all" ? "All" : f === "image" ? "Photos" : f === "video" ? "Videos" : "Unused"}</button>)}
          </div>
          <span className="adm-spacer" />
          <input className="adm-input" style={{ width: 220 }} placeholder="Search alt, caption, id" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <p className="adm-hint">{list.length} file{list.length === 1 ? "" : "s"}</p>
        <div className="adm-media-grid">
          {list.map((m) => (
            <div key={m.id}>
              <button type="button" className="adm-thumb" data-selected={sel?.id === m.id || undefined} onClick={() => setSel(m)} title={m.alt || m.id}>
                <img src={thumbUrl(m)} alt={m.alt} loading="lazy" style={{ objectPosition: `${m.focalX * 100}% ${m.focalY * 100}%` }} />
                <span className="adm-thumb-tag">{m.kind === "video" && <span>▶ video</span>}{m.usage.length === 0 && <span className="cover">unused</span>}</span>
              </button>
              <div className="adm-thumb-cap">{m.caption || m.alt || m.id}</div>
            </div>
          ))}
        </div>
      </section>
      <aside className="adm-card adm-stack" style={{ position: "sticky", top: 20 }}>
        {!sel ? <div className="adm-empty"><b>Pick a file</b>Click any photo to see where it's used and edit it.</div> : (
          <>
            {sel.kind === "video" ? <video src={sel.url} poster={sel.poster?.url} controls muted playsInline style={{ width: "100%", borderRadius: 12, background: "#000" }} />
              : <img src={sel.url.replace(/\.webp$/, "-640.webp")} alt={sel.alt} style={{ width: "100%", borderRadius: 12, display: "block" }} />}
            <dl className="adm-dl adm-small">
              <dt>File</dt><dd><a className="adm-link" href={sel.url} target="_blank" rel="noreferrer">{sel.url}</a></dd>
              <dt>Size</dt><dd>{sel.width} × {sel.height}</dd>
              <dt>Alt</dt><dd>{sel.alt || <span className="adm-muted">-</span>}</dd>
              <dt>Caption</dt><dd>{sel.caption || <span className="adm-muted">-</span>}</dd>
              <dt>Used by</dt>
              <dd>{sel.usage.length ? sel.usage.map((u, i) => <div key={i}>{u.href ? <Link className="adm-link" href={u.href}>{u.label}</Link> : u.label}</div>) : <span className="adm-muted">Nothing (safe to delete)</span>}</dd>
            </dl>
            <div className="adm-row">
              <button className="adm-btn adm-btn-sm" onClick={() => setEditing(sel)}>Edit alt & focus</button>
              <button className="adm-btn adm-btn-danger adm-btn-sm" disabled={pending || sel.usage.length > 0} title={sel.usage.length ? "In use, remove it from those places first" : ""} onClick={() => del(sel)}>Delete</button>
            </div>
          </>
        )}
      </aside>
      <MediaEditModal media={editing} onClose={() => setEditing(null)} onSaved={(m) => { setItems((x) => x.map((y) => (y.id === m.id ? { ...y, ...m } : y))); setSel((s) => (s && s.id === m.id ? { ...s, ...m } : s)); }} />
    </div>
  );
}
