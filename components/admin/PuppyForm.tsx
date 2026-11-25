"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Media, Puppy, Ref } from "@/lib/types";
import { savePuppyAction, deletePuppyAction } from "@/lib/admin/actions";
import DropZone from "./DropZone";
import MediaPicker from "./MediaPicker";
import MediaEditModal from "./MediaEditModal";
import { useSortable } from "./useSortable";
import { thumbUrl } from "./upload";
import { toast } from "./Toaster";
import { IconStar, IconEdit, IconTrash, IconUp, IconDown, IconPlus, IconX } from "./Icons";

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
const GENDER_LABEL: Record<string, string> = { male: "Boy", female: "Girl", "male-female": "Boy & girl" };

type Props = { puppy: Puppy | null; breeds: Ref[]; origins: Ref[]; collections: Ref[] };

export default function PuppyForm({ puppy, breeds, origins, collections }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const initial = useMemo(() => ({
    name: puppy?.name ?? "",
    displayName: puppy?.displayName ?? "",
    slug: puppy?.slug ?? "",
    breed: puppy?.breed ?? "",
    gender: puppy?.gender ?? "male",
    genderLabel: puppy?.genderLabel ?? "Boy",
    age: puppy?.age ?? "",
    colour: puppy?.colour ?? "",
    description: puppy?.description ?? "",
    records: puppy?.records ?? [],
    status: puppy?.status ?? "available",
    featured: puppy?.featured ?? false,
    published: puppy?.published ?? true,
    seoDescription: puppy?.seoDescription ?? "",
    originSlug: puppy?.origin?.slug ?? (origins.find((o) => o.slug === "imported")?.slug ?? origins[0]?.slug ?? null),
    breeds: puppy?.breeds.map((b) => b.slug) ?? [],
    collections: puppy?.collections.map((c) => c.slug) ?? [],
    media: puppy?.media ?? [],
    coverId: puppy?.cover?.id ?? null,
  }), [puppy, origins]);
  const [f, setF] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!!puppy);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState<Media | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(f) !== JSON.stringify(initial);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const autoSlug = slugify(f.name || f.displayName || f.breed);
  const slug = slugTouched ? f.slug : autoSlug;
  const { itemProps, move } = useSortable(f.media, (next) => set("media", next));
  const addMedia = (m: Media[]) => setF((x) => {
    const ids = new Set(x.media.map((y) => y.id));
    const media = [...x.media, ...m.filter((y) => !ids.has(y.id))];
    return { ...x, media, coverId: x.coverId ?? media.find((y) => y.kind === "image")?.id ?? null };
  });
  const toggle = (k: "breeds" | "collections", slug: string) => set(k, f[k].includes(slug) ? f[k].filter((s) => s !== slug) : [...f[k], slug]);

  const save = () => {
    setError(null);
    start(async () => {
      const res = await savePuppyAction({
        id: puppy?.id, slug, name: f.name, displayName: f.displayName, breed: f.breed, gender: f.gender as any, genderLabel: f.genderLabel,
        age: f.age, colour: f.colour, description: f.description, records: f.records, status: f.status as any, featured: f.featured,
        published: f.published, seoDescription: f.seoDescription, originSlug: f.originSlug, breeds: f.breeds, collections: f.collections,
        mediaIds: f.media.map((m) => m.id), coverId: f.coverId,
      });
      if (!res.ok) { setError(res.error || "Couldn't save."); toast(res.error || "Couldn't save.", "error"); return; }
      toast(puppy ? "Puppy saved" : "Puppy created");
      if (!puppy) router.replace(`/admin/puppies/${res.id}`);
      else router.refresh();
    });
  };
  const remove = () => {
    if (!puppy) return;
    if (!confirm(`Delete ${puppy.displayName}? This can't be undone.`)) return;
    const alsoMedia = confirm("Also delete this puppy's photos and videos from the media library (if nothing else uses them)?");
    start(async () => {
      await deletePuppyAction(puppy.id, alsoMedia);
      toast("Puppy deleted");
      router.replace("/admin/puppies");
    });
  };

  return (
    <div className="adm-split">
      <div className="adm-stack" style={{ gap: 18 }}>
        <section className="adm-card adm-stack">
          <h2>About the puppy</h2>
          <div className="adm-grid adm-grid-2">
            <div className="adm-field">
              <label>Name <small>(leave empty if listed by breed only)</small></label>
              <input className="adm-input" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Max" />
            </div>
            <div className="adm-field">
              <label>Display name <small>(shown as the title)</small></label>
              <input className="adm-input" value={f.displayName} onChange={(e) => set("displayName", e.target.value)} placeholder={f.name || f.breed || "e.g. Max"} />
            </div>
            <div className="adm-field">
              <label>Breed <small>(as written on the card)</small></label>
              <input className="adm-input" value={f.breed} onChange={(e) => set("breed", e.target.value)} placeholder="e.g. Korean Teacup Maltipoo" />
            </div>
            <div className="adm-field">
              <label>Age</label>
              <input className="adm-input" value={f.age} onChange={(e) => set("age", e.target.value)} placeholder="e.g. 3 months" />
            </div>
            <div className="adm-field">
              <label>Boy or girl</label>
              <select className="adm-select" value={f.gender} onChange={(e) => setF((x) => ({ ...x, gender: e.target.value as any, genderLabel: GENDER_LABEL[e.target.value] }))}>
                <option value="male">Boy</option><option value="female">Girl</option><option value="male-female">Boy & girl (litter)</option>
              </select>
            </div>
            <div className="adm-field">
              <label>Gender label <small>(text shown)</small></label>
              <input className="adm-input" value={f.genderLabel} onChange={(e) => set("genderLabel", e.target.value)} />
            </div>
            <div className="adm-field">
              <label>Colour <small>(optional)</small></label>
              <input className="adm-input" value={f.colour} onChange={(e) => set("colour", e.target.value)} placeholder="e.g. Apricot" />
            </div>
            <div className="adm-field">
              <label>Where</label>
              <select className="adm-select" value={f.originSlug ?? ""} onChange={(e) => set("originSlug", e.target.value || null)}>
                <option value="">Not set</option>
                {origins.map((o) => <option key={o.slug} value={o.slug}>{o.name}</option>)}
              </select>
            </div>
          </div>
          <div className="adm-field">
            <label>Description <small>(optional, shown on the puppy page)</small></label>
            <textarea className="adm-textarea" value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="e.g. Maltipoo (Left) & Cavapoo (Right)." />
          </div>
          <div className="adm-field">
            <span className="adm-label">Breed filters <small>(which /puppies filter chips this puppy matches)</small></span>
            <div className="adm-chips">
              {breeds.map((b) => <label key={b.slug} className="adm-chip"><input type="checkbox" checked={f.breeds.includes(b.slug)} onChange={() => toggle("breeds", b.slug)} />{b.name}</label>)}
            </div>
          </div>
          {collections.length > 0 && (
            <div className="adm-field">
              <span className="adm-label">Collections</span>
              <div className="adm-chips">
                {collections.map((c) => <label key={c.slug} className="adm-chip"><input type="checkbox" checked={f.collections.includes(c.slug)} onChange={() => toggle("collections", c.slug)} />{c.name}</label>)}
              </div>
            </div>
          )}
        </section>

        <section className="adm-card adm-stack">
          <div className="adm-card-head" style={{ marginBottom: 0 }}>
            <div><h2>Photos & videos</h2><p>Drag to reorder. The star marks the cover photo used on cards.</p></div>
            <button type="button" className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setPickerOpen(true)}><IconPlus width={14} />From library</button>
          </div>
          {f.media.length > 0 && (
            <div className="adm-mm">
              {f.media.map((m, i) => (
                <div key={m.id} className="adm-mm-item" {...itemProps(i)}>
                  <button type="button" className="adm-thumb" onClick={() => setEditing(m)} title="Edit alt text and focal point">
                    <img src={thumbUrl(m)} alt={m.alt} draggable={false} style={{ objectPosition: `${m.focalX * 100}% ${m.focalY * 100}%` }} />
                    <span className="adm-thumb-tag">{f.coverId === m.id && <span className="cover">cover</span>}{m.kind === "video" && <span>▶ video</span>}<span>{i + 1}</span></span>
                  </button>
                  <div className="adm-mm-tools">
                    <button type="button" className="adm-icon-btn" disabled={m.kind !== "image" && !m.poster} onClick={() => set("coverId", m.id)} aria-label="Set as cover" title="Set as cover" style={f.coverId === m.id ? { background: "#fbe3b4" } : undefined}><IconStar /></button>
                    <button type="button" className="adm-icon-btn" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move earlier"><IconUp style={{ transform: "rotate(-90deg)" }} /></button>
                    <button type="button" className="adm-icon-btn" onClick={() => move(i, i + 1)} disabled={i === f.media.length - 1} aria-label="Move later"><IconDown style={{ transform: "rotate(-90deg)" }} /></button>
                    <button type="button" className="adm-icon-btn" onClick={() => setEditing(m)} aria-label="Edit"><IconEdit /></button>
                    <button type="button" className="adm-icon-btn" onClick={() => setF((x) => ({ ...x, media: x.media.filter((y) => y.id !== m.id), coverId: x.coverId === m.id ? x.media.find((y) => y.id !== m.id && y.kind === "image")?.id ?? null : x.coverId }))} aria-label="Remove from puppy" title="Remove from this puppy (file stays in the library)"><IconX /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <DropZone onUploaded={addMedia} label="Drop puppy photos or MP4 videos, or click to choose" />
        </section>

        <section className="adm-card adm-stack">
          <div className="adm-card-head" style={{ marginBottom: 0 }}>
            <div><h2>Extra details</h2><p>Optional rows like “Vaccinations: 2 doses” or “Weight: 900 g”.</p></div>
            <button type="button" className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => set("records", [...f.records, { label: "", value: "" }])}><IconPlus width={14} />Add row</button>
          </div>
          {f.records.length === 0 && <p className="adm-muted adm-small">No extra rows.</p>}
          {f.records.map((r, i) => (
            <div key={i} className="adm-row" style={{ flexWrap: "nowrap" }}>
              <input className="adm-input" placeholder="Label" value={r.label} onChange={(e) => set("records", f.records.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <input className="adm-input" placeholder="Value" value={r.value} onChange={(e) => set("records", f.records.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
              <button type="button" className="adm-icon-btn" onClick={() => set("records", f.records.filter((_, j) => j !== i))} aria-label="Remove row"><IconTrash /></button>
            </div>
          ))}
        </section>
      </div>

      <aside className="adm-stack" style={{ gap: 18, position: "sticky", top: 20 }}>
        <section className="adm-card adm-stack">
          <h2>Status</h2>
          <div className="adm-seg" role="radiogroup" aria-label="Status">
            {(["available", "reserved", "home"] as const).map((s) => (
              <button type="button" key={s} role="radio" aria-checked={f.status === s} data-on={f.status === s} onClick={() => set("status", s)}>
                {s === "home" ? "Gone home" : s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <p className="adm-hint">{f.status === "home" ? "Shows on /gone-home as a ticket, not on /puppies." : "Shows on /puppies and the home page."}</p>
          <label className="adm-switch"><input type="checkbox" checked={f.published} onChange={(e) => set("published", e.target.checked)} />Published on the site</label>
          <label className="adm-switch"><input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} />Featured</label>
        </section>
        <section className="adm-card adm-stack">
          <h2>Web address & SEO</h2>
          <div className="adm-field">
            <label>Slug</label>
            <input className="adm-input" value={slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} placeholder={autoSlug || "auto from name"} />
            <span className="adm-hint">/puppies/{slug || "…"} {!puppy && !slugTouched && "(made from the name; a number is added if taken)"}</span>
          </div>
          <div className="adm-field">
            <label>SEO description <small>({f.seoDescription.length}/160)</small></label>
            <textarea className="adm-textarea" style={{ minHeight: 80 }} value={f.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} placeholder="Leave empty to generate one from the details." />
          </div>
        </section>
        {error && <div className="adm-alert" role="alert">{error}</div>}
        <div className="adm-row">
          <button type="button" className="adm-btn" onClick={save} disabled={pending || (!dirty && !!puppy)} style={{ flex: 1 }}>{pending ? "Saving…" : puppy ? "Save changes" : "Create puppy"}</button>
          {puppy && <a className="adm-btn adm-btn-ghost" href={`/puppies/${puppy.slug}`} target="_blank" rel="noreferrer">View</a>}
        </div>
        {dirty && puppy && <p className="adm-hint" style={{ color: "#a24a1a", fontWeight: 700 }}>Unsaved changes</p>}
        {puppy ? <button type="button" className="adm-btn adm-btn-danger" onClick={remove} disabled={pending}>Delete puppy</button> : <Link href="/admin/puppies" className="adm-link">Cancel</Link>}
      </aside>

      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={addMedia} />
      <MediaEditModal media={editing} onClose={() => setEditing(null)} onSaved={(m) => set("media", f.media.map((x) => (x.id === m.id ? m : x)))} />
    </div>
  );
}
