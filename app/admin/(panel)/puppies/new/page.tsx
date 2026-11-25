import Link from "next/link";
import { plain } from "@/lib/admin/format";
import { listBreeds, listOrigins, listCollections } from "@/lib/db";
import PuppyForm from "@/components/admin/PuppyForm";

export const metadata = { title: "Add a puppy" };

export default function NewPuppy() {
  return (
    <>
      <div className="adm-head"><div><div className="adm-crumb"><Link href="/admin/puppies">Puppies</Link> / New</div><h1>Add a puppy</h1></div></div>
      <PuppyForm puppy={null} breeds={plain(listBreeds())} origins={plain(listOrigins())} collections={plain(listCollections())} />
    </>
  );
}
