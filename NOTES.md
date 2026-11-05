# Build notes

A running log of decisions and problems solved. Useful for interviews: each entry is a "why did you…" answer.

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
