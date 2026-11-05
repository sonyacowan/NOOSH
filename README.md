# Noosh

**Your week of meals and one grocery list for a single shop, planned around your goals and what's already in your kitchen.**

*Noosh* comes from the Persian *noosh-e jan*: "may it nourish your soul", said before a meal.

## What it does

1. **Preferences:** choose which meals to plan (breakfast, lunch, dinner, snacks) and set your diet, health goals, ingredients to avoid, servings, and cook time once.
2. **Weekly plan:** the AI picks recipes that deliberately share perishable ingredients (herbs, greens, half-used vegetables), turns dinner leftovers into lunches, and builds one grocery list grouped by store section, so you shop once. Dots show how many recipes use each item.
3. **Leftovers:** at the end of the week, tap what's left and add anything else in your fridge.
4. **Next week:** the new plan uses leftovers first, keeps them off the grocery list, and avoids repeating recent dinners.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| App | [Next.js](https://nextjs.org) 15 (App Router, TypeScript) | Pages and server API in one project |
| Auth + database | [Supabase](https://supabase.com) (Postgres) | Email sign-in and Row Level Security on the free tier |
| AI | [Google Gemini](https://ai.google.dev) (free tier) or [Claude](https://docs.claude.com) | Structured JSON output, validated against one shared schema |
| Hosting | [Vercel](https://vercel.com) | Zero-config deploys from GitHub |

## How it works

```
Browser (App.tsx) ──reads/writes own rows──▶ Supabase (RLS enforces per-user access)
      │
      └── POST /api/plan ──▶ server route ──▶ Claude API (schema-constrained JSON)
                                   └──────────▶ saves plan to Supabase
```

- `src/app/App.tsx`: the three tabs (This week, Leftovers, Preferences)
- `src/app/api/plan/route.ts`: loads preferences, leftovers, and recent dinners, asks the AI for a plan, and saves it
- `src/lib/ai.ts`: talks to Gemini or Claude, whichever key is set
- `src/lib/types.ts`: the meal-plan schema (Zod), shared by the AI call and the UI
- `src/lib/prompt.ts`: the planning instructions
- `supabase/schema.sql`: tables and security policies

## Run it locally

1. Create a free [Supabase](https://supabase.com) project. In **SQL Editor**, run `supabase/schema.sql`.
2. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com) (or an Anthropic key from the [Console](https://console.anthropic.com)).
3. Copy `.env.example` to `.env.local` and fill in the values.
4. In Supabase, open **Authentication → URL Configuration** and add `http://localhost:3000/auth/callback` to the redirect URLs.
5. Run:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Roadmap

- [ ] Favorites and recipe history
- [ ] Shareable grocery list
- [ ] Fridge photo to log leftovers
- [ ] Nutrition info
- [ ] Household sharing
