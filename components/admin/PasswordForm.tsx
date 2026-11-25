"use client";
import { useActionState } from "react";
import { changePasswordAction, type FormState } from "@/lib/admin/actions";

export default function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePasswordAction, null);
  return (
    <form action={action} className="adm-grid adm-grid-2">
      <div className="adm-field"><label>Current password</label><input className="adm-input" type="password" name="current" autoComplete="current-password" required /></div>
      <div className="adm-field"><label>New password <small>(8+ characters)</small></label><input className="adm-input" type="password" name="next" autoComplete="new-password" minLength={8} required /></div>
      {state?.error && <div className="adm-alert">{state.error}</div>}
      {state?.ok && <div className="adm-alert" data-tone="ok">{state.message}</div>}
      <div><button className="adm-btn adm-btn-sm" disabled={pending}>Change password</button></div>
    </form>
  );
}
