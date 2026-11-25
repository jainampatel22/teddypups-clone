import Link from "next/link";
import { listSections } from "@/lib/db";
import { pageLabel, PAGE_PATH, PAGE_LABEL } from "@/lib/admin/pages";
import { thumbUrlServer } from "@/lib/admin/format";

export const metadata = { title: "Page content" };

export default function SectionsPage() {
  const all = listSections();
  const order = Object.keys(PAGE_LABEL);
  const pages = [...new Set(all.map((s) => s.page))].sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
  return (
    <>
      <div className="adm-head"><div><h1>Page content</h1><p>Headings, text, buttons and lists for each section of the site.</p></div></div>
      {pages.length === 0 && <div className="adm-card adm-empty"><b>No sections yet</b>Run <code>node scripts/seed.ts --sections</code> to load page copy.</div>}
      <div className="adm-grid adm-grid-2" style={{ alignItems: "start" }}>
        {pages.map((p) => (
          <section key={p} className="adm-card">
            <div className="adm-card-head"><h2>{pageLabel(p)}</h2><a className="adm-link adm-small" href={PAGE_PATH(p)} target="_blank" rel="noreferrer">{PAGE_PATH(p)} ↗</a></div>
            <div className="adm-list">
              {all.filter((s) => s.page === p).map((s) => (
                <Link key={s.key} href={`/admin/sections/${encodeURIComponent(p)}/${encodeURIComponent(s.key)}`} className="adm-item" style={{ textDecoration: "none", alignItems: "center" }}>
                  {s.media[0] ? <img src={thumbUrlServer(s.media[0])} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} /> : <span className="adm-badge">{s.key.slice(0, 2)}</span>}
                  <div className="adm-item-body"><b>{s.heading || s.key}</b><div className="adm-small adm-muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.key}{s.body ? ` · ${s.body}` : ""}</div></div>
                  <span className="adm-link adm-small">Edit</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
