// POST /api/plan  -- generates a new weekly plan with Claude and saves it.
// Body: { "mode": "fresh" }  re-plan the current week from scratch
//       { "mode": "next" }   start next week, using up the logged leftovers
//
// Runs only on the server, so ANTHROPIC_API_KEY never reaches the browser.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MealPlanSchema, PreferencesSchema } from "@/lib/types";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/prompt";

export const maxDuration = 120; // seconds; planning usually takes 20-60s
const DAILY_LIMIT = 8;          // protects your API bill from runaway use

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

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
    const response = await anthropic.beta.messages.parse(
      {
        model: "claude-opus-5-5",
        max_tokens: 16000,
        // Effort trades depth of reasoning for speed and cost. "medium" suits a meal plan.
        output_config: { effort: "medium", format: betaZodOutputFormat(MealPlanSchema) },
        // If the model ever declines a request, the API retries on a fallback model.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserMessage(prefs.data, have, recent) }],
      },
      { signal: request.signal }, // stop paying if the user presses Stop
    );
    if (response.stop_reason === "refusal") return fail(422, "Claude couldn't plan with these settings. Try adjusting your preferences.");
    if (response.stop_reason === "max_tokens") return fail(502, "The plan came back incomplete. Try again, or plan fewer dinners.");
    plan = response.parsed_output;
    if (!plan) return fail(502, "The plan didn't come back in a usable form. Try again.");
  } catch (err) {
    if (err instanceof Anthropic.APIUserAbortError) return fail(499, "Stopped.");
    if (err instanceof Anthropic.RateLimitError) return fail(429, "Too many requests right now. Wait a minute and try again.");
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic API key is missing or invalid");
      return fail(500, "The server isn't set up correctly. (API key)");
    }
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
