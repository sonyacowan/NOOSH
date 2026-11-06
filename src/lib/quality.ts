// Quality checks for AI-made plans.
// The AI is good but not perfect, so before a plan is shown we check it against
// rules a person would care about. If something is wrong, we ask the AI to fix it.
import { generateMealPlan } from "./ai";
import type { MealPlan, Preferences } from "./types";

export type Problem = {
  /** "safety" problems (a food to avoid) are never allowed through. */
  level: "safety" | "quality";
  message: string;
};

const STAPLES = /^(salt|pepper|black pepper|sea salt|water|oil|olive oil|cooking oil|vegetable oil)$/i;

/** The user's "ingredients to avoid", split into individual words or phrases. */
export function avoidTerms(avoid: string): string[] {
  return avoid
    .split(/[,;\n]| and /i)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 3 && !/^(no|none|nothing|n\/a)$/.test(t));
}

/** True if `text` mentions `term` as a whole word (so "pea" does not match "peach").
 *  Singular and plural both count: "peas" also catches "pea", "tomatoes" catches "tomato". */
function mentions(text: string, term: string) {
  const singular = term.replace(/(oes|es|s)$/i, (m) => (m.toLowerCase() === "oes" ? "o" : ""));
  const stem = singular.length >= 3 ? singular : term;
  const escaped = stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${escaped}(s|es)?([^a-z]|$)`, "i").test(text);
}

/** Look for problems in a plan. An empty list means the plan passed. */
export function checkPlan(plan: MealPlan, prefs: Preferences): Problem[] {
  const problems: Problem[] = [];
  const add = (level: Problem["level"], message: string) => problems.push({ level, message });
  const ids = new Set(plan.recipes.map((r) => r.id));
  const wanted = prefs.meals.length ? prefs.meals : ["dinner"];

  // 1. Foods to avoid: anywhere in recipes, ingredients or the grocery list.
  for (const term of avoidTerms(prefs.avoid)) {
    const hits = new Set<string>();
    for (const r of plan.recipes) {
      if (mentions(r.name, term)) hits.add(r.name);
      for (const i of r.ingredients) if (mentions(i.item, term)) hits.add(`${i.item} in ${r.name}`);
    }
    for (const sec of plan.grocery) for (const it of sec.items) if (mentions(it.name, term)) hits.add(it.name);
    if (hits.size) add("safety", `Contains "${term}", which the user avoids: ${[...hits].join("; ")}. Replace it.`);
  }

  // 2. The right meals, in the right numbers.
  for (const meal of wanted) {
    const count = plan.recipes.filter((r) => r.meal === meal).length;
    if (count === 0) add("quality", `No ${meal} recipes were planned, but the user asked for ${meal}.`);
  }
  for (const r of plan.recipes) {
    if (!wanted.includes(r.meal)) add("quality", `"${r.name}" is a ${r.meal}, which the user did not ask for. Remove it.`);
  }
  if (wanted.includes("dinner")) {
    const dinners = plan.recipes.filter((r) => r.meal === "dinner").length;
    if (dinners !== prefs.dinners) add("quality", `Planned ${dinners} dinners; the user asked for ${prefs.dinners}.`);
  }

  // 3. Each recipe is complete and fits the time limit.
  if (ids.size !== plan.recipes.length) add("quality", "Two recipes share the same id. Give every recipe a unique id.");
  for (const r of plan.recipes) {
    const minSteps = r.meal === "dinner" ? 3 : 1;
    if (r.steps.filter((s) => s.trim()).length < minSteps) add("quality", `"${r.name}" needs clear steps.`);
    if (r.ingredients.length < 2) add("quality", `"${r.name}" lists too few ingredients.`);
    if (r.meal === "dinner" && r.minutes > prefs.max_minutes + 5) {
      add("quality", `"${r.name}" takes ${r.minutes} min; the limit is ${prefs.max_minutes} min.`);
    }
  }

  // 4. The grocery list is consistent with the recipes.
  for (const sec of plan.grocery) {
    for (const it of sec.items) {
      const unknown = it.used_in.filter((id) => !ids.has(id));
      if (unknown.length) add("quality", `Grocery item "${it.name}" points to recipes that don't exist (${unknown.join(", ")}).`);
      if (!it.used_in.length) add("quality", `Grocery item "${it.name}" isn't used by any recipe. Remove it or use it.`);
    }
  }
  const shopped = new Set(plan.grocery.flatMap((s) => s.items.flatMap((i) => i.used_in)).concat(plan.already_have.flatMap((h) => h.used_in)));
  for (const r of plan.recipes) {
    const needsShopping = r.ingredients.some((i) => !STAPLES.test(i.item.trim()));
    if (needsShopping && !shopped.has(r.id)) add("quality", `Nothing on the grocery list is marked as used in "${r.name}". Add its ingredients.`);
  }

  return problems;
}

/** Turn problems into a short note the AI can act on. */
function feedback(problems: Problem[]) {
  return [
    "Your previous plan had these problems. Make a corrected plan that fixes all of them and still follows every rule:",
    ...problems.slice(0, 12).map((p) => `- ${p.message}`),
  ].join("\n");
}

/**
 * Ask the AI for a plan, check it, and ask once more with feedback if needed.
 * Returns the best plan, or throws if the only plans available contain a food to avoid.
 */
export async function planWithChecks(
  system: string, user: string, prefs: Preferences, signal: AbortSignal,
  ask: typeof generateMealPlan = generateMealPlan, timeBudgetMs = 60_000,
): Promise<{ plan: MealPlan; attempts: number; problems: Problem[] }> {
  const started = Date.now();
  let best: { plan: MealPlan; problems: Problem[] } | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const message = attempt === 1 || !best ? user : `${user}\n\n${feedback(best.problems)}`;
    const plan = await ask(system, message, signal);
    const problems = checkPlan(plan, prefs);
    const isBetter = !best || score(problems) < score(best.problems);
    if (isBetter) best = { plan, problems };
    if (!problems.length) return { plan, attempts: attempt, problems };
    console.warn(`Plan attempt ${attempt} had ${problems.length} problem(s)`, problems.map((p) => p.message));
    // Don't start a second AI call if the first one already took most of our time.
    if (Date.now() - started > timeBudgetMs) break;
  }

  if (best!.problems.some((p) => p.level === "safety")) {
    throw new SafetyError();
  }
  return { plan: best!.plan, attempts: 2, problems: best!.problems };
}

const score = (problems: Problem[]) => problems.reduce((n, p) => n + (p.level === "safety" ? 100 : 1), 0);

export class SafetyError extends Error {
  constructor() {
    super("The plan kept including a food you avoid, so it wasn't saved. Please try again.");
  }
}
