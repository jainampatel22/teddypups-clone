"use client";
import { useEffect, useState, useTransition } from "react";
import type { HappyPhoto, Media } from "@/lib/types";
import { addHappyPhotosAction, removeHappyAction, reorderAction, setHappyHomeAction } from "@/lib/admin/actions";
import DropZone from "./DropZone";
import MediaPicker from "./MediaPicker";
import MediaEditModal from "./MediaEditModal";
import { useSortable } from "./useSortable";
import { thumbUrl } from "./upload";
import { toast } from "./Toaster";
import { IconEdit, IconTrash, IconPlus, IconUp, IconDown } from "./Icons";

export default function HappyManager({ photos }: { photos: HappyPhoto[] }) {
  const [rows, setRows] = useState(photos);
  const [, start] = useTransition();
  const [picker, setPicker] = useState(false);
  const [editing, setEditing] = useState<Media | null>(null);
  useEffect(() => setRows(photos), [photos]);
  const { itemProps, move } = useSortable(rows, (next) => {
    setRows(next);
    start(async () => { await reorderAction("happy_photos", next.map((p) => p.id)); toast("Order saved"); });
  });
  const add = (m: Media[]) => {
    const fresh = m.filter((x) => x.kind === "image" && !rows.some((r) => r.id === x.id));
    if (!fresh.length) return;
    setRows((r) => [...r, ...fresh.map((x, i) => ({ ...x, sortOrder: r.length + i, showOnHome: false }))]);
    start(async () => { await addHappyPhotosAction(fresh.map((x) => x.id)); toast(`${fresh.length} photo${fresh.length > 1 ? "s" : ""} added to the wall`); });
  };
  const onHome = rows.filter((r) => r.showOnHome).length;
  return (
    <section className="adm-card adm-stack">
      <div className="adm-card-head" style={{ marginBottom: 0 }}>
        <div><h2>Photo wall <span className="adm-muted" style={{ fontFamily: "var(--a-sans)", fontSize: "0.9rem" }}>{rows.length} photos · {onHome} on home</span></h2><p>Drag to reorder. Click a photo to edit its caption and focal point.</p></div>
        <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setPicker(true)}><IconPlus width={14} />From library</button>
      </div>
      <DropZone onUploaded={add} accept="image/*" label="Drop family photos here, or click to choose" compact />
      <div className="adm-mm adm-mm--wide">
        {rows.map((p, i) => (
          <div key={p.id} className="adm-mm-item" {...itemProps(i)}>
            <button type="button" className="adm-thumb" onClick={() => setEditing(p)}>
              <img src={thumbUrl(p)} alt={p.alt} draggable={false} loading="lazy" style={{ objectPosition: `${p.focalX * 100}% ${p.focalY * 100}%` }} />
              <span className="adm-thumb-tag"><span>{i + 1}</span>{p.showOnHome && <span className="cover">home</span>}</span>
            </button>
            <div className="adm-thumb-cap" title={p.caption}>{p.caption || <span style={{ opacity: 0.5 }}>No caption</span>}</div>
            <div className="adm-mm-tools" style={{ alignItems: "center" }}>
              <label className="adm-switch" title="Show on home page" style={{ fontSize: "0.75rem" }}>
                <input type="checkbox" checked={p.showOnHome} onChange={(e) => { const on = e.target.checked; setRows((r) => r.map((x) => (x.id === p.id ? { ...x, showOnHome: on } : x))); start(async () => { await setHappyHomeAction(p.id, on); toast(on ? "Pinned to home page" : "Removed from home page"); }); }} />Home
              </label>
              <button className="adm-icon-btn" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move earlier"><IconUp style={{ transform: "rotate(-90deg)" }} /></button>
              <button className="adm-icon-btn" onClick={() => move(i, i + 1)} disabled={i === rows.length - 1} aria-label="Move later"><IconDown style={{ transform: "rotate(-90deg)" }} /></button>
              <button className="adm-icon-btn" onClick={() => setEditing(p)} aria-label="Edit caption"><IconEdit /></button>
              <button className="adm-icon-btn" aria-label="Remove from wall" onClick={() => {
                if (!confirm("Remove this photo from the wall?")) return;
                const del = confirm("Also delete the file from the media library?");
                setRows((r) => r.filter((x) => x.id !== p.id));
                start(async () => { await removeHappyAction(p.id, del); toast("Photo removed"); });
              }}><IconTrash /></button>
            </div>
          </div>
        ))}
      </div>
      <MediaPicker open={picker} onClose={() => setPicker(false)} onPick={add} kind="image" />
      <MediaEditModal media={editing} onClose={() => setEditing(null)} onSaved={(m) => setRows((r) => r.map((x) => (x.id === m.id ? { ...x, ...m } : x)))} />
    </section>
  );
}
