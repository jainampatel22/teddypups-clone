"use client";
import { useRef, useState } from "react";
import type { Media } from "@/lib/types";
import { uploadMany, type UploadProgress } from "./upload";
import { toast } from "./Toaster";

/** Click or drop files. Converts images to WebP in the browser, then uploads. */
export default function DropZone({ onUploaded, accept = "image/*,video/mp4", label = "Drop photos or MP4 videos here, or click to choose", compact = false }: {
  onUploaded: (m: Media[]) => void; accept?: string; label?: string; compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState<UploadProgress[]>([]);
  const run = async (list: FileList | null) => {
    const files = Array.from(list || []);
    if (!files.length || busy) return;
    setBusy(true);
    const { media, errors } = await uploadMany(files, setProg);
    setBusy(false);
    if (media.length) { onUploaded(media); toast(`${media.length} file${media.length > 1 ? "s" : ""} uploaded as WebP`); }
    if (errors.length) toast(errors[0], "error");
    setTimeout(() => setProg([]), 2500);
    if (input.current) input.current.value = "";
  };
  return (
    <div
      className="adm-drop"
      data-active={active || busy ? "true" : undefined}
      onClick={() => !busy && input.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setActive(true); }}
      onDragLeave={() => setActive(false)}
      onDrop={(e) => { e.preventDefault(); setActive(false); run(e.dataTransfer.files); }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
      style={compact ? { padding: 14 } : undefined}
    >
      <input ref={input} type="file" multiple accept={accept} hidden onChange={(e) => run(e.target.files)} data-testid="admin-upload-input" />
      <b>{busy ? "Converting to WebP and uploading…" : label}</b>
      {!compact && <div className="adm-hint" style={{ marginTop: 4 }}>Images become WebP (1920px + 640px) in your browser. Max 25 MB each.</div>}
      {prog.length > 0 && (
        <div className="adm-progress">
          {prog.map((p, i) => (
            <div key={i}><span>{p.name}</span><span className="adm-badge" data-tone={p.state === "done" ? "green" : p.state === "error" ? "red" : "honey"}>{p.state === "error" ? p.error : p.state}</span></div>
          ))}
        </div>
      )}
    </div>
  );
}
