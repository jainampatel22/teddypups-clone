"use client";
import SortableEditList from "./SortableEditList";
import { saveFaqAction, deleteFaqAction } from "@/lib/admin/actions";

export default function FaqManager({ items }: { items: { id: string; question: string; answer: string; published: boolean }[] }) {
  return (
    <SortableEditList
      title="Questions" intro="The first three published questions also appear on the home page." table="faqs" items={items} addLabel="Add question"
      fields={[{ key: "question", label: "Question", placeholder: "Do you deliver?" }, { key: "answer", label: "Answer", type: "textarea" }]}
      render={(f) => (<><b style={{ fontFamily: "var(--a-display)", fontSize: "1.02rem" }}>{f.question}</b><p className="adm-muted adm-small" style={{ marginTop: 4 }}>{f.answer}</p></>)}
      onSave={(f) => saveFaqAction({ id: f.id, question: f.question || "", answer: f.answer || "", published: !!f.published })}
      onDelete={deleteFaqAction}
    />
  );
}
