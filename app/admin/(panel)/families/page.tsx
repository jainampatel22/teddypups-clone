import { listHappyPhotos } from "@/lib/db";
import { allTestimonials } from "@/lib/admin/repo";
import HappyManager from "@/components/admin/HappyManager";
import TestimonialManager from "@/components/admin/TestimonialManager";

export const metadata = { title: "Happy families" };

export default function FamiliesPage() {
  return (
    <>
      <div className="adm-head"><div><h1>Happy families</h1><p>Photos for the wall on /happy-families. Switch on “Home” to pin a photo (with its caption) to the home page board.</p></div></div>
      <HappyManager photos={listHappyPhotos()} />
      <div style={{ height: 18 }} />
      <TestimonialManager items={allTestimonials()} />
    </>
  );
}
