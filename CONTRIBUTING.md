# Contributing

## Git workflow

- **Branches:** open a feature branch from `main`, open a **Pull Request** for review, merge when CI is green.
- **Commits:** short, imperative subject (e.g. `Add admin phone search`), optional body for *why* when it is not obvious.

## CI

GitHub Actions runs **lint** and **production build** on every push and PR to `main` (see `.github/workflows/ci.yml`).

## Branch protection (GitHub UI)

In the repo: **Settings → Branches → Add rule** (or edit the rule for `main`):

1. **Require a pull request before merging** — and optionally require approvals.
2. **Require status checks to pass** — enable **CI / lint-and-build** (after the workflow has run at least once on the default branch).
3. **Do not allow bypassing** the above for admins if you want the rule to apply to everyone.

## Environment variables

| Variable | Where | Notes |
|----------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local`, Vercel | Public URL; safe to expose to the browser. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable key aliases in code) | `.env.local`, Vercel | Public anon/publishable key; RLS applies. |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local`, **Vercel server env only** | **Never** `NEXT_PUBLIC_*`. Bypasses RLS — only for trusted server code (e.g. `lib/supabase/service-role.ts`, server actions). |

See `.env.example` for names only. Real secrets belong in **Vercel → Project → Settings → Environment Variables** (Production / Preview as needed), not in git.
