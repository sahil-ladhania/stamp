# Schema design

## TL;DR

- **Shared contract:** `@stamp/schema` — Guide, Claim, API bodies, stream events, wire enums.
- **API only:** env config, graph state, draft claims, extraction outputs, Prisma mappers.
- **Web only:** timeline status, toast, theme, route params.
- **Wire:** lowercase snake_case domain enums; UPPER_SNAKE error codes; ISO date strings; strict objects on input.

---

## 1. Data flow

1. Developer sends an app name via `POST /api/runs` → cached slug or `runId` → guide at `GET /api/guides/:slug`.
2. Live run: nine fixed stages; model outputs draft facts (quote + URL, no label); code verifies and labels.
3. Guide stored as one JSON column plus run row; difficulty scored by code only.
4. SSE carries progress; reconnect uses run snapshot (optional `run.snapshot` event first).
5. Web renders Guide; local view state only (timeline, theme, toasts).

---

## 2. Where types live

| Location | When |
| --- | --- |
| `packages/schema` | Crosses the network, stored as guide JSON, or both apps must agree |
| `apps/api` | Server-only: config, agent, mappers, Prisma mapping |
| `apps/web` | UI-only: view state, not on the wire |
| Prisma generated | Never hand-duplicate; map in `apps/api/src/mappers/` |

---

## 3. Inventory

### 3.1 Shared enums and constants

| Name | Wire values | Notes |
| --- | --- | --- |
| EvidenceLabel | `tested`, `sourced`, `uncertain` | Never on model extraction schema |
| Archetype | `instant`, `hidden_limits`, `review`, `partner_gated`, `enterprise`, `unknown` | |
| GuideMode | `library`, `live` | |
| Actor | `agent`, `human`, `agent_assist` | |
| SourceTier | `official`, `third_party`, `forum` | |
| RunStatus | `running`, `done`, `partial`, `failed` | |
| RunErrorCode | `AMBIGUOUS_APP`, `NOT_OAUTH`, `NO_PUBLIC_DOCS`, `INTERNAL` | UPPER_SNAKE |
| ApiErrorCode | `VALIDATION_ERROR`, `NOT_FOUND`, `RATE_LIMITED`, `RUN_CAP_REACHED`, `INTERNAL` | UPPER_SNAKE |
| DowngradeReason | `quote_not_found`, `sources_disagree`, `stale_source`, `schema_failed`, `time_budget` | Stream `claim.downgraded` |
| GuideCoverage | `full`, `partial` | On Guide |
| StageId | `0`–`8` + names | `constants.ts` |
| SCHEMA_VERSION | `1` | On Guide |

Prisma-only (no `@stamp/schema` unless API exposes log): `CheckMethod`, `CheckResult`.

### 3.2 Guide document

| Type | Fields (summary) |
| --- | --- |
| Source | `url`, `quote`, `tier`, optional `retrievedAt` |
| Claim | `id`, `text`, `label`, `sources[]` (empty only when the label is `uncertain`) |
| Verdict | `summary` Claim, `nextStepId`, `topBlockerId` |
| Milestones | `firstTest`, `production` — each `{ effort, wait }` Claims |
| Requirements | Claim[] |
| Scope | `id`, `name`, `reason` Claim |
| Step | `id`, `title`, `detail`, `actor`, `effort` |
| Blocker | `id`, `symptom`, `cause`, `fix`, `contact` (Claim or null) |
| Limits | Claim[] |
| Conflict | `id`, `topic`, two Sources, `preferredUrl`, `reason` Claim |
| DifficultyBreakdown | factor ints + `total` 0–9 + `score` 1–5 (band-checked) |
| GlossaryEntry | optional on Guide: `term`, `plain`, `composioTerm` |
| Guide | identity + sections + `schemaVersion`, `coverage` |
| GuideSummary | list row: slug, appName, archetype, difficulty, mode, asOf |

Claim id pattern: `section.index` or `section.index.field` (e.g. `steps.5`, `blockers.2.symptom`).

### 3.3 HTTP and stream

See [api-design.md](./api-design.md). Extensions documented here:

- `RunSnapshot.errorCode` optional (`RunErrorCode`).
- Stream payload discriminator: `type` (matches SSE `event:` line).
- First SSE message: `run.snapshot` with snapshot body.

### 3.4 API-only

EnvConfig, AppIdentity, PlannedQuery, SearchResult, PageRecord, Budget, GraphState, DraftClaim, section extraction schemas, AgentFailure, mappers.

### 3.5 Web-only

TimelineStageStatus, Toast, Theme, RouteParams, MockScenario (if mocks exist).

---

## 4. Package layout (`packages/schema/src/`)

| File | Concern |
| --- | --- |
| `enums.ts`, `constants.ts` | Wire enums and stage list |
| `claim.ts` | Source, Claim |
| `guide/*` | Sections, Guide, GuideSummary |
| `api/runs.ts`, `api/guides.ts` | REST bodies |
| `events.ts`, `errors.ts` | SSE + API error shape |
| `index.ts` | Re-exports |

---

## 5. API layout

| Path | Role |
| --- | --- |
| `src/config.ts` | Env Zod |
| `src/mappers/enum-wire.ts` | Prisma ↔ wire case |
| `src/mappers/guide-mapper.ts`, `run-mapper.ts`, `page-mapper.ts` | Rows → shared types |
| `src/agent/*` | Graph state, draft, extraction, `toLabelledClaim` |

---

## 6. Mapping rules

- Enum case: single file `enum-wire.ts`.
- Dates: `Date` → ISO string on wire.
- `guides.data`: parse with `GuideSchema`; column identity fields overwrite JSON on read.
- Draft → Claim: verify code picks label; `toLabelledClaim` only attaches label + tier from page record.

---

## 7. Approved decisions

- Nested Claims for provider facts; plain strings for titles, scope names, glossary.
- `NOT_OAUTH`, `NO_PUBLIC_DOCS`, `AMBIGUOUS_APP` → `run.error` only, no stub Guide.
- Partial timeout run → Guide with `coverage: "partial"`.
- `expiresAt` DB column only; not on Guide wire shape.
- An unknown fact is one `uncertain` Claim with `sources: []`, and its text says what is unknown (for example "Not found in the fetched sources."). `sourced` and `tested` claims still need at least one source; the schema rejects them otherwise.

---

## 8. Doc gaps (reference only)

- Agent doc single `claims` field → implementation uses `draftClaims` then labelled claims.
- Agent "stub" vs API `run.error` → follow API doc.
- DB doc `data` shape is narrower than full Guide JSON (requirements, scopes, breakdown, etc.).

---

## Next

- Implement in `@stamp/schema`, then API mappers, then web types.
- Update this doc if the contract changes.
