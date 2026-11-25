import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin/auth";
import LoginForm from "@/components/admin/LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getAdmin()) redirect("/admin");
  const { next } = await searchParams;
  return (
    <div className="adm-login">
      <div className="adm-login-card">
        <img src="/brand/logo-128.webp" alt="" />
        <h1>TeddyPups admin</h1>
        <p className="adm-hand">every puppy is family</p>
        <LoginForm next={next || "/admin"} />
      </div>
    </div>
  );
}
