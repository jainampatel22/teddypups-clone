import { allFaqs } from "@/lib/admin/repo";
import FaqManager from "@/components/admin/FaqManager";

export const metadata = { title: "FAQs" };

export default function FaqsPage() {
  return (
    <>
      <div className="adm-head"><div><h1>FAQs</h1><p>Notes on the /faq board, searchable by visitors. Drag to reorder.</p></div></div>
      <FaqManager items={allFaqs()} />
    </>
  );
}
