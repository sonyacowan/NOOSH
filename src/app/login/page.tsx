"use client";
// Sign-in page: enter your email, get a one-time link. No passwords to remember or leak.
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setState("idle");
    } else {
      setState("sent");
    }
  }

  return (
    <div className="wrap narrow">
      <header className="top"><h1>Barakat</h1></header>
      <p className="lede">Weekly dinners planned around what you already have, so less food goes to waste.</p>
      {state === "sent" ? (
        <div className="note">
          <strong>Check your email.</strong> We sent a sign-in link to {email}. Open it on this device.
        </div>
      ) : (
        <form onSubmit={send}>
          <label className="field" htmlFor="email">Email</label>
          <input id="email" type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <button className="btn" disabled={state === "sending"}>
            {state === "sending" ? "Sending…" : "Email me a sign-in link"}
          </button>
          {error && <div className="error">{error}</div>}
        </form>
      )}
    </div>
  );
}
