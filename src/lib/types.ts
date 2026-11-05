// The shape of a meal plan. Written once with Zod, used in three places:
// 1. Sent to Claude as a JSON schema, so the API guarantees this exact shape.
// 2. Used to validate the response on our server.
// 3. Turned into TypeScript types, so the editor catches typos in the UI.
import { z } from "zod";

export const MealPlanSchema = z.object({
  overview: z.string().describe("One or two friendly sentences on how the week's ingredients connect"),
  recipes: z.array(
    z.object({
      id: z.string().describe('Short id like "r1"'),
      name: z.string(),
      minutes: z.number().describe("Total minutes, a whole number"),
      why: z.string().describe("One short sentence on what it shares with other dinners"),
      ingredients: z.array(
        z.object({
          item: z.string(),
          amount: z.string(),
          from_kitchen: z.boolean().describe("True if this comes from the leftovers already in the kitchen"),
        }),
      ),
      steps: z.array(z.string()),
    }),
  ),
  grocery: z.array(
    z.object({
      section: z.string().describe("Store section, e.g. Produce, Dairy & Eggs, Pantry"),
      items: z.array(
        z.object({
          name: z.string(),
          amount: z.string(),
          used_in: z.array(z.string()).describe("Ids of the recipes that use this item"),
        }),
      ),
    }),
  ),
  already_have: z.array(
    z.object({
      name: z.string(),
      used_in: z.array(z.string()),
    }),
  ),
});
export type MealPlan = z.infer<typeof MealPlanSchema>;

// Preferences as the form edits them. Limits keep the prompt a sane size.
export const PreferencesSchema = z.object({
  diet: z.string().max(60),
  goals: z.string().max(300),
  avoid: z.string().max(300),
  dinners: z.number().int().min(3).max(5),
  servings: z.number().int().min(1).max(8),
  max_minutes: z.number().int().min(10).max(120),
  notes: z.string().max(600),
});
export type Preferences = z.infer<typeof PreferencesSchema>;

export const DEFAULT_PREFS: Preferences = {
  diet: "No restrictions", goals: "", avoid: "", dinners: 4, servings: 2, max_minutes: 45, notes: "",
};

export type PlanRow = {
  id: string;
  week: number;
  plan: MealPlan;
  checked: Record<string, boolean>;
  used_leftovers: string[];
  created_at: string;
};
