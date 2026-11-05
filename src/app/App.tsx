"use client";
// The interactive app: three tabs (This week, Leftovers, Preferences).
// "use client" means this code runs in the browser, so it can respond to taps.
// It reads and writes the database directly; Row Level Security keeps it to this user's rows.
import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_PREFS, type MealPlan, type PlanRow, type Preferences } from "@/lib/types";

type View = "plan" | "left" | "prefs";
type Kitchen = { leftovers: string[]; extras: string[] };

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
    saveTimer.current = setTimeout(() => setSaveMsg(""), 1500);
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
  async function savePrefs(p: Preferences) {
    const { error } = await supabase.from("preferences").upsert({ user_id: props.userId, ...p, updated_at: new Date().toISOString() });
    if (error) { setError("Couldn't save your preferences. Try again."); go("plan"); return; }
    setPrefs(p);
    generate("fresh");
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
          <h1>Barakat</h1>
          <span className="weekpill">Week {plan?.week ?? 1}</span>
        </header>

        {view === "prefs" && <PrefsView initial={prefs ?? DEFAULT_PREFS} onSave={savePrefs} busy={!!busy} />}

        {view === "plan" && (
          <section>
            {busy && (
              <div className="status">
                <p><span className="pulse" />{busy === "next" ? "Planning around your leftovers…" : "Planning your week…"}</p>
                <p className="muted" style={{ margin: 0 }}>This usually takes under a minute.</p>
                <button className="btn secondary" onClick={() => abortRef.current?.abort()}>Stop</button>
              </div>
            )}
            {error && <div className="error" role="alert">{error}</div>}
            {!busy && !plan && (
              <div className="empty">
                <h3>No plan yet</h3>
                <p>I’ll pick recipes that share ingredients so less goes to waste.</p>
                <button className="btn" onClick={() => (prefs ? generate("fresh") : go("prefs"))}>Plan my week</button>
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
          <button key={v} onClick={() => go(v)} aria-current={view === v ? "page" : undefined}>{label}</button>
        ))}
      </nav>
    </>
  );
}

/* ---------- Preferences tab ---------- */
function PrefsView({ initial, onSave, busy }: { initial: Preferences; onSave: (p: Preferences) => void; busy: boolean }) {
  const [p, setP] = useState(initial);
  const set = <K extends keyof Preferences>(k: K, v: Preferences[K]) => setP({ ...p, [k]: v });

  return (
    <section>
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

      <span className="field">Dinners per week</span>
      <div className="seg" role="group" aria-label="Dinners per week">
        {[3, 4, 5].map((n) => (
          <button key={n} type="button" aria-pressed={p.dinners === n} onClick={() => set("dinners", n)}>{n}</button>
        ))}
      </div>

      <div className="row">
        <div>
          <label className="field" htmlFor="servings">Servings per meal</label>
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

      <button className="btn" disabled={busy}
        onClick={() => onSave({ ...p, goals: p.goals.trim(), avoid: p.avoid.trim(), notes: p.notes.trim() })}>
        Save and plan my week
      </button>
    </section>
  );
}

/* ---------- This week tab ---------- */
function PlanView({ row, onCheck, onDone, onRedo }: {
  row: PlanRow; onCheck: (key: string, on: boolean) => void; onDone: () => void; onRedo: () => void;
}) {
  const plan = row.plan;
  const names = Object.fromEntries(plan.recipes.map((r) => [r.id, r.name]));

  return (
    <div>
      {plan.overview && <div className="note">{plan.overview}</div>}

      <h2>Dinners</h2>
      {plan.recipes.map((r) => (
        <details className="recipe" key={r.id}>
          <summary>
            <div>
              <h3>{r.name}</h3>
              <div className="rmeta">{r.minutes} min{r.why ? ` · ${r.why}` : ""}</div>
            </div>
            <span className="chev" aria-hidden="true">›</span>
          </summary>
          <div className="rbody">
            <ul>
              {r.ingredients.map((i, k) => (
                <li key={k}>{i.amount} {i.item}{i.from_kitchen && <span className="lefttag">leftover</span>}</li>
              ))}
            </ul>
            <ol>{r.steps.map((s, k) => <li key={k}>{s}</li>)}</ol>
          </div>
        </details>
      ))}

      <h2>Grocery list</h2>
      <div className="legend"><span className="overlap"><i /><i /></span> dots show how many dinners use an item</div>
      {plan.grocery.map((sec) => (
        <div key={sec.section}>
          <div className="section-name">{sec.section}</div>
          {sec.items.map((it) => {
            const key = `${sec.section}|${it.name}`;
            const done = !!row.checked[key];
            const uses = it.used_in.length;
            return (
              <label className={`item${done ? " done" : ""}`} key={key}>
                <input type="checkbox" checked={done} onChange={(e) => onCheck(key, e.target.checked)} />
                <span className="name">
                  {it.name}
                  {uses > 1 && (
                    <span className="overlap" title={`Used in ${it.used_in.map((id) => names[id]).filter(Boolean).join(", ")}`}>
                      {Array.from({ length: Math.min(uses, 5) }, (_, k) => <i key={k} />)}
                    </span>
                  )}
                </span>
                <span className="qty">{it.amount}</span>
              </label>
            );
          })}
        </div>
      ))}

      {plan.already_have.length > 0 && (
        <>
          <div className="section-name">Already in your kitchen</div>
          {plan.already_have.map((h) => (
            <div className="item" key={h.name}><span className="name">{h.name}</span><span className="lefttag">use first</span></div>
          ))}
        </>
      )}

      <button className="btn secondary" onClick={onDone}>Week’s done: log leftovers</button>
      <button className="small-link" onClick={onRedo}>Not feeling it? Re-plan this week</button>
    </div>
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
      <p className="muted">Tap anything you still have. Next week’s plan will use these first and leave them off the grocery list.</p>
      {items.length ? (
        <>
          <h2>From this week</h2>
          <div className="chips">
            {items.map((n) => (
              <button key={n} type="button" className="chip" aria-pressed={kitchen.leftovers.includes(n)} onClick={() => toggle(n)}>{n}</button>
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
          <button key={n} type="button" className="chip" aria-pressed="true" aria-label={`Remove ${n}`}
            onClick={() => onChange({ ...kitchen, extras: kitchen.extras.filter((x) => x !== n) })}>{n} ✕</button>
        ))}
      </div>
      <div className="saved" aria-live="polite">{saveMsg}</div>
      <button className="btn" disabled={busy} onClick={onPlanNext}>Plan next week with these</button>
    </section>
  );
}
