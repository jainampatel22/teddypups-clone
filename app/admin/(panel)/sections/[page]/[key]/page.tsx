import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb, getSection } from "@/lib/db";
import { pageLabel, PAGE_PATH } from "@/lib/admin/pages";
import SectionEditor from "@/components/admin/SectionEditor";

export const metadata = { title: "Edit section" };

export default async function EditSection({ params }: { params: Promise<{ page: string; key: string }> }) {
  const { page: p, key: k } = await params;
  const page = decodeURIComponent(p), key = decodeURIComponent(k);
  if (!getDb().prepare("SELECT 1 FROM sections WHERE page = ? AND key = ?").get(page, key)) notFound();
  const s = getSection(page, key);
  return (
    <>
      <div className="adm-head"><div><div className="adm-crumb"><Link href="/admin/sections">Page content</Link> / {pageLabel(page)}</div><h1>{s.heading || key}</h1><p>Section <code>{key}</code></p></div></div>
      <SectionEditor section={s} publicPath={PAGE_PATH(page)} />
    </>
  );
}
