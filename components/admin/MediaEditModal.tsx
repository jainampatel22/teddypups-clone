"use client";
import { useEffect, useRef, useState } from "react";
import type { Media } from "@/lib/types";
import { updateMediaAction } from "@/lib/admin/actions";
import { toast } from "./Toaster";
import { IconX } from "./Icons";

/** Edit alt text, caption and focal point (click the image to move the focus dot). */
export default function MediaEditModal({ media, onClose, onSaved }: { media: Media | null; onClose: () => void; onSaved?: (m: Media) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [fx, setFx] = useState(0.5);
  const [fy, setFy] = useState(0.5);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (media) {
      setAlt(media.alt); setCaption(media.caption); setFx(media.focalX); setFy(media.focalY);
      if (!d.open) d.showModal();
    } else if (d.open) d.close();
  }, [media]);
  if (!media) return <dialog ref={ref} className="adm-modal" />;
  const img = media.kind === "video" ? media.poster : media;
  const pos = `${(fx * 100).toFixed(1)}% ${(fy * 100).toFixed(1)}%`;
  const save = async () => {
    setBusy(true);
    await updateMediaAction(media.id, { alt, caption, focalX: fx, focalY: fy });
    if (media.kind === "video" && media.poster) await updateMediaAction(media.poster.id, { alt, focalX: fx, focalY: fy });
    setBusy(false);
    toast("Media saved");
    onSaved?.({ ...media, alt, caption, focalX: fx, focalY: fy });
    onClose();
  };
  return (
    <dialog ref={ref} className="adm-modal" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()} style={{ width: "min(760px, calc(100vw - 24px))" }}>
      <div className="adm-modal-head">
        <h2>Edit {media.kind}</h2>
        <button className="adm-icon-btn" onClick={onClose} aria-label="Close"><IconX /></button>
      </div>
      <div className="adm-modal-body adm-grid adm-grid-2">
        <div>
          {media.kind === "video" ? (
            <video src={media.url} poster={img?.url} controls muted playsInline style={{ width: "100%", borderRadius: 12, maxHeight: 340, background: "#000" }} />
          ) : null}
          {img && (
            <>
              <div className="adm-label" style={{ margin: media.kind === "video" ? "10px 0 6px" : "0 0 6px" }}>Focal point <small>(click the photo)</small></div>
              <span
                className="adm-focal"
                onClick={(e) => {
                  const c = contentRect((e.currentTarget as HTMLElement).querySelector("img")!);
                  setFx(Math.min(1, Math.max(0, (e.clientX - c.left) / c.width)));
                  setFy(Math.min(1, Math.max(0, (e.clientY - c.top) / c.height)));
                }}
              >
                <img src={img.url} alt="" />
                <FocalDot fx={fx} fy={fy} />
              </span>
              <div className="adm-focal-previews">
                {[[1, 1], [3, 4], [16, 9]].map(([w, h]) => (
                  <div key={`${w}${h}`} style={{ width: 72, aspectRatio: `${w}/${h}` }}><img src={img.url.replace(/\.webp$/, "-640.webp")} alt="" style={{ objectPosition: pos }} /></div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="adm-stack">
          <div className="adm-field"><label>Alt text <small>(describe the photo)</small></label><input className="adm-input" value={alt} onChange={(e) => setAlt(e.target.value)} /></div>
          <div className="adm-field"><label>Caption <small>(optional, shown on photo walls)</small></label><input className="adm-input" value={caption} onChange={(e) => setCaption(e.target.value)} /></div>
          <dl className="adm-dl adm-small">
            <dt>File</dt><dd><a className="adm-link" href={media.url} target="_blank" rel="noreferrer">{media.url}</a></dd>
            <dt>Size</dt><dd>{media.width} × {media.height}</dd>
            <dt>Focus</dt><dd>{Math.round(fx * 100)}% / {Math.round(fy * 100)}%</dd>
            {media.durationS ? (<><dt>Length</dt><dd>{media.durationS}s</dd></>) : null}
          </dl>
        </div>
      </div>
      <div className="adm-modal-foot">
        <button className="adm-btn adm-btn-ghost" onClick={onClose}>Cancel</button>
        <button className="adm-btn" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
      </div>
    </dialog>
  );
}

/** Rendered image area of an object-fit: contain <img>, in viewport coordinates. */
function contentRect(img: HTMLImageElement) {
  const r = img.getBoundingClientRect();
  if (!img.naturalWidth) return r;
  const s = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
  const width = img.naturalWidth * s, height = img.naturalHeight * s;
  return { left: r.left + (r.width - width) / 2, top: r.top + (r.height - height) / 2, width, height };
}

/** Dot positioned over the rendered (contain-fit) image area. */
function FocalDot({ fx, fy }: { fx: number; fy: number }) {
  const ref = useRef<HTMLElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ display: "none" });
  useEffect(() => {
    const place = () => {
      const dot = ref.current;
      const wrap = dot?.parentElement;
      const img = wrap?.querySelector("img");
      if (!dot || !wrap || !img || !img.naturalWidth) return;
      const c = contentRect(img);
      const w = wrap.getBoundingClientRect();
      setStyle({ left: c.left - w.left + fx * c.width, top: c.top - w.top + fy * c.height });
    };
    place();
    const img = ref.current?.parentElement?.querySelector("img");
    img?.addEventListener("load", place);
    addEventListener("resize", place);
    return () => { img?.removeEventListener("load", place); removeEventListener("resize", place); };
  }, [fx, fy]);
  return <i ref={ref} style={style} />;
}
