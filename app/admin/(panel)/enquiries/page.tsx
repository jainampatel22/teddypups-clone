import Link from "next/link";
import { listEnquiries } from "@/lib/admin/repo";
import { fmtDate } from "@/lib/admin/format";

export const metadata = { title: "Enquiries" };
const TABS = ["new", "read", "archived", "all"];

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "new", q = "" } = await searchParams;
  const all = listEnquiries();
  const counts: Record<string, number> = { all: all.length };
  for (const e of all) counts[e.status] = (counts[e.status] || 0) + 1;
  const rows = listEnquiries({ status, q: q.trim() || undefined });
  const qs = (s: string) => `/admin/enquiries?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
  return (
    <>
      <div className="adm-head">
        <div><h1>Enquiries</h1><p>Letters from the contact page and “Ask about …” forms on puppy pages.</p></div>
        <a className="adm-btn adm-btn-ghost" href={`/api/admin/enquiries.csv?status=${status}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>Export CSV</a>
      </div>
      <div className="adm-card">
        <div className="adm-row" style={{ marginBottom: 14 }}>
          <div className="adm-seg">
            {TABS.map((t) => <Link key={t} href={qs(t)} data-on={status === t}>{t[0].toUpperCase() + t.slice(1)} <span className="adm-muted">{counts[t] || 0}</span></Link>)}
          </div>
          <span className="adm-spacer" />
          <form className="adm-row" action="/admin/enquiries">
            <input type="hidden" name="status" value={status} />
            <input className="adm-input" name="q" defaultValue={q} placeholder="Search name, phone, email, message" style={{ width: 260 }} />
            <button className="adm-btn adm-btn-ghost adm-btn-sm">Search</button>
          </form>
        </div>
        {rows.length === 0 ? (
          <div className="adm-empty"><b>{status === "new" ? "All caught up" : "Nothing here"}</b>{status === "new" ? "No unread enquiries." : "No enquiries match."}</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>From</th><th>Puppy</th><th>Message</th><th>Source</th><th>Received</th><th>Status</th></tr></thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} data-unread={e.status === "new"}>
                    <td style={{ minWidth: 160 }}><Link href={`/admin/enquiries/${e.id}`} className="adm-link" style={{ color: "inherit" }}>{e.name}</Link><div className="adm-small adm-muted">{e.phone}{e.area ? ` · ${e.area}` : ""}</div></td>
                    <td className="adm-small">{e.puppyName ?? <span className="adm-muted">Any puppy</span>}</td>
                    <td className="adm-small adm-muted" style={{ maxWidth: 320 }}><Link href={`/admin/enquiries/${e.id}`} style={{ textDecoration: "none" }}>{e.message ? (e.message.length > 90 ? e.message.slice(0, 90) + "…" : e.message) : "(no message)"}</Link></td>
                    <td><span className="adm-badge" data-tone={e.source === "puppy" ? "sky" : "honey"}>{e.source === "puppy" ? "Puppy page" : "Contact"}</span></td>
                    <td className="adm-small adm-muted" style={{ whiteSpace: "nowrap" }}>{fmtDate(e.createdAt)}</td>
                    <td><span className="adm-badge" data-tone={e.status === "new" ? "new" : e.status === "read" ? "green" : undefined}>{e.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
