// Instacart Developer Platform: turn a NOOSH grocery list into an Instacart shopping list page.
// Docs: https://docs.instacart.com/developer_platform_api/api/products/create_shopping_list_page
import type { PlanRow } from "./types";

type Measurement = { quantity: number; unit: string };
export type LineItem = { name: string; display_text: string; line_item_measurements?: Measurement[] };

// Our amounts are free text ("300 g bag", "1 bunch", "6"). Map the common ones onto
// Instacart's supported units; anything else is sent by name only and Instacart picks a size.
const UNITS: Record<string, string> = {
  g: "gram", gram: "gram", grams: "gram", kg: "kilogram", kilogram: "kilogram", kilograms: "kilogram",
  ml: "milliliter", l: "liter", liter: "liter", liters: "liter", litre: "liter", litres: "liter",
  oz: "ounce", ounce: "ounce", ounces: "ounce", lb: "pound", lbs: "pound", pound: "pound", pounds: "pound",
  cup: "cup", cups: "cup", tbsp: "tablespoon", tablespoon: "tablespoon", tablespoons: "tablespoon",
  tsp: "teaspoon", teaspoon: "teaspoon", teaspoons: "teaspoon",
  bunch: "bunch", bunches: "bunch", can: "can", cans: "can", head: "head", heads: "head",
  package: "package", packages: "package", pack: "package", packs: "package", each: "each",
};

export function toMeasurement(amount: string): Measurement | undefined {
  const m = amount.trim().toLowerCase().match(/^(\d+\/\d+|\d+(?:\.\d+)?)\s*([a-z]+)?/);
  if (!m) return undefined;
  const quantity = m[1].includes("/") ? Number(m[1].split("/")[0]) / Number(m[1].split("/")[1]) : Number(m[1]);
  if (!(quantity > 0)) return undefined;
  if (!m[2]) return { quantity, unit: "each" }; // "6" eggs, "2" lemons
  const unit = UNITS[m[2]];
  return unit ? { quantity, unit } : undefined;
}

/** What's still left to buy (unchecked items), or everything if all are checked. */
export function lineItems(row: Pick<PlanRow, "plan" | "checked">): LineItem[] {
  const all = row.plan.grocery.flatMap((sec) => sec.items.map((it) => ({ sec: sec.section, it })));
  const left = all.filter(({ sec, it }) => !row.checked[`${sec}|${it.name}`]);
  return (left.length ? left : all).map(({ it }) => {
    const measurement = toMeasurement(it.amount);
    return {
      name: it.name,
      display_text: it.amount ? `${it.name} (${it.amount})` : it.name,
      ...(measurement ? { line_item_measurements: [measurement] } : {}),
    };
  });
}

export class InstacartError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Ask Instacart for a shopping list page and return its link. */
export async function createShoppingListLink(title: string, items: LineItem[], linkback: string): Promise<string> {
  const key = process.env.INSTACART_API_KEY;
  if (!key) throw new InstacartError(503, "Instacart isn’t set up yet.");
  // Development keys only work on Instacart's test server; production keys on the live one.
  const base = process.env.INSTACART_ENV === "production" ? "https://connect.instacart.com" : "https://connect.dev.instacart.tools";

  const res = await fetch(`${base}/idp/v1/products/products_link`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      title,
      link_type: "shopping_list",
      expires_in: 30,
      line_items: items,
      landing_page_configuration: { partner_linkback_url: linkback },
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (res.ok && typeof json.products_link_url === "string") return json.products_link_url;

  console.error("Instacart request failed", res.status, JSON.stringify(json).slice(0, 500));
  if (res.status === 401 || res.status === 403) throw new InstacartError(500, "Instacart isn’t set up correctly. (API key)");
  if (res.status === 429) throw new InstacartError(429, "Instacart is busy right now. Try again in a minute.");
  throw new InstacartError(502, "Couldn’t open Instacart. Try again, or use Share list.");
}
