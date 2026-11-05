# Barakat

**Weekly dinners planned around shared ingredients and last week's leftovers, so less food goes to waste.**

*Barakat* (Persian/Arabic: blessing, abundance) comes from the tradition of not wasting food.

## What it does

1. **Preferences:** set your diet, health goals, ingredients to avoid, dinners per week, servings, and max cook time once.
2. **Weekly plan:** Claude picks recipes that deliberately share perishable ingredients (herbs, greens, half-used vegetables), then builds one grocery list grouped by store section. Dots show how many dinners use each item.
3. **Leftovers:** at the end of the week, tap what's left and add anything else in your fridge.
4. **Next week:** the new plan uses leftovers first, keeps them off the grocery list, and avoids repeating recent dinners.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| App | [Next.js](https://nextjs.org) 15 (App Router, TypeScript) | Pages and server API in one project |
| Auth + database | [Supabase](https://supabase.com) (Postgres) | Email sign-in and Row Level Security on the free tier |
| AI | [Claude API](https://docs.claude.com) with structured outputs | The response is guaranteed to match the plan schema |
| Hosting | [Vercel](https://vercel.com) | Zero-config deploys from GitHub |

## How it works

```
Browser (App.tsx) ──reads/writes own rows──▶ Supabase (RLS enforces per-user access)
      │
      └── POST /api/plan ──▶ server route ──▶ Claude API (schema-constrained JSON)
                                   └──────────▶ saves plan to Supabase
```

- `src/app/App.tsx`: the three tabs (This week, Leftovers, Preferences)
- `src/app/api/plan/route.ts`: loads preferences, leftovers, and recent dinners, calls Claude, and saves the plan
- `src/lib/types.ts`: the meal-plan schema (Zod), shared by the AI call and the UI
- `src/lib/prompt.ts`: the planning instructions
- `supabase/schema.sql`: tables and security policies

## Run it locally

1. Create a free [Supabase](https://supabase.com) project. In **SQL Editor**, run `supabase/schema.sql`.
2. Get an API key from the [Anthropic Console](https://console.anthropic.com).
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
