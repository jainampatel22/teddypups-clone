import { getSettings } from "@/lib/db";
import SettingsForm from "@/components/admin/SettingsForm";
import PasswordForm from "@/components/admin/PasswordForm";
import { logoutAction } from "@/lib/admin/actions";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <div className="adm-head"><div><h1>Settings</h1><p>Contact details, social links and SEO used across the whole site.</p></div></div>
      <SettingsForm settings={getSettings()} />
      <section className="adm-card adm-stack" style={{ marginTop: 18, maxWidth: 560 }}>
        <h2>Account</h2>
        <PasswordForm />
        <form action={logoutAction}><button className="adm-btn adm-btn-ghost adm-btn-sm">Sign out</button></form>
      </section>
    </>
  );
}
