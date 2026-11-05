// The home page. This part runs on the server: it checks who is signed in and loads
// their data before sending the page, so there's no "loading…" flash.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PlanRow, Preferences } from "@/lib/types";
import App from "./App";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [prefs, kitchen, plan] = await Promise.all([
    supabase.from("preferences").select("diet, goals, avoid, dinners, servings, max_minutes, notes").maybeSingle(),
    supabase.from("kitchen").select("leftovers, extras").maybeSingle(),
    supabase.from("plans").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  return (
    <App
      userId={user.id}
      email={user.email ?? ""}
      initialPrefs={(prefs.data as Preferences) ?? null}
      initialKitchen={kitchen.data ?? { leftovers: [], extras: [] }}
      initialPlan={(plan.data as PlanRow) ?? null}
    />
  );
}
