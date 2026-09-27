"use client";
import { useActionState } from "react";
import { loginAction } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return <form action={action} className="admin-login-card">
    <p className="admin-kicker">OASPE / ADMIN</p><h1>Καλώς ήρθατε.</h1><p>Συνδεθείτε για να διαχειριστείτε το περιεχόμενο του οργανισμού.</p>
    <label>Όνομα διαχειριστή<input name="username" autoComplete="username" required /></label>
    <label>Κωδικός<input name="password" type="password" autoComplete="current-password" required /></label>
    {state?.error ? <p className="admin-error">{state.error}</p> : null}
    <button disabled={pending}>{pending ? "Σύνδεση…" : "Σύνδεση"}</button>
  </form>;
}
