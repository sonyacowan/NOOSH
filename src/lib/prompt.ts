// The instructions sent to Claude. The system prompt holds the rules that never change;
// the user message holds this user's details for this week.
import type { Preferences } from "./types";

export const SYSTEM_PROMPT = `You are a home-cooking meal planner focused on healthy eating and zero food waste.

Rules:
1. Choose recipes that deliberately SHARE perishable ingredients (herbs, greens, half-used vegetables, dairy, proteins) so nearly everything bought gets used up across the week. Avoid buying an ingredient for only one small use when possible.
2. When the user lists ingredients already in their kitchen, build recipes around them, mark them from_kitchen, and list them in already_have instead of the grocery list. Otherwise assume only basic pantry staples (salt, pepper, cooking oil) are on hand and leave already_have empty.
3. Quantities should be realistic for the store (e.g. "1 bunch", "500 g", "1 can").
4. Group the grocery list by store section (Produce, Meat & Seafood, Dairy & Eggs, Bakery, Pantry, Frozen, Spices).
5. For each grocery item, used_in lists the ids of the recipes that use it.
6. Steps should be concise and practical, 4-8 steps each.
7. Respect the diet and the ingredients to avoid strictly; treat them as allergies.`;

export function buildUserMessage(p: Preferences, have: string[], recent: string[]) {
  const lines = [
    `Plan ${p.dinners} dinners for one week.`,
    `- Diet: ${p.diet}`,
    `- Health goals: ${p.goals || "balanced, mostly whole foods"}`,
    `- Never use: ${p.avoid || "nothing specific"}`,
    `- Servings per dinner: ${p.servings}`,
    `- Max active + cook time per dinner: ${p.max_minutes} minutes`,
    `- Other notes: ${p.notes || "none"}`,
  ];
  if (have.length) lines.push(`- Ingredients ALREADY IN THE KITCHEN that must be used up first: ${have.join(", ")}`);
  if (recent.length) lines.push(`- Recently cooked (do not repeat these): ${recent.join(", ")}`);
  return lines.join("\n");
}
