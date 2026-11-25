"use client";
import { useActionState } from "react";
import { loginAction, type FormState } from "@/lib/admin/actions";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, null);
  return (
    <form action={action} className="adm-stack">
      <input type="hidden" name="next" value={next} />
      <div className="adm-field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" required className="adm-input" autoFocus defaultValue={state?.email ?? ""} /></div>
      <div className="adm-field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required className="adm-input" /></div>
      {state?.error && <div className="adm-alert" role="alert">{state.error}</div>}
      <button className="adm-btn" disabled={pending} style={{ marginTop: 4 }}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
