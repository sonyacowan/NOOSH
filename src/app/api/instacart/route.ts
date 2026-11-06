// POST /api/instacart  -- sends this week's remaining groceries to Instacart and returns a link.
// Runs on the server so the Instacart API key stays secret.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { InstacartError, createShoppingListLink, lineItems } from "@/lib/instacart";
import type { PlanRow } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  // Always use the saved plan, never a list sent from the browser.
  const { data: row } = await supabase.from("plans").select("week, plan, checked").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!row) return NextResponse.json({ error: "Make a plan first." }, { status: 400 });

  const items = lineItems(row as Pick<PlanRow, "plan" | "checked">);
  if (!items.length) return NextResponse.json({ error: "Your grocery list is empty." }, { status: 400 });

  try {
    const url = await createShoppingListLink(`NOOSH · Week ${row.week} groceries`, items, new URL("/", request.url).toString());
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof InstacartError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("Instacart link failed", err);
    return NextResponse.json({ error: "Couldn’t open Instacart. Try again, or use Share list." }, { status: 502 });
  }
}
