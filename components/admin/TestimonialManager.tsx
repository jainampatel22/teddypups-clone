"use client";
import SortableEditList from "./SortableEditList";
import { saveTestimonialAction, deleteTestimonialAction } from "@/lib/admin/actions";

export default function TestimonialManager({ items }: { items: { id: string; quote: string; name: string; location: string; published: boolean }[] }) {
  return (
    <SortableEditList
      title="Testimonials" intro="The first published testimonial is the note on the home page and /happy-families." table="testimonials" items={items} addLabel="Add testimonial"
      fields={[{ key: "quote", label: "Quote", type: "textarea", placeholder: "TeddyPups truly made our dream a reality…" }, { key: "name", label: "Name", placeholder: "Sarah M." }, { key: "location", label: "Location", placeholder: "Dubai, UAE" }]}
      render={(t) => (<><p style={{ fontFamily: "var(--a-display)" }}>“{t.quote}”</p><p className="adm-hand adm-small" style={{ marginTop: 4 }}>{t.name}{t.location ? `, ${t.location}` : ""}</p></>)}
      onSave={(t) => saveTestimonialAction({ id: t.id, quote: t.quote || "", name: t.name || "", location: t.location || "", published: !!t.published })}
      onDelete={deleteTestimonialAction}
    />
  );
}
