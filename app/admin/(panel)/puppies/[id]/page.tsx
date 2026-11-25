import Link from "next/link";
import { plain } from "@/lib/admin/format";
import { notFound } from "next/navigation";
import { getPuppyById, listBreeds, listOrigins, listCollections } from "@/lib/db";
import { STATUS_LABEL } from "@/lib/admin/format";
import PuppyForm from "@/components/admin/PuppyForm";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = getPuppyById((await params).id);
  return { title: p ? p.displayName : "Puppy" };
}

export default async function EditPuppy({ params }: { params: Promise<{ id: string }> }) {
  const p = getPuppyById((await params).id);
  if (!p) notFound();
  return (
    <>
      <div className="adm-head">
        <div>
          <div className="adm-crumb"><Link href={`/admin/puppies?status=${p.status}`}>Puppies</Link> / {p.displayName}</div>
          <h1>{p.displayName} <span className="adm-badge" data-tone={p.status} style={{ verticalAlign: "middle" }}>{STATUS_LABEL[p.status]}</span></h1>
        </div>
      </div>
      <PuppyForm key={p.id + p.slug} puppy={p} breeds={plain(listBreeds())} origins={plain(listOrigins())} collections={plain(listCollections())} />
    </>
  );
}
