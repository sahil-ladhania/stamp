# Stamp web

React + Vite UI for Stamp, deployed to Vercel. It talks to `apps/api` over HTTP and one SSE stream.

## Commands

Run from the repo root with pnpm.

| Task | Command |
| --- | --- |
| Dev server | `pnpm --filter web dev` |
| Build | `pnpm --filter web build` |
| Lint | `pnpm --filter web lint` |
| Test | `pnpm --filter web test` |

## Reaching the API

| Where | `VITE_API_URL` | How requests go |
| --- | --- | --- |
| Development | Empty | The Vite dev server proxies `/api` to `http://localhost:3000`. The browser only calls its own origin, so there is no CORS. |
| Production | The API origin, no trailing slash | The browser calls the API directly. The API allows only the origin in its `WEB_ORIGIN`, so that must equal this app's origin. |

Copy `.env.example` to `.env` to change it. Every `VITE_` variable is public: never put a secret in one.

`VITE_REPO_URL` is optional. It is the repository link in the footer's Project group. Leave it empty to hide the group.

## Data layer

Components never call Axios, `fetch` or `EventSource`. The path is always component, hook, service.

| Layer | Folder | Job |
| --- | --- | --- |
| Client | `src/lib/` | `config.ts` reads `VITE_API_URL`. `api-client.ts` is the one Axios instance. Its interceptor turns every failure into an `ApiError` (`api-error.ts`, `to-api-error.ts`), so raw Axios errors never reach a component. |
| Services | `src/services/` | One file per domain, no React. Each reply is validated with its `@stamp/schema` schema, and a reply that does not match becomes `ApiError("INVALID_RESPONSE")`. `run-stream.service.ts` wraps the browser `EventSource`. |
| Hooks | `src/hooks/` | `useAsyncData` and `useAsyncAction` hold the loading and error state. `useGuides`, `useGuide`, `useStartRun`, `useRunStream` and `useReportClaim` build on them. |
| Copy | `src/utils/error-messages.ts` | The one map from error code to UI message. |

`ApiError.code` is one of the five API codes (`VALIDATION_ERROR`, `NOT_FOUND`, `RATE_LIMITED`, `RUN_CAP_REACHED`, `INTERNAL`) or a client code: `NETWORK` (no connection, a timeout, or a gateway error page) and `INVALID_RESPONSE`.

### Run stream

Every connection to `/api/runs/:id/stream` starts with a `run.snapshot` and replays the whole run, so a refresh or a dropped connection recovers by itself. The reducer in `src/utils/run-stream-state.ts` clears its events on each snapshot, so a replay never shows a row twice. The service closes the connection on `run.done` or `run.error`.

## Pages

Every page reads the API through hooks. Nothing is mocked: the only static content is under `src/content/`, which holds the How we verify copy and its editorial examples.

| Page | Reads | When the API has nothing |
| --- | --- | --- |
| `/` Landing | `useGuides`, `useGuide("hubspot")` | The library preview, example links and the sample verdict are left out; the rest of the page reads on its own |
| `/app` App home | `useGuides` | An empty state that points at the search, and an error state with a retry |
| `/run/:id` Live run | `useRunStream`, `useStartRun` | Every `run.error` and stream failure has its own state with a next action |
| `/g/:slug` Guide | `useGuide`, `useReportClaim` | An unknown slug shows Not found with a "Research live" button; a failed load shows a retry |
| `*` Not found | `useGuides`, `useStartRun` | No suggestion and no example links |
| `/how-we-verify` | none | Static |

A guide from `@stamp/schema` is mapped to the UI shape in `src/types/guide-model.ts` by the `src/utils/map-*.ts` mappers, so components never read the wire shape. The mappers set no label and invent no fact.

## Tests

Vitest, no network. Tests sit beside the code (`*.test.ts`). Shared helpers are in `src/test-support/`: a stub Axios adapter, a fake `EventSource`, and fixtures built from `@stamp/schema`.
