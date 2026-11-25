"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Media } from "@/lib/types";
import { listMediaAction } from "@/lib/admin/actions";
import { thumbUrl } from "./upload";
import DropZone from "./DropZone";
import { IconX } from "./Icons";

/** Modal: choose existing media from the library or upload new files. */
export default function MediaPicker({ open, onClose, onPick, multiple = true, kind }: {
  open: boolean; onClose: () => void; onPick: (m: Media[]) => void; multiple?: boolean; kind?: "image" | "video";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [all, setAll] = useState<Media[] | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) { d.showModal(); setSel([]); listMediaAction().then((m) => setAll(m)); }
    if (!open && d.open) d.close();
  }, [open]);
  const posterIds = useMemo(() => new Set((all || []).map((m) => m.poster?.id).filter(Boolean)), [all]);
  const list = (all || []).filter((m) => (!kind || m.kind === kind) && !posterIds.has(m.id) && (!q || (m.alt + " " + m.caption + " " + m.id).toLowerCase().includes(q.toLowerCase())));
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : multiple ? [...s, id] : [id]));
  const done = () => { const map = new Map((all || []).map((m) => [m.id, m])); onPick(sel.map((id) => map.get(id)!).filter(Boolean)); onClose(); };
  return (
    <dialog ref={ref} className="adm-modal" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="adm-modal-head">
        <h2>Choose {multiple ? "media" : "a file"}</h2>
        <button className="adm-icon-btn" onClick={onClose} aria-label="Close"><IconX /></button>
      </div>
      <div className="adm-modal-body adm-stack">
        <DropZone compact onUploaded={(m) => { setAll((a) => [...m, ...(a || [])]); setSel((s) => (multiple ? [...m.map((x) => x.id), ...s] : [m[0].id])); }} />
        <input className="adm-input" placeholder="Search alt text, caption or id" value={q} onChange={(e) => setQ(e.target.value)} />
        {!all ? <p className="adm-muted">Loading library…</p> : (
          <div className="adm-media-grid">
            {list.map((m) => (
              <button type="button" key={m.id} className="adm-thumb" data-selected={sel.includes(m.id) || undefined} onClick={() => toggle(m.id)} title={m.alt || m.id}>
                <img src={thumbUrl(m)} alt={m.alt} loading="lazy" />
                <span className="adm-thumb-tag">{m.kind === "video" && <span>▶ video</span>}{sel.includes(m.id) && <span className="cover">#{sel.indexOf(m.id) + 1}</span>}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="adm-modal-foot">
        <span className="adm-muted adm-small" style={{ marginRight: "auto", alignSelf: "center" }}>{sel.length} selected</span>
        <button className="adm-btn adm-btn-ghost" onClick={onClose}>Cancel</button>
        <button className="adm-btn" disabled={!sel.length} onClick={done}>Use {sel.length > 1 ? `${sel.length} files` : "file"}</button>
      </div>
    </dialog>
  );
}
