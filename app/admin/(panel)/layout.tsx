import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { logoutAction } from "@/lib/admin/actions";
import { dashboardCounts } from "@/lib/admin/repo";
import SideNav from "@/components/admin/SideNav";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const counts = dashboardCounts();
  return (
    <div className="adm-shell">
      <aside className="adm-side">
        <Link href="/admin" className="adm-brand">
          <img src="/brand/logo-128.webp" alt="" />
          <span><b>TeddyPups</b><small>Admin</small></span>
        </Link>
        <SideNav newEnquiries={counts.newEnquiries} />
        <div className="adm-side-foot">
          <a href="/" target="_blank" rel="noreferrer">View site ↗</a>
          <span>{user.email}</span>
          <form action={logoutAction}><button type="submit">Sign out</button></form>
        </div>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  );
}
