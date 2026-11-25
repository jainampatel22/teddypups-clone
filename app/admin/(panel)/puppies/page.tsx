import Link from "next/link";
import { listPuppies } from "@/lib/db";
import PuppyTable from "@/components/admin/PuppyTable";

export const metadata = { title: "Puppies" };
const TABS = [
  { key: "available", label: "Available" },
  { key: "reserved", label: "Reserved" },
  { key: "home", label: "Gone home" },
  { key: "all", label: "All" },
];

export default async function PuppiesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "available", q = "" } = await searchParams;
  const all = listPuppies({ includeUnpublished: true });
  const counts = Object.fromEntries(TABS.map((t) => [t.key, t.key === "all" ? all.length : all.filter((p) => p.status === t.key).length]));
  const needle = q.trim().toLowerCase();
  const rows = all.filter((p) => (status === "all" || p.status === status) && (!needle || [p.displayName, p.name, p.breed, p.slug, p.age].join(" ").toLowerCase().includes(needle)));
  const qs = (s: string) => `/admin/puppies?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Puppies</h1>
          <p>Available and reserved puppies show on /puppies. Mark a puppy “Gone home” and it moves to /gone-home.</p>
        </div>
        <Link href="/admin/puppies/new" className="adm-btn">Add a puppy</Link>
      </div>
      <div className="adm-card">
        <div className="adm-row" style={{ marginBottom: 14 }}>
          <div className="adm-seg">
            {TABS.map((t) => <Link key={t.key} href={qs(t.key)} data-on={status === t.key}>{t.label} <span className="adm-muted">{counts[t.key]}</span></Link>)}
          </div>
          <span className="adm-spacer" />
          <form className="adm-row" action="/admin/puppies">
            <input type="hidden" name="status" value={status} />
            <input className="adm-input" name="q" defaultValue={q} placeholder="Search name, breed, age…" style={{ width: 240 }} />
            <button className="adm-btn adm-btn-ghost adm-btn-sm">Search</button>
          </form>
        </div>
        <PuppyTable puppies={rows} canReorder={status !== "all" && !needle} />
      </div>
    </>
  );
}
