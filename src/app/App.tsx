"use client";
// The interactive app: three tabs (This week, Leftovers, Preferences).
// "use client" means this code runs in the browser, so it can respond to taps.
// It reads and writes the database directly; Row Level Security keeps it to this user's rows.
import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_PREFS, MEALS, type Meal, type MealPlan, type PlanRow, type Preferences } from "@/lib/types";

type View = "plan" | "left" | "prefs";
type Kitchen = { leftovers: string[]; extras: string[] };

const MEAL_LABEL: Record<Meal, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snacks" };

const DIETS = ["No restrictions", "Vegetarian", "Vegan", "Pescatarian", "Mediterranean", "Low carb", "Gluten-free", "Dairy-free"];

export default function App(props: {
  userId: string;
  email: string;
  initialPrefs: Preferences | null;
  initialKitchen: Kitchen;
  initialPlan: PlanRow | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [prefs, setPrefs] = useState(props.initialPrefs);
  const [kitchen, setKitchen] = useState(props.initialKitchen);
  const [plan, setPlan] = useState(props.initialPlan);
  const [view, setView] = useState<View>(props.initialPrefs ? "plan" : "prefs");
  const [busy, setBusy] = useState<null | "fresh" | "next">(null);
  const [error, setError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function go(v: View) { setView(v); window.scrollTo(0, 0); }

  function flash(msg: string) {
    setSaveMsg(msg);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveMsg(""), msg.length > 12 ? 3500 : 1500);
  }

  /* ---------- AI planning ---------- */
  async function generate(mode: "fresh" | "next") {
    setError("");
    setBusy(mode);
    go("plan");
    const ctl = new AbortController();
    abortRef.current = ctl;
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
        signal: ctl.signal,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Planning failed. Try again.");
      setPlan(json.plan);
      if (mode === "next") setKitchen({ leftovers: [], extras: [] });
    } catch (e) {
      setError(ctl.signal.aborted ? "Stopped. Your previous plan is unchanged." : (e as Error).message);
    } finally {
      abortRef.current = null;
      setBusy(null);
    }
  }

  /* ---------- saving ---------- */
  /** Save preferences. With replan, also make a fresh plan for this week right away. */
  async function savePrefs(p: Preferences, replan: boolean) {
    const { error } = await supabase.from("preferences").upsert({ user_id: props.userId, ...p, updated_at: new Date().toISOString() });
    if (error) { setError("Couldn't save your preferences. Try again."); go("plan"); return; }
    setPrefs(p);
    if (replan || !plan) generate("fresh");
    else { flash("Saved. Your next plan will use these."); go("plan"); }
  }

  async function toggleChecked(key: string, on: boolean) {
    if (!plan) return;
    const checked = { ...plan.checked, [key]: on };
    setPlan({ ...plan, checked });
    await supabase.from("plans").update({ checked }).eq("id", plan.id);
  }

  async function saveKitchen(next: Kitchen) {
    setKitchen(next);
    const { error } = await supabase.from("kitchen").upsert({ user_id: props.userId, ...next, updated_at: new Date().toISOString() });
    flash(error ? "Couldn't save" : "Saved");
  }

  async function deleteEverything() {
    if (!confirm("Delete your preferences, plans, and leftovers? This can't be undone.")) return;
    await Promise.all([
      supabase.from("plans").delete().eq("user_id", props.userId),
      supabase.from("kitchen").delete().eq("user_id", props.userId),
      supabase.from("preferences").delete().eq("user_id", props.userId),
    ]);
    setPlan(null); setPrefs(null); setKitchen({ leftovers: [], extras: [] }); go("prefs");
  }

  return (
    <>
      <div className="wrap">
        <header className="top">
          <h1 className="mark">NOOSH</h1>
          <span className="weekpill">Week {plan?.week ?? 1}</span>
        </header>

        {view === "prefs" && <PrefsView initial={prefs ?? DEFAULT_PREFS} onSave={savePrefs} busy={!!busy} hasPlan={!!plan} />}

        {view === "plan" && (
          <section>
            {busy && (
              <div className="status" role="status">
                <Lantern />
                <h3>{busy === "next" ? "Planning around your leftovers…" : "Planning your week…"}</h3>
                <p className="muted">Choosing dinners that share ingredients. This can take up to a minute.</p>
                <button className="small-link" onClick={() => abortRef.current?.abort()}>Cancel</button>
              </div>
            )}
            {error && <div className="error" role="alert">{error}</div>}
            {saveMsg && !busy && <div className="toast" role="status">{saveMsg}</div>}
            {!busy && !plan && (
              <div className="empty">
                <h2>Ready for <em>this week?</em></h2>
                <p>I’ll plan your meals around shared ingredients, so you shop once and less goes to waste.</p>
                <button className="btn" onClick={() => (prefs ? generate("fresh") : go("prefs"))}>Plan my week</button>
                {prefs && (
                  <p className="saved-prefs">
                    Using your saved preferences · <button className="small-link inline" onClick={() => go("prefs")}>Edit</button>
                  </p>
                )}
              </div>
            )}
            {!busy && plan && (
              <PlanView row={plan} onCheck={toggleChecked} onDone={() => go("left")}
                onRedo={() => { if (confirm("Replace this week’s plan with a new one?")) generate("fresh"); }} />
            )}
          </section>
        )}

        {view === "left" && (
          <LeftoversView plan={plan?.plan ?? null} kitchen={kitchen} onChange={saveKitchen} saveMsg={saveMsg}
            busy={!!busy} onPlanNext={() => (prefs ? generate("next") : go("prefs"))} />
        )}

        <footer className="foot">
          <span className="muted">Signed in as {props.email}</span>
          <form action="/auth/signout" method="post"><button className="small-link">Sign out</button></form>
          <button className="small-link" onClick={deleteEverything}>Delete my data</button>
        </footer>
      </div>

      <nav className="tabs" aria-label="Sections">
        {([["plan", "This week"], ["left", "Leftovers"], ["prefs", "Preferences"]] as const).map(([v, label]) => (
          <button key={v} onClick={() => go(v)} aria-current={view === v ? "page" : undefined}><TabIcon view={v} />{label}</button>
        ))}
      </nav>
    </>
  );
}

/* ---------- Preferences tab ---------- */
const clean = (p: Preferences): Preferences => ({ ...p, goals: p.goals.trim(), avoid: p.avoid.trim(), notes: p.notes.trim() });

function PrefsView({ initial, onSave, busy, hasPlan }: {
  initial: Preferences; onSave: (p: Preferences, replan: boolean) => void; busy: boolean; hasPlan: boolean;
}) {
  const [p, setP] = useState(initial);
  const set = <K extends keyof Preferences>(k: K, v: Preferences[K]) => setP({ ...p, [k]: v });

  return (
    <section>
      <h2 className="page-title">Your <em>preferences</em></h2>
      <p className="muted">Tell me how you eat. These are saved, so you only set them once.</p>
      <label className="field" htmlFor="diet">Diet</label>
      <select id="diet" value={p.diet} onChange={(e) => set("diet", e.target.value)}>
        {DIETS.map((d) => <option key={d}>{d}</option>)}
      </select>

      <label className="field" htmlFor="goals">Health goals</label>
      <div className="hint">e.g. more protein, more vegetables, less processed food</div>
      <input id="goals" type="text" maxLength={300} value={p.goals} onChange={(e) => set("goals", e.target.value)} placeholder="High protein, lots of vegetables" />

      <label className="field" htmlFor="avoid">Ingredients to avoid</label>
      <div className="hint">Allergies, dislikes, or things you don’t eat</div>
      <input id="avoid" type="text" maxLength={300} value={p.avoid} onChange={(e) => set("avoid", e.target.value)} placeholder="Cilantro, seed oils" />

      <span className="field">Plan meals for</span>
      <div className="hint">Everything goes on one grocery list, so you shop once a week.</div>
      <div className="seg" role="group" aria-label="Meals to plan">
        {MEALS.map((m) => (
          <button key={m} type="button" aria-pressed={p.meals.includes(m)}
            onClick={() => {
              const next = p.meals.includes(m) ? p.meals.filter((x) => x !== m) : [...p.meals, m];
              if (next.length) set("meals", MEALS.filter((x) => next.includes(x)));
            }}>
            {MEAL_LABEL[m]}
          </button>
        ))}
      </div>

      <span className="field">Cooked dinners per week</span>
      <div className="seg" role="group" aria-label="Dinners per week">
        {[3, 4, 5].map((n) => (
          <button key={n} type="button" aria-pressed={p.dinners === n} onClick={() => set("dinners", n)}>{n}</button>
        ))}
      </div>

      <div className="row">
        <div>
          <label className="field" htmlFor="servings">People to feed</label>
          <select id="servings" value={p.servings} onChange={(e) => set("servings", +e.target.value)}>
            {[1, 2, 3, 4, 6].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="field" htmlFor="time">Max cook time</label>
          <select id="time" value={p.max_minutes} onChange={(e) => set("max_minutes", +e.target.value)}>
            <option value={20}>20 min</option><option value={30}>30 min</option>
            <option value={45}>45 min</option><option value={60}>1 hour</option>
          </select>
        </div>
      </div>

      <label className="field" htmlFor="notes">Anything else</label>
      <div className="hint">Cuisines you love, equipment you have, budget</div>
      <textarea id="notes" maxLength={600} value={p.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Love Thai and Mexican food. I have an air fryer." />

      {hasPlan ? (
        <div className="save-row">
          <button className="btn secondary" disabled={busy} onClick={() => onSave(clean(p), false)}>Save</button>
          <button className="btn" disabled={busy} onClick={() => onSave(clean(p), true)}>Save and re-plan this week</button>
        </div>
      ) : (
        <button className="btn" disabled={busy} onClick={() => onSave(clean(p), true)}>Save and plan my week</button>
      )}
      {hasPlan && <p className="hint center">“Save” keeps this week’s plan and uses your changes next time.</p>}
    </section>
  );
}

/* ---------- This week tab ---------- */
function PlanView({ row, onCheck, onDone, onRedo }: {
  row: PlanRow; onCheck: (key: string, on: boolean) => void; onDone: () => void; onRedo: () => void;
}) {
  const plan = row.plan;
  const keys = plan.grocery.flatMap((sec) => sec.items.map((it) => `${sec.section}|${it.name}`));
  const inBasket = keys.filter((k) => row.checked[k]).length;

  return (
    <div>
      <div className="glance">
        <div><b>{plan.recipes.length}</b><span>{plan.recipes.length === 1 ? "Meal" : "Meals"}</span></div>
        <div><b>{keys.length}</b><span>To buy</span></div>
        <div><b>{plan.already_have.length}</b><span>At home</span></div>
      </div>

      {plan.overview && (
        <div className="overview">
          <div className="eyebrow">This week’s thread</div>
          <p>{plan.overview}</p>
        </div>
      )}

      {MEALS.map((meal) => {
        const list = plan.recipes.filter((r) => (r.meal ?? "dinner") === meal);
        if (!list.length) return null;
        return (
          <div key={meal}>
            <div className="meal-head">
              <span className="meal-icon"><MealIcon meal={meal} /></span>
              <h2>{MEAL_LABEL[meal]}</h2>
              <span className="meal-count">{mealCount(meal, list.length)}</span>
            </div>
            {list.map((r) => (
              <details className="recipe" key={r.id}>
                <summary>
                  <div>
                    <h3>{r.name}</h3>
                    {r.why && <div className="rmeta">{r.why}</div>}
                    <div className="chips-row">
                      <span className="tag">⏱ {r.minutes} min</span>
                      {r.ingredients.length > 0 && <span className="tag">{r.ingredients.length} ingredients</span>}
                      {r.ingredients.some((i) => i.from_kitchen) && <span className="tag warm">uses leftovers</span>}
                    </div>
                  </div>
                  <svg className="chev" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <div className="rbody">
                  <div className="label">You’ll need</div>
                  <ul>
                    {r.ingredients.map((i, k) => (
                      <li key={k}>{i.amount} {i.item}{i.from_kitchen && <span className="tag warm small">leftover</span>}</li>
                    ))}
                  </ul>
                  <div className="label">Steps</div>
                  <ol>{r.steps.map((st, k) => <li key={k}>{st}</li>)}</ol>
                </div>
              </details>
            ))}
          </div>
        );
      })}

      <h2>Grocery <em>list</em></h2>
      <div className="progress" role="status">
        <div className="progress-row"><span>{inBasket} of {keys.length} in your basket</span><span className="muted-in">One shop</span></div>
        <div className="bar"><i style={{ width: `${keys.length ? (inBasket / keys.length) * 100 : 0}%` }} /></div>
      </div>
      <ShareList row={row} />
      {plan.grocery.map((sec) => (
        <div className="sec" key={sec.section}>
          <div className="section-name">{sec.section}</div>
          {sec.items.map((it) => {
            const key = `${sec.section}|${it.name}`;
            const done = !!row.checked[key];
            const uses = it.used_in.length;
            return (
              <label className={`item${done ? " done" : ""}`} key={key}>
                <input type="checkbox" checked={done} onChange={(e) => onCheck(key, e.target.checked)} />
                <span className="name">{it.name}{uses > 1 && <span className="uses"> · {uses} meals</span>}</span>
                <span className="qty">{it.amount}</span>
              </label>
            );
          })}
        </div>
      ))}

      {plan.already_have.length > 0 && (
        <div className="sec">
          <div className="section-name">Already at home</div>
          {plan.already_have.map((h) => (
            <div className="item" key={h.name}><span className="name">{h.name}</span><span className="tag warm">use first</span></div>
          ))}
        </div>
      )}

      <button className="btn secondary" onClick={onDone}>Week’s done: log leftovers</button>
      <button className="small-link" onClick={onRedo}>Not feeling it? Re-plan this week</button>
    </div>
  );
}

/** Turn the grocery list into plain text: only what's still to buy, grouped by aisle. */
function groceryText(row: PlanRow) {
  const left = (sec: PlanRow["plan"]["grocery"][number]) => sec.items.filter((it) => !row.checked[`${sec.section}|${it.name}`]);
  const anyLeft = row.plan.grocery.some((sec) => left(sec).length);
  const lines = [`NOOSH · Week ${row.week} grocery list`];
  for (const sec of row.plan.grocery) {
    const items = anyLeft ? left(sec) : sec.items;
    if (!items.length) continue;
    lines.push("", sec.section.toUpperCase(), ...items.map((it) => `☐ ${it.name}${it.amount ? ` (${it.amount})` : ""}`));
  }
  if (row.plan.already_have.length) lines.push("", `Already at home: ${row.plan.already_have.map((h) => h.name).join(", ")}`);
  return lines.join("\n");
}

/** "Share list": the phone's share sheet where available, otherwise copy to the clipboard. */
function ShareList({ row }: { row: PlanRow }) {
  const [msg, setMsg] = useState("");
  async function share() {
    const text = groceryText(row);
    try {
      if (navigator.share) {
        await navigator.share({ title: "NOOSH grocery list", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setMsg("Copied. Paste it into Notes, a text, or your grocery app.");
    } catch (e) {
      if ((e as Error).name === "AbortError") return; // they closed the share sheet
      try { await navigator.clipboard.writeText(text); setMsg("Copied to your clipboard."); }
      catch { setMsg("Couldn’t share from this browser. Try another browser or take a screenshot."); }
    }
    setTimeout(() => setMsg(""), 4000);
  }
  return (
    <div className="share">
      <button className="btn secondary share-btn" onClick={share}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 15V3M8 7l4-4 4 4" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
        </svg>
        Share list
      </button>
      {msg && <div className="share-msg" role="status">{msg}</div>}
    </div>
  );
}

function mealCount(meal: Meal, n: number) {
  if (meal === "dinner") return `${n} ${n === 1 ? "night" : "nights"}`;
  if (meal === "snack") return `${n} ${n === 1 ? "idea" : "ideas"}`;
  return `${n} on rotation`;
}

/** Small line icons: a rising sun, a bowl, a crescent moon, a fig. */
function MealIcon({ meal }: { meal: Meal }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {meal === "breakfast" && <><circle cx="12" cy="14" r="4.5" /><path d="M3 19h18M12 4.5v2M5.2 7.7l1.4 1.4M18.8 7.7l-1.4 1.4" /></>}
      {meal === "lunch" && <><path d="M3 11h18c0 5-4 8-9 8s-9-3-9-8z" /><path d="M8 7c0-1.5 1-1.5 1-3M12 7c0-1.5 1-1.5 1-3M16 7c0-1.5 1-1.5 1-3" /></>}
      {meal === "dinner" && <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" />}
      {meal === "snack" && <><path d="M12 6c-4 2-6 6-5 10s5 5 7 3 3-6 1-10c-1-2-2-3-3-3z" /><path d="M12 6c0-1 .5-2 1.5-2.5" /></>}
    </svg>
  );
}

/** Bottom tab icons: an arch, a jar, sliders. */
function TabIcon({ view }: { view: View }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {view === "plan" && <><path d="M5 21V10c0-4 3-7 7-8 4 1 7 4 7 8v11z" /><path d="M9 21v-6h6v6" /></>}
      {view === "left" && <><rect x="6" y="7" width="12" height="14" rx="3" /><path d="M8 3h8v4H8zM9 13h6" /></>}
      {view === "prefs" && <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>}
    </svg>
  );
}

/* ---------- Leftovers tab ---------- */
function LeftoversView({ plan, kitchen, onChange, saveMsg, busy, onPlanNext }: {
  plan: MealPlan | null; kitchen: Kitchen; onChange: (k: Kitchen) => void; saveMsg: string; busy: boolean; onPlanNext: () => void;
}) {
  const [draft, setDraft] = useState("");
  const items = useMemo(() => {
    if (!plan) return [];
    const set = new Set<string>();
    plan.grocery.forEach((s) => s.items.forEach((i) => set.add(i.name)));
    plan.already_have.forEach((h) => set.add(h.name));
    return [...set];
  }, [plan]);

  function toggle(n: string) {
    const has = kitchen.leftovers.includes(n);
    onChange({ ...kitchen, leftovers: has ? kitchen.leftovers.filter((x) => x !== n) : [...kitchen.leftovers, n] });
  }
  function add() {
    const fresh = draft.split(",").map((s) => s.trim()).filter((s) => s && !kitchen.extras.includes(s));
    setDraft("");
    if (fresh.length) onChange({ ...kitchen, extras: [...kitchen.extras, ...fresh] });
  }

  return (
    <section>
      <h2 className="page-title">What’s <em>left?</em></h2>
      <p className="muted">Tap anything you still have. Next week’s plan will use these first and leave them off the grocery list.</p>
      {items.length ? (
        <>
          <h2>From this week</h2>
          <div className="chips">
            {items.map((n) => (
              <button key={n} type="button" className="chip pick" aria-pressed={kitchen.leftovers.includes(n)} onClick={() => toggle(n)}>{n}</button>
            ))}
          </div>
        </>
      ) : (
        <div className="empty"><p>Plan a week first, then come back here when it’s over.</p></div>
      )}

      <h2>Anything else in your fridge or pantry</h2>
      <div className="addrow">
        <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="e.g. half a cabbage, frozen peas"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button type="button" onClick={add}>Add</button>
      </div>
      <div className="chips">
        {kitchen.extras.map((n) => (
          <button key={n} type="button" className="chip extra" aria-label={`Remove ${n}`}
            onClick={() => onChange({ ...kitchen, extras: kitchen.extras.filter((x) => x !== n) })}>{n} <span aria-hidden="true">✕</span></button>
        ))}
      </div>
      <div className="saved" aria-live="polite">{saveMsg}</div>
      <button className="btn" disabled={busy} onClick={onPlanNext}>Plan next week with these</button>
    </section>
  );
}

/* ---------- small artwork ---------- */
/** A brass lantern that glows while a plan is being made. */
function Lantern() {
  return (
    <svg className="lantern" viewBox="-30 -34 60 76" aria-hidden="true">
      <defs>
        <radialGradient id="lanternGlow"><stop offset="0" stopColor="#FFE3A6" stopOpacity=".6" /><stop offset="1" stopColor="#FFE3A6" stopOpacity="0" /></radialGradient>
      </defs>
      <circle className="glow" cy="8" r="30" fill="url(#lanternGlow)" />
      <line x1="0" y1="-34" x2="0" y2="-18" stroke="#9C7430" strokeWidth="1.2" />
      <path d="M-5-18h10l3 5h-16z" fill="#9C7430" />
      <path d="M-9-13h18c3 9 3 17 0 24h-18c-3-7-3-15 0-24z" fill="#C99A45" />
      <g fill="#FFF0C8"><circle cy="-7" r="1.5" /><circle cx="-4" cy="-1" r="1.2" /><circle cx="4" cy="-1" r="1.2" /><circle cy="5" r="1.3" /></g>
      <path d="M-6 11h12l-4 5h-4z" fill="#9C7430" />
    </svg>
  );
}
