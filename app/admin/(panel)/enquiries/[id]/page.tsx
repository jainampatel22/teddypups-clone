import Link from "next/link";
import { notFound } from "next/navigation";
import { getEnquiry, setEnquiryStatus } from "@/lib/admin/repo";
import { getSettings } from "@/lib/db";
import { fmtDate } from "@/lib/admin/format";
import EnquiryActions from "@/components/admin/EnquiryActions";

export const metadata = { title: "Enquiry" };

export default async function EnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = getEnquiry(id);
  if (!e) notFound();
  const wasNew = e.status === "new";
  if (wasNew) setEnquiryStatus(id, "read"); // opening it marks it read
  const s = getSettings();
  const digits = e.phone.replace(/[^\d]/g, "");
  const greeting = `Hi ${e.name.split(" ")[0]}, thanks for your message to ${s.siteName}${e.puppyName ? ` about ${e.puppyName}` : ""}! `;
  return (
    <>
      <div className="adm-head">
        <div><div className="adm-crumb"><Link href="/admin/enquiries">Enquiries</Link> / {e.name}</div><h1>{e.name}</h1><p>{fmtDate(e.createdAt)} · {e.source === "puppy" ? "Puppy page form" : "Contact page letter"}</p></div>
        <div className="adm-row">
          <a className="adm-btn adm-btn-green" href={`https://wa.me/${digits}?text=${encodeURIComponent(greeting)}`} target="_blank" rel="noreferrer">Reply on WhatsApp</a>
          {e.email && <a className="adm-btn adm-btn-ghost" href={`mailto:${e.email}?subject=${encodeURIComponent(`Your ${s.shortName} enquiry`)}&body=${encodeURIComponent(greeting)}`}>Email</a>}
        </div>
      </div>
      <div className="adm-split">
        <div className="adm-letter">
          <p className="adm-hand" style={{ fontSize: "1.15rem" }}>Dear {s.shortName},</p>
          <blockquote>{e.message || <span className="adm-muted">(No message. They filled in their details only.)</span>}</blockquote>
          <p className="adm-hand" style={{ marginTop: 18 }}>with love, {e.name}</p>
        </div>
        <aside className="adm-card adm-stack">
          <dl className="adm-dl">
            <dt>Phone</dt><dd><a className="adm-link" href={`tel:${e.phone.replace(/\s/g, "")}`}>{e.phone}</a></dd>
            <dt>Email</dt><dd>{e.email ? <a className="adm-link" href={`mailto:${e.email}`}>{e.email}</a> : <span className="adm-muted">-</span>}</dd>
            <dt>Area</dt><dd>{e.area || <span className="adm-muted">-</span>}</dd>
            <dt>Puppy</dt><dd>{e.puppyId && e.puppyName ? (<><Link className="adm-link" href={`/admin/puppies/${e.puppyId}`}>{e.puppyName}</Link> · <a className="adm-link" href={`/puppies/${e.puppySlug}`} target="_blank" rel="noreferrer">view ↗</a></>) : <span className="adm-muted">Any puppy</span>}</dd>
            <dt>Status</dt><dd><span className="adm-badge" data-tone={wasNew ? "new" : undefined}>{wasNew ? "new → read" : e.status}</span></dd>
          </dl>
          <EnquiryActions id={e.id} status={wasNew ? "read" : e.status} />
        </aside>
      </div>
    </>
  );
}
