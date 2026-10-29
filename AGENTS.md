# AGENTS.md

Instructions for every AI coding agent working in this repo (Cursor, Claude Code, Codex and others).

## Project in one line

- **Stamp** gives AI-agent developers an OAuth readiness report for any app: how hard, how long, what blocks approval, and what an agent can do.
- Every claim in a guide is labelled Tested, Sourced or Uncertain, with its source.

---

## Read before you code

| If you are working on | Read first |
| --- | --- |
| Anything, for the first time | `docs/problem.md`, `docs/solution.md` |
| A feature | `docs/features.md`, `docs/flow.md` |
| The web app | `docs/design-system.md`, `docs/product-architecture.md` |
| An API route | `docs/api-design.md` |
| The database | `docs/db-schema-design.md` |
| The agent | `docs/agent-architecture.md` |
| A trade-off | `docs/design-decisions.md` |
| Tools or layout | `docs/tech-stack.md`, `docs/folder-structure.md` |

`docs/` is the source of truth. If the code and a doc disagree, ask before changing either.

---

## Repo layout

| Path | What it is |
| --- | --- |
| `apps/web` | React + Vite UI, deployed to Vercel |
| `apps/api` | Express API + LangGraph agent + Prisma, deployed to Railway |
| `packages/schema` | `@stamp/schema`: Zod schemas and types shared by both apps |
| `packages/typescript-config` | `@stamp/typescript-config`: shared tsconfig |
| `packages/eslint-config` | `@stamp/eslint-config`: shared lint rules |
| `docs/` | Product and technical docs |
| `.cursor/rules/` | Coding rules (see below) |

---

## Commands

| Task | Command |
| --- | --- |
| Install | `pnpm install` |
| Run everything | `pnpm dev` |
| Build | `pnpm build` |
| Test | `pnpm test` |
| Lint | `pnpm lint` |
| Run one workspace | `pnpm --filter api dev` |
| Add a dependency | `pnpm --filter <workspace> add <pkg>` |
| Migrate the database | `pnpm --filter api db:migrate` |
| Seed library guides | `pnpm --filter api db:seed` |
| Eval reliability (prints the cost estimate; add `--confirm` to run, `--repeat 3` to see the spread) | `pnpm --filter api eval -- --set tuning` |
| Score a saved eval run again with the current golden set (free) | `pnpm --filter api eval:rescore -- <run folder>` |

Use pnpm only. Never use npm or yarn.

---

## Coding rules

All rules live in `.cursor/rules/`. Read the files that match the code you touch.

| Area | Rule files | Applies to |
| --- | --- | --- |
| Global | `global/typescript-style.mdc`, `global/monorepo-packages.mdc`, `global/secrets-evidence.mdc`, `global/code-structure.mdc` | Everything |
| Testing | `global/testing.mdc` | Test files |
| Web | `web/structure-data.mdc`, `web/design-system.mdc`, `web/accessibility-copy.mdc`, `web/hooks.mdc` | `apps/web` |
| API | `api/routes-errors.mdc`, `api/services-utils.mdc`, `api/database.mdc`, `api/streaming-guardrails.mdc` | `apps/api` |
| Agent | `agent/graph-budgets.mdc`, `agent/evidence-scoring.mdc`, `agent/prompts-safety.mdc` | `apps/api/src/agent` |

### Non-negotiables

1. Never invent a provider fact. Every fact needs a source URL and a verbatim quote, or it is Uncertain.
2. Never commit secrets. Only `apps/api` holds API keys.
3. Shared types come only from `@stamp/schema`.
4. Every code file starts with a header comment: purpose, exports, used by.
5. Files stay at 200 lines or fewer; 300 is the absolute maximum.
6. Repeated code becomes a helper or util on its second use.
7. Plain functions and composition. No heavy design patterns.
8. Only code sets evidence labels and difficulty scores. The AI model never does.
9. Never build anything on the Won't list in `docs/features.md`.

---

## How to do a task

1. Read the matching doc and rule files.
2. State a short plan: files to touch, and why.
3. Make the smallest change that solves the task.
4. Add or update tests for any logic you change.
5. Run `pnpm test` and `pnpm lint`.
6. Update the matching doc if behaviour changed.
7. Commit with a conventional message: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.

---

## Definition of done

- [ ] Tests and lint pass
- [ ] Every new file has a header comment and stays within 200 lines
- [ ] No duplicated logic; helpers reused
- [ ] Types come from `@stamp/schema`
- [ ] Loading, empty, error and partial states handled (UI work)
- [ ] Docs updated if behaviour changed
- [ ] No secrets, no `console.log`, no commented-out code

---

## Stop and ask before you

- Change `packages/schema` (both apps depend on it)
- Change `apps/api/prisma/schema.prisma` or add a migration
- Add a stage, edge or AI model call to the agent graph
- Add a new dependency or a new package
- Write or change any provider fact in a library guide
