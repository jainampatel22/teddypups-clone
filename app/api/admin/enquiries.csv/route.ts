import { adminOr401 } from "@/lib/admin/auth";
import { listEnquiries } from "@/lib/admin/repo";

export async function GET(req: Request) {
  const auth = await adminOr401();
  if (auth instanceof Response) return auth;
  const url = new URL(req.url);
  const rows = listEnquiries({ status: url.searchParams.get("status") || undefined, q: url.searchParams.get("q") || undefined });
  const esc = (v: any) => {
    const s = String(v ?? "");
    return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) ? `"${(/^[=+\-@]/.test(s) ? "'" : "") + s.replace(/"/g, '""')}"` : s;
  };
  const head = ["Date (UTC)", "Status", "Source", "Name", "Phone", "Email", "Area", "Puppy", "Message"];
  const lines = [head.join(","), ...rows.map((r) => [r.createdAt, r.status, r.source, r.name, r.phone, r.email, r.area, r.puppyName ?? "", r.message].map(esc).join(","))];
  return new Response("\uFEFF" + lines.join("\r\n"), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="teddypups-enquiries-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
