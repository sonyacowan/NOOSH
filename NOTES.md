# Build notes

A running log of decisions and problems solved. Useful for interviews: each entry is a "why did you…" answer.

## 2026-11 · Landing page, round 2: chocolate riad

- **Iterated through boho (ivory, embroidered vine) and two Moroccan takes** (tiled horseshoe arch; riad window / zellige courtyard) before landing on **rich chocolate with brass and gold**, keeping Moroccan details subtle: a pointed arch with double gold line, faint lattice that fades toward the center, a brass lantern glow, and star dividers.
- **Dropped an early four-petal pattern** because it read too much like a famous fashion monogram. Brand originality matters.
- **The landing now matches the cocoa app,** so signing in feels continuous.
- **Worked on a preview branch** (`landing-chocolate`) so the design could be checked at a real URL before going live.
- **Bug fixed:** a background noise texture showed seams on wide screens; SVG `stitchTiles` makes the tile edges match.

## 2026-11 · Landing page

- **Goal:** exciting and enticing, luxurious yet clean and easy to use. Inspired by artisanal, bohemian-luxury fashion sites: warm ivory, terracotta and ochre, folk-embroidery details, arched shapes, botanical motifs.
- **Copy is about relief:** "Dinner, decided. Nothing wasted." Benefits focus on less mental effort, fitting your goals, and using what you have. "No password" and "free" sit under the button to remove sign-up hesitation.
- **Illustrations are code (SVG),** not image files: crisp on any screen, tiny to download, easy to recolor.
- **Two sign-up forms** (top and bottom of the page) share one state, so the "Check your email" message appears in both.
- **Ivory landing, cocoa app:** a bright entrance into the cozy app. Contrast checked; terracotta is only used for large text.

## 2026-11 · AI provider: Gemini free tier, Claude-ready

- **Started on Google Gemini's free tier** to keep running costs at $0 while testing with friends. Trade-offs accepted: daily usage limits, and free-tier data may be used by Google to improve its products.
- **Made the AI swappable.** `src/lib/ai.ts` exposes one function, `generateMealPlan()`. It uses Gemini if `GEMINI_API_KEY` is set, otherwise Claude. Switching providers is a settings change, not a code change.
- **One schema, validated twice.** The same Zod schema is sent to the AI (as JSON Schema) and used to check the answer before saving. AI output is never trusted blindly.
- **Problem solved (first live test):** planning failed with HTTP 503 "model is experiencing high demand". Free-tier models get deprioritized under load. Added retries with increasing pauses, then a fallback to the lighter Flash-Lite model, and a clear "Gemini is busy" message if all attempts fail. Verified the retry order against a fake local Gemini server returning 503/404 responses.
- **Problem solved:** Zod's "whole number" type produced a ±9-quadrillion range in the JSON Schema, which strict AI schema parsers can reject; simplified the field and stripped schema keywords Gemini doesn't need.

## 2026-11 · Rename and redesign

- **Name: Barakat → Noosh.** From *noosh-e jan* ("may it nourish your soul", the Persian "bon appétit"). Short, warm, about food. "Barakat" was also used by an Iranian state-linked foundation and a vaccine; "Joon" was considered but is used by many brands.
- **Design: "grounded & composed".** Explored two rounds of mockups (light palettes, then rich patterned dark themes) before settling on something cleaner: deep cocoa background, chocolate `#362825` cards, one slate `#869498` accent, cream text. One reading font (Manrope) and a serif (Instrument Serif) only for headings. Lesson: decoration competed with usability; restraint read as more premium.
- **Accessibility checks:** text/background contrast measured against WCAG AA (4.5:1 for body text).

## 2026-11 · v1: from Claude artifact to a real web app

**Starting point.** A single HTML file running as a Claude artifact. AI and storage went through the user's Claude account, so only Claude users could use it.

**Decisions**

- **API key stays on the server.** The browser calls our own `/api/plan` route, and only that route talks to Claude. Anyone can read the code that runs in a browser, so a key there would be stolen.
- **Structured outputs instead of "please reply in JSON".** The old version asked for JSON and checked the shape afterwards. Now the plan schema is written once in Zod and sent to the API, which guarantees a matching response. The same schema gives TypeScript types for the UI.
- **Row Level Security (RLS).** Every table has a policy `auth.uid() = user_id`, so the database rejects any attempt to read another user's rows, even if the app has a bug. That's why the browser can safely talk to Supabase directly.
- **Magic-link sign-in.** No passwords to store, reset, or leak.
- **Keep every plan.** A `plans` table (newest row = this week) instead of overwriting one record. Recipe history comes for free, and "don't repeat recent dinners" is a query.
- **Daily limit of 8 plans per user.** Each plan is a paid API call; the cap protects against runaway costs.
- **Stop button cancels the API call.** The browser's abort signal is passed through to the Claude request, so we don't pay for plans nobody will see.

**Problems solved**

- *Loading flash:* the home page loads the user's data on the server before sending HTML, so it appears instantly.
