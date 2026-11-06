// POST /api/plan  -- generates a new weekly plan with AI and saves it.
// Body: { "mode": "fresh" }  re-plan the current week from scratch
//       { "mode": "next" }   start next week, using up the logged leftovers
//
// Runs only on the server, so the AI key never reaches the browser.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PreferencesSchema } from "@/lib/types";
import { AiError } from "@/lib/ai";
import { SafetyError, planWithChecks } from "@/lib/quality";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/prompt";

export const maxDuration = 120; // seconds; planning usually takes 20-60s
const DAILY_LIMIT = 8;          // protects your AI quota and bill from runaway use

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail(401, "Please sign in again.");

  const body = await request.json().catch(() => ({}));
  const mode: "fresh" | "next" = body?.mode === "next" ? "next" : "fresh";

  // Load everything the prompt needs. RLS limits each query to this user's rows.
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const [prefsRes, kitchenRes, recentRes, countRes] = await Promise.all([
    supabase.from("preferences").select("*").maybeSingle(),
    supabase.from("kitchen").select("leftovers, extras").maybeSingle(),
    supabase.from("plans").select("week, plan").order("created_at", { ascending: false }).limit(4),
    supabase.from("plans").select("id", { count: "exact", head: true }).gte("created_at", since),
  ]);

  const prefs = PreferencesSchema.safeParse(prefsRes.data);
  if (!prefs.success) return fail(400, "Set your preferences first.");
  if ((countRes.count ?? 0) >= DAILY_LIMIT) {
    return fail(429, `You've made ${DAILY_LIMIT} plans today. Try again tomorrow.`);
  }

  const have = mode === "next"
    ? [...(kitchenRes.data?.leftovers ?? []), ...(kitchenRes.data?.extras ?? [])]
    : [];
  const recentRows = recentRes.data ?? [];
  const recent = recentRows
    .flatMap((r) => (r.plan?.recipes ?? []).map((x: { name: string }) => x.name))
    .slice(0, 15);
  const currentWeek = recentRows[0]?.week ?? 1;
  const week = mode === "next" && recentRows.length ? currentWeek + 1 : currentWeek;

  let plan;
  try {
    // Ask the AI, check the plan against quality and safety rules, and retry once with feedback if needed.
    const result = await planWithChecks(SYSTEM_PROMPT, buildUserMessage(prefs.data, have, recent), prefs.data, request.signal);
    plan = result.plan;
    if (result.problems.length) console.warn("Saved a plan with minor issues", result.problems.map((p) => p.message));
  } catch (err) {
    if (err instanceof AiError) return fail(err.status, err.message);
    if (err instanceof SafetyError) return fail(422, err.message);
    console.error("Plan generation failed", err);
    return fail(502, "Planning failed. Try again in a moment.");
  }

  const { data: saved, error } = await supabase
    .from("plans")
    .insert({ week, plan, used_leftovers: have })
    .select()
    .single();
  if (error) {
    console.error("Saving plan failed", error);
    return fail(500, "Couldn't save the plan. Try again.");
  }

  // Leftovers are now "spent" on this plan; clear them for next week.
  if (mode === "next") {
    await supabase.from("kitchen").upsert({ user_id: user.id, leftovers: [], extras: [], updated_at: new Date().toISOString() });
  }

  return NextResponse.json({ plan: saved });
}
