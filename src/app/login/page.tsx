"use client";
// The landing page, and also the sign-in page: enter your email, get a one-time link.
// No passwords to remember or leak.
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Arch, Band, Icon, Sprig } from "./art";
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
      setError(error.message.includes("rate") ? "Too many sign-in emails just now. Please wait a minute and try again." : error.message);
      setStatus("idle");
    } else {
      setStatus("sent");
    }
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
      <form className="form" onSubmit={send}>
        <label htmlFor={id} className="sr-only">Email</label>
        <input id={id} type="email" required autoComplete="email" placeholder="Your email"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="cta" disabled={status === "sending"}>
          {status === "sending" ? "Sending your link…" : "Plan my week, it’s free"}
        </button>
        {error && <div className="err" role="alert">{error}</div>}
        <div className="fine">No password. We’ll email you a link to sign in.</div>
      </form>
    );

  return (
    <main className="landing">
      <div className="in">
        <div className="top">
          <span className="mark">NOOSH</span>
          <button className="toplink" type="button" onClick={() => document.getElementById("email-top")?.focus()}>Sign in</button>
        </div>

        <Arch />
        <div className="eyebrow"><Sprig /><span>Noosh-e jan · may it nourish you</span><Sprig flip /></div>
        <h1 className="serif">Dinner, decided.<br /><em>Nothing wasted.</em></h1>
        <p className="sub">NOOSH plans your week of dinners and one simple grocery list, built around your goals and what’s already in your kitchen.</p>
        {form("email-top")}

        <Band />
        <h2 className="serif">Take the thinking <em>out of dinner</em></h2>
        <p className="lede">No more 5pm “what’s for dinner?” No more half a bunch of herbs going limp in the fridge.</p>
        <div className="perks">
          <div className="perk"><Icon kind="sun" /><div><b>Less to think about</b><span>Your dinners and grocery list, ready in about a minute. Just shop and cook.</span></div></div>
          <div className="perk"><Icon kind="goal" /><div><b>Made around you</b><span>More protein, more plants, quicker meals, foods you avoid. Your week fits your goals.</span></div></div>
          <div className="perk"><Icon kind="jar" /><div><b>Make the most of what you have</b><span>Recipes share ingredients, and leftovers become next week’s first dinners.</span></div></div>
        </div>

        <Band />
        <h2 className="serif">Three easy steps</h2>
        <div className="steps">
          <div className="step"><div className="n">i.</div><div><b>Tell us how you like to eat</b><span>Once. We remember.</span></div></div>
          <div className="step"><div className="n">ii.</div><div><b>Get your week</b><span>Dinners, recipes, and one list sorted by aisle.</span></div></div>
          <div className="step"><div className="n">iii.</div><div><b>Tap what’s left</b><span>Next week’s plan starts there.</span></div></div>
        </div>

        <div className="close">
          <h2 className="serif">Your week, <em>made easy.</em></h2>
          {form("email-bottom")}
        </div>
        <div className="lfoot">NOOSH · made with care for your kitchen</div>
      </div>
    </main>
  );
}
