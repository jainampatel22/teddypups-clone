"use client";
import { useState, useTransition } from "react";
import type { Media, Section } from "@/lib/types";
import { saveSectionAction } from "@/lib/admin/actions";
import DataEditor from "./DataEditor";
import MediaPicker from "./MediaPicker";
import MediaEditModal from "./MediaEditModal";
import { useSortable } from "./useSortable";
import { thumbUrl } from "./upload";
import { toast } from "./Toaster";
import { IconPlus, IconX } from "./Icons";

export default function SectionEditor({ section, publicPath }: { section: Section; publicPath: string }) {
  const [heading, setHeading] = useState(section.heading);
  const [body, setBody] = useState(section.body);
  const [data, setData] = useState<Record<string, any>>(section.data || {});
  const [media, setMedia] = useState<Media[]>(section.media);
  const [picker, setPicker] = useState(false);
  const [editing, setEditing] = useState<Media | null>(null);
  const [pending, start] = useTransition();
  const snapshot = () => JSON.stringify([heading, body, data, media.map((m) => m.id)]);
  const [saved, setSaved] = useState(snapshot);
  const dirty = snapshot() !== saved;
  const { itemProps } = useSortable(media, setMedia);
  const save = () => start(async () => {
    const ids = media.map((m) => m.id);
    const d = Array.isArray(data.mediaIds) ? { ...data, mediaIds: ids } : data; // keep data.mediaIds in step with the media list
    const res = await saveSectionAction(section.page, section.key, { heading, body, data: d, mediaIds: ids });
    if (!res.ok) { toast(res.error || "Couldn't save", "error"); return; }
    setData(d);
    setSaved(JSON.stringify([heading, body, d, ids]));
    toast("Section saved");
  });
  return (
    <div className="adm-split">
      <div className="adm-stack" style={{ gap: 18 }}>
        <section className="adm-card adm-stack">
          <div className="adm-field"><label>Heading</label><input className="adm-input" value={heading} onChange={(e) => setHeading(e.target.value)} /></div>
          <div className="adm-field"><label>Body</label><textarea className="adm-textarea" value={body} onChange={(e) => setBody(e.target.value)} /></div>
        </section>
        <section className="adm-card adm-stack">
          <div><h2>More content</h2><p className="adm-muted adm-small">Labels, links, lists of steps or items used by this section.</p></div>
          <DataEditor value={data} onChange={setData} hide={["mediaIds"]} />
        </section>
      </div>
      <aside className="adm-stack" style={{ gap: 18, position: "sticky", top: 20 }}>
        <section className="adm-card adm-stack">
          <div className="adm-card-head" style={{ marginBottom: 0 }}><h2>Media</h2><button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setPicker(true)}><IconPlus width={14} />Add</button></div>
          {media.length === 0 ? <p className="adm-muted adm-small">No media on this section.</p> : (
            <div className="adm-mm" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))" }}>
              {media.map((m, i) => (
                <div key={m.id + i} className="adm-mm-item" {...itemProps(i)}>
                  <button type="button" className="adm-thumb" onClick={() => setEditing(m)}><img src={thumbUrl(m)} alt={m.alt} draggable={false} /><span className="adm-thumb-tag"><span>{i + 1}</span>{m.kind === "video" && <span>▶</span>}</span></button>
                  <div className="adm-mm-tools"><button className="adm-icon-btn" onClick={() => setMedia(media.filter((_, j) => j !== i))} aria-label="Remove"><IconX /></button></div>
                </div>
              ))}
            </div>
          )}
          <p className="adm-hint">Drag to reorder. Click to edit alt text and focal point.</p>
        </section>
        <div className="adm-row">
          <button className="adm-btn" style={{ flex: 1 }} disabled={!dirty || pending} onClick={save}>{pending ? "Saving…" : "Save section"}</button>
          <a className="adm-btn adm-btn-ghost" href={publicPath} target="_blank" rel="noreferrer">View page</a>
        </div>
        {dirty && <p className="adm-hint" style={{ color: "#a24a1a", fontWeight: 700 }}>Unsaved changes</p>}
      </aside>
      <MediaPicker open={picker} onClose={() => setPicker(false)} onPick={(m) => setMedia((x) => [...x, ...m])} />
      <MediaEditModal media={editing} onClose={() => setEditing(null)} onSaved={(m) => setMedia((x) => x.map((y) => (y.id === m.id ? m : y)))} />
    </div>
  );
}
