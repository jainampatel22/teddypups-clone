import Link from "next/link";
import { dashboardCounts, listEnquiries } from "@/lib/admin/repo";
import { listPuppies } from "@/lib/db";
import { thumbUrlServer, fmtDate } from "@/lib/admin/format";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const c = dashboardCounts();
  const recent = listEnquiries().slice(0, 6);
  const latest = listPuppies({ status: ["available", "reserved"], includeUnpublished: true }).slice(0, 5);
  const stats = [
    { label: "Available puppies", n: c.available, href: "/admin/puppies?status=available", tint: "#e3f4e8" },
    { label: "Gone home", n: c.home, href: "/admin/puppies?status=home", tint: "#f6dccb" },
    { label: "New enquiries", n: c.newEnquiries, href: "/admin/enquiries?status=new", tint: "#fbe3b4" },
    { label: "Happy family photos", n: c.happy, href: "/admin/families", tint: "#e2eff9" },
  ];
  return (
    <>
      <div className="adm-head">
        <div>
          <p className="adm-hand" style={{ marginTop: 0 }}>hello again</p>
          <h1>Dashboard</h1>
        </div>
        <div className="adm-row">
          <Link href="/admin/puppies/new" className="adm-btn">Add a puppy</Link>
          <a href="/" target="_blank" rel="noreferrer" className="adm-btn adm-btn-ghost">View site</a>
        </div>
      </div>
      <div className="adm-grid adm-grid-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="adm-card adm-stat" style={{ ["--tint" as any]: s.tint }}>
            <span>{s.label}</span><b>{s.n}</b>
          </Link>
        ))}
      </div>
      <div className="adm-split" style={{ marginTop: 18 }}>
        <section className="adm-card">
          <div className="adm-card-head">
            <h2>Recent enquiries</h2>
            <Link href="/admin/enquiries" className="adm-link">See all</Link>
          </div>
          {recent.length === 0 ? (
            <div className="adm-empty"><b>No enquiries yet</b>Messages from the contact page and puppy pages land here.</div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>From</th><th>About</th><th>When</th><th></th></tr></thead>
                <tbody>
                  {recent.map((e) => (
                    <tr key={e.id} data-unread={e.status === "new"}>
                      <td><Link href={`/admin/enquiries/${e.id}`} className="adm-link" style={{ color: "inherit" }}>{e.name}</Link><div className="adm-small adm-muted">{e.phone}</div></td>
                      <td className="adm-small">{e.puppyName ?? <span className="adm-muted">Any puppy</span>}</td>
                      <td className="adm-small adm-muted" style={{ whiteSpace: "nowrap" }}>{fmtDate(e.createdAt)}</td>
                      <td>{e.status === "new" && <span className="adm-badge" data-tone="new">new</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="adm-card">
          <div className="adm-card-head"><h2>Listed now</h2><Link href="/admin/puppies" className="adm-link">Manage</Link></div>
          <div className="adm-list">
            {latest.map((p) => (
              <Link key={p.id} href={`/admin/puppies/${p.id}`} className="adm-pup" style={{ textDecoration: "none" }}>
                {p.cover ? <img src={thumbUrlServer(p.cover)} alt="" /> : <span className="adm-ph" />}
                <span><b>{p.displayName}</b><span>{[p.breed !== p.displayName ? p.breed : null, p.genderLabel.toLowerCase(), p.age].filter(Boolean).join(" · ")}</span></span>
              </Link>
            ))}
          </div>
          <dl className="adm-dl adm-small" style={{ marginTop: 18 }}>
            <dt>Reserved</dt><dd>{c.reserved}</dd>
            <dt>Drafts</dt><dd>{c.drafts}</dd>
            <dt>Media files</dt><dd>{c.media}</dd>
            <dt>Enquiries</dt><dd>{c.enquiries}</dd>
          </dl>
        </section>
      </div>
    </>
  );
}
