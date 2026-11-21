"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient();

type Mode = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = mode === "signup"
        ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
        : await authClient.signIn.email({ email: email.trim(), password });
      if (result.error) {
        setMessage(result.error.message || "We couldn’t complete that request. Check your details and try again.");
        return;
      }
      window.location.assign("/");
    } catch {
      setMessage("RIG authentication is unavailable. Check the server and database configuration.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-panel">
        <Link className="login-brand" href="/" aria-label="RIG home"><span className="rig-mark"><span/></span><span className="rig-wordmark">rig<span>.</span></span></Link>
        <p className="kicker">YOUR PRIVATE NETWORK</p>
        <h1>{mode === "signin" ? "Welcome back." : "Make yourself at home."}</h1>
        <p className="login-intro">{mode === "signin" ? "Sign in to manage your RIG gateways and account." : "Create your RIG account to get started."}</p>
        <div className="login-tabs" role="tablist" aria-label="Account action"><button type="button" role="tab" aria-selected={mode === "signin"} className={mode === "signin" ? "active" : ""} onClick={() => { setMode("signin"); setMessage(""); }}>Sign in</button><button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setMessage(""); }}>Create account</button></div>
        <form className="login-form" onSubmit={submit}>
          {mode === "signup" && <label>Your name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" required maxLength={80}/></label>}
          <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required maxLength={254}/></label>
          <label>Password<input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" required minLength={8} maxLength={128}/></label>
          <button className="connect-cta login-submit" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
          {message && <p className="login-message" role="alert">{message}</p>}
        </form>
        <div className="login-safety"><span><i/> Secure account session</span><span>RIG APP PREVIEW</span></div>
        <p className="login-note">Account creation requires the RIG backend and PostgreSQL to be configured. This preview does not enable VPN connectivity.</p>
      </section>
    </main>
  );
}
