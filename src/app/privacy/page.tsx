// Privacy policy: what NOOSH stores, who processes it, and how to delete it.
// Written in plain language. Keep it in sync with what the app actually does.
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy · NOOSH" };

const UPDATED = "November 6, 2026";
const CONTACT = "sonyajasminec@gmail.com";

export default function Privacy() {
  return (
    <main className="wrap prose">
      <header className="top">
        <Link href="/" className="mark-link"><span className="mark">NOOSH</span></Link>
      </header>
      <h1 className="page-title">Privacy</h1>
      <p className="muted">Last updated {UPDATED}</p>

      <p>NOOSH is a small, independent app that plans a week of meals and one grocery list. This page explains, in plain language, what we store, why, who helps us run the app, and how to delete your data.</p>

      <h2>What we store</h2>
      <ul>
        <li><b>Your sign-in details:</b> your email address. If you sign in with Google, we also receive your name and profile picture from Google.</li>
        <li><b>Your preferences:</b> diet, health goals, foods you avoid (which may include allergies), which meals to plan, people you cook for, cook time, and any notes you write.</li>
        <li><b>Your plans:</b> the meals and grocery lists we make for you, and which grocery items you’ve checked off.</li>
        <li><b>Your kitchen:</b> leftovers and other ingredients you tell us you have.</li>
      </ul>
      <p>We use a cookie only to keep you signed in. We don’t use advertising or tracking cookies.</p>

      <h2>How we use it</h2>
      <p>Only to run NOOSH: to make your meal plans, remember your preferences, and show your grocery list. We don’t sell your data, share it with advertisers, or show ads.</p>

      <h2>Services that help run NOOSH</h2>
      <ul>
        <li><b>Supabase</b> stores your account and data, and handles sign-in.</li>
        <li><b>Vercel</b> hosts the website.</li>
        <li><b>Google Gemini</b> creates your meal plans. To do this we send it your preferences, leftovers, and recently planned meals (not your email or name). NOOSH currently uses Gemini’s free tier, under which Google may use what’s sent to improve its products. Please don’t put anything in your notes you’d rather keep private.</li>
        <li><b>Google sign-in</b>, if you choose “Continue with Google”.</li>
        <li><b>Instacart</b>, only if you tap “Shop ingredients”: we send the names and amounts of the grocery items you still need. On Instacart, their own privacy policy applies.</li>
      </ul>

      <h2>Deleting your data</h2>
      <p>In the app, tap <b>Delete my data</b> at the bottom of any screen to permanently delete your preferences, plans, and kitchen list. To also delete your sign-in account (your email address), email us at <a href={`mailto:${CONTACT}`}>{CONTACT}</a> and we’ll remove it.</p>

      <h2>Keeping it safe</h2>
      <p>Your data is stored with access rules that let only you read or change it. Secret keys for the services above are kept on our server and never sent to your browser. No system is perfectly secure, but we take reasonable care.</p>

      <h2>Children</h2>
      <p>NOOSH isn’t meant for children under 13, and we don’t knowingly collect their data.</p>

      <h2>Changes and questions</h2>
      <p>If this policy changes, we’ll update the date at the top. Questions? Email <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>

      <p className="back"><Link href="/">← Back to NOOSH</Link></p>
    </main>
  );
}
