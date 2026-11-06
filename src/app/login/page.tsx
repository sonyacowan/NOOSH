"use client";
// The landing page, and also the sign-in page: enter your email, get a one-time link.
// No passwords to remember or leak.
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Arch, Divider, Icon } from "./art";
import "./landing.css";

type Status = "idle" | "sending" | "sent";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  // The sign-in callback sends people back here with ?error=link if a link expired or was reused.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "link") {
      setError("That sign-in link has expired or was already used. Enter your email for a fresh one.");
    }
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message.includes("rate") ? "Sign-in emails are paused for a little while. Check your inbox for a link we already sent, or try again later." : error.message);
      setStatus("idle");
    } else {
      setStatus("sent");
    }
  }

  // "Continue with Google": Google confirms who you are, then sends you back to /auth/callback.
  async function google() {
    setError("");
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError("Google sign-in isn’t available right now. Use your email instead.");
  }

  // Both sign-up forms share the same email, status and messages.
  const form = (id: string) =>
    status === "sent" ? (
      <div className="sent" role="status">
        <b>Check your email</b>
        We sent a sign-in link to <strong>{email}</strong>. Open it on this device to start planning.
        <div className="again">
          <button className="toplink" type="button" onClick={() => setStatus("idle")}>Use a different email</button>
        </div>
      </div>
    ) : (
      <>
      <div className="form">
        <button className="google" type="button" onClick={google}>
          <GoogleLogo /> Continue with Google
        </button>
        <div className="or"><span>or use your email</span></div>
      </div>
      <form className="form tight" onSubmit={send}>
        <label htmlFor={id} className="sr-only">Email</label>
        <input id={id} type="email" required autoComplete="email" placeholder="Your email"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="cta" disabled={status === "sending"}>
          {status === "sending" ? "Sending your link…" : "Email me a sign-in link"}
        </button>
        {error && <div className="err" role="alert">{error}</div>}
        <div className="fine">Free. No password needed either way.</div>
      </form>
      </>
    );

  return (
    <main className="landing">
      <div className="in">
        <div className="top">
          <span className="mark">NOOSH</span>
          <button className="toplink" type="button" onClick={() => document.getElementById("email-top")?.focus()}>Sign in</button>
        </div>

        <Arch />
        <div className="eyebrow">Noosh-e jan · may it nourish you</div>
        <h1 className="serif">Your week, decided.<br /><em>Nothing wasted.</em></h1>
        <p className="sub">NOOSH plans your week of meals, breakfast to dinner, with one grocery list for a single shop. Built around your goals and what’s already in your kitchen.</p>
        {form("email-top")}

        <Divider />
        <h2 className="serif">Take the thinking <em>out of meals</em></h2>
        <p className="lede">No more 5pm “what’s for dinner?” No more midweek grocery runs. No more half a bunch of herbs going limp in the fridge.</p>
        <div className="perks">
          <div className="perk"><Icon kind="tea" /><div><b>One shop a week</b><span>Breakfast, lunch, dinner and snacks, with every ingredient on one list sorted by aisle. Shop once, then just cook.</span></div></div>
          <div className="perk"><Icon kind="sprout" /><div><b>Made around you</b><span>Choose which meals to plan. More protein, more plants, quicker cooking, foods you avoid. Your week fits your life.</span></div></div>
          <div className="perk"><Icon kind="jar" /><div><b>Make the most of what you have</b><span>Meals share ingredients, tonight’s dinner can be tomorrow’s lunch, and leftovers start next week’s plan.</span></div></div>
        </div>

        <Divider />
        <h2 className="serif">Three easy steps</h2>
        <div className="steps">
          <div className="step"><div className="n">i.</div><div><b>Tell us how you like to eat</b><span>Once. We remember.</span></div></div>
          <div className="step"><div className="n">ii.</div><div><b>Get your week</b><span>Meals, recipes, and one grocery list for a single shop.</span></div></div>
          <div className="step"><div className="n">iii.</div><div><b>Tap what’s left</b><span>Next week’s plan starts there.</span></div></div>
        </div>

        <div className="close">
          <h2 className="serif">Shop once. <em>Eat well all week.</em></h2>
          {form("email-bottom")}
        </div>
        <div className="lfoot">NOOSH · made with care for your kitchen</div>
      </div>
    </main>
  );
}

/** Google's standard "G" mark, in its official colors. */
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.87.92 7.53 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
