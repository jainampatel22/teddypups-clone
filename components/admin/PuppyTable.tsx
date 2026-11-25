"use client";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { Puppy } from "@/lib/types";
import { reorderAction, setPuppyFieldAction } from "@/lib/admin/actions";
import { useSortable } from "./useSortable";
import { thumbUrl } from "./upload";
import { toast } from "./Toaster";
import { IconGrip, IconUp, IconDown, IconStar, IconExternal } from "./Icons";

export default function PuppyTable({ puppies, canReorder }: { puppies: Puppy[]; canReorder: boolean }) {
  const [rows, setRows] = useState(puppies);
  const [, start] = useTransition();
  useEffect(() => setRows(puppies), [puppies]);
  const commitOrder = (next: Puppy[]) => {
    setRows(next);
    start(async () => { await reorderAction("puppies", next.map((p) => p.id)); toast("Order saved"); });
  };
  const { itemProps, move } = useSortable(rows, commitOrder);
  const set = (id: string, field: "published" | "status" | "featured", value: any) => {
    setRows((r) => r.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    start(async () => {
      await setPuppyFieldAction(id, field, value);
      toast(field === "status" ? (value === "home" ? "Moved to Gone home" : `Marked ${value}`) : field === "published" ? (value ? "Published" : "Hidden from the site") : "Saved");
    });
  };
  if (!rows.length) return <div className="adm-empty"><b>No puppies here</b>Try another tab or add a puppy.</div>;
  return (
    <div className="adm-table-wrap">
      <table className="adm-table">
        <thead>
          <tr>{canReorder && <th style={{ width: 70 }}>Order</th>}<th>Puppy</th><th>Status</th><th>Origin</th><th>Media</th><th>Published</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map((p, i) => (
            <tr key={p.id} {...(canReorder ? itemProps(i) : {})}>
              {canReorder && (
                <td>
                  <div className="adm-row" style={{ gap: 2, flexWrap: "nowrap" }}>
                    <span className="adm-handle" title="Drag to reorder"><IconGrip width={16} /></span>
                    <button className="adm-icon-btn" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move up"><IconUp /></button>
                    <button className="adm-icon-btn" disabled={i === rows.length - 1} onClick={() => move(i, i + 1)} aria-label="Move down"><IconDown /></button>
                  </div>
                </td>
              )}
              <td>
                <Link href={`/admin/puppies/${p.id}`} className="adm-pup" style={{ textDecoration: "none" }}>
                  {p.cover ? <img src={thumbUrl(p.cover)} alt="" draggable={false} /> : <span className="adm-ph" />}
                  <span>
                    <b>{p.displayName} {p.featured && <IconStar width={14} style={{ color: "#c2622b", verticalAlign: -2 }} />}</b>
                    <span>{[p.breed !== p.displayName ? p.breed : null, p.genderLabel.toLowerCase(), p.age].filter(Boolean).join(" · ")}</span>
                  </span>
                </Link>
              </td>
              <td>
                <select className="adm-select" style={{ minHeight: 34, width: 130, padding: "4px 8px" }} value={p.status} onChange={(e) => set(p.id, "status", e.target.value)} aria-label={`Status of ${p.displayName}`}>
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="home">Gone home</option>
                </select>
              </td>
              <td className="adm-small">{p.origin?.name ?? <span className="adm-muted">-</span>}{p.collections.map((c) => <div key={c.slug} className="adm-muted">{c.name}</div>)}</td>
              <td className="adm-small">{p.media.filter((m) => m.kind === "image").length} photos{p.media.some((m) => m.kind === "video") ? `, ${p.media.filter((m) => m.kind === "video").length} video` : ""}</td>
              <td><label className="adm-switch"><input type="checkbox" checked={p.published} onChange={(e) => set(p.id, "published", e.target.checked)} aria-label={`Publish ${p.displayName}`} /></label></td>
              <td>
                <div className="adm-row" style={{ flexWrap: "nowrap", gap: 6 }}>
                  <Link href={`/admin/puppies/${p.id}`} className="adm-btn adm-btn-ghost adm-btn-sm">Edit</Link>
                  <a href={`/puppies/${p.slug}`} target="_blank" rel="noreferrer" className="adm-icon-btn" aria-label="View on site"><IconExternal /></a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
