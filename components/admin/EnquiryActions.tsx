"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setEnquiryStatusAction, deleteEnquiryAction } from "@/lib/admin/actions";
import { toast } from "./Toaster";

export default function EnquiryActions({ id, status }: { id: string; status: "new" | "read" | "archived" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const go = (s: "new" | "read" | "archived", msg: string, back = false) => start(async () => {
    await setEnquiryStatusAction(id, s);
    toast(msg);
    back ? router.push("/admin/enquiries") : router.refresh();
  });
  return (
    <div className="adm-row">
      {status !== "archived" ? <button className="adm-btn adm-btn-ghost adm-btn-sm" disabled={pending} onClick={() => go("archived", "Archived", true)}>Archive</button>
        : <button className="adm-btn adm-btn-ghost adm-btn-sm" disabled={pending} onClick={() => go("read", "Moved back to inbox")}>Unarchive</button>}
      {status !== "new" && <button className="adm-btn adm-btn-ghost adm-btn-sm" disabled={pending} onClick={() => go("new", "Marked unread", true)}>Mark unread</button>}
      <button className="adm-btn adm-btn-danger adm-btn-sm" disabled={pending} onClick={() => {
        if (!confirm("Delete this enquiry for good?")) return;
        start(async () => { await deleteEnquiryAction(id); toast("Enquiry deleted"); router.push("/admin/enquiries"); });
      }}>Delete</button>
    </div>
  );
}
