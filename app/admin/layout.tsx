import type { Metadata } from "next";
import "../styles/admin.css";
import Toaster from "@/components/admin/Toaster";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Admin", template: "%s · TeddyPups admin" }, robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <div className="adm">
      {children}
      <Toaster />
    </div>
  );
}
