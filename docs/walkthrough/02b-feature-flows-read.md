# 02b Feature flows: open a guide, report, library, Not found

## Flow 3: open a guide
- Route `/g/:slug` runs `GET /api/guides/:slug` through `useGuide` (`apps/web/src/pages/GuidePage.tsx:18`).

```mermaid
flowchart TD
    A["Open /g/slug"]:::ours --> L["Skeleton while loading"]:::ours
    L --> R["GET /api/guides/slug"]:::ours
    R --> Q{"Slug 1 to 100 chars?"}:::ours
    Q -->|"no"| E1["400 VALIDATION_ERROR"]:::error
    Q -->|"yes"| DB[("guides row")]:::db
    DB --> F{"Row found?"}:::ours
    F -->|"no"| E2["404 NOT_FOUND<br/>Not found panel"]:::error
    F -->|"yes"| P{"data passes GuideSchema?"}:::ours
    P -->|"no"| E3["500 INTERNAL"]:::error
    P -->|"yes"| W{"Web parse passes?"}:::ours
    W -->|"no"| E4["INVALID_RESPONSE"]:::error
    W -->|"yes"| C{"coverage"}:::ours
    C -->|"full"| G["Guide page"]:::ours
    C -->|"partial"| PG["Guide + partial notice<br/>Retry run button"]:::ours
    R -.->|"timeout, offline"| E5["NETWORK"]:::error
    classDef ours fill:#E6F4EC,stroke:#1F6B43,color:#1F6B43
    classDef db fill:#FFF4DB,stroke:#8A5A00,color:#5C3B00
    classDef error fill:#FDE7E4,stroke:#B42318,color:#B42318
```

- An expired live guide is still returned, so share links keep working (`apps/api/src/services/guides.ts:30`).
- `toGuide` re-checks stored JSON on every read and overlays the indexed columns (`apps/api/src/mappers/guide-mapper.ts:17`).
- A stub guide is saved already expired but is readable here (`apps/api/src/agent/stub/run-stub-agent.ts:93`).
- Partial notice lists the Uncertain sections; "Retry run" sends `force: true` (`apps/web/src/components/guide/PartialNotice.tsx:29`).

| Trigger | Code | HTTP | User sees |
| --- | --- | --- | --- |
| Slug over 100 characters | `VALIDATION_ERROR` | 400 | "The guide did not load" and the input message |
| No row for the slug | `NOT_FOUND` | 404 | Not found panel; "Research <Name> live" if the slug looks like a name |
| Stored JSON fails `GuideSchema` | `INTERNAL` | 500 | "The guide did not load", "Something went wrong on our side." |
| Offline or 15 s timeout | `NETWORK` (browser) | none | Same screen, "Stamp could not reach the server." |

- Retry button: "Retry loading the guide", plus "Open the library" (`apps/web/src/components/guide/GuideLoadError.tsx:31`).

## Flow 4: report a wrong claim
- Control: `ReportClaim` on each claim (`apps/web/src/components/evidence/ReportClaim.tsx:19`).

```mermaid
flowchart TD
    A["Click Report wrong claim"]:::ours --> N["Optional note, up to 2000 chars"]:::ours
    N --> P["POST /api/guides/slug/reports"]:::ours
    P --> RL{"Under report rate limit?"}:::ours
    RL -->|"no"| E1["429 RATE_LIMITED"]:::error
    RL -->|"yes"| V{"Valid claimId and note?"}:::ours
    V -->|"no"| E2["400 VALIDATION_ERROR"]:::error
    V -->|"yes"| DB[("guides row")]:::db
    DB --> F{"Guide exists?"}:::ours
    F -->|"no"| E3["404 NOT_FOUND"]:::error
    F -->|"yes"| I{"claimId is an id in the guide?"}:::ours
    I -->|"no"| E4["400 VALIDATION_ERROR"]:::error
    I -->|"yes"| W[("claim_reports insert")]:::db
    W --> OK["201 reportId<br/>Report sent."]:::ours
    classDef ours fill:#E6F4EC,stroke:#1F6B43,color:#1F6B43
    classDef db fill:#FFF4DB,stroke:#8A5A00,color:#5C3B00
    classDef error fill:#FDE7E4,stroke:#B42318,color:#B42318
```

- Reports have their own rate-limit counter, separate from run starts (`apps/api/src/app.ts:30`).
- Any `id` in the guide is accepted: claims, steps, scopes, blockers, conflicts (`apps/api/src/utils/collect-guide-ids.ts:9`).
- A report stores guide, claim id, note and time. It keeps no claim text or run id (`apps/api/prisma/schema.prisma`).
- An empty note is stored as `null` (`apps/api/src/services/reports.ts:30`).
- Nothing reads reports yet: no endpoint, job or screen uses them.

| Trigger | Code | HTTP | User sees |
| --- | --- | --- | --- |
| Over 10 reports in 60 s from one IP | `RATE_LIMITED` | 429 | "You have made too many requests. Try again in N seconds." |
| Bad `claimId` shape, note over 2000, extra field | `VALIDATION_ERROR` | 400 | "Stamp could not use that input." |
| Unknown guide slug | `NOT_FOUND` | 404 | "Stamp could not find that." |
| `claimId` not in this guide | `VALIDATION_ERROR` | 400 | "Stamp could not use that input." |

## Flow 5: browse the library
- Route `/app` runs `GET /api/guides` through `useGuides` (`apps/web/src/pages/AppHomePage.tsx:16`).

```mermaid
flowchart TD
    A["Open /app"]:::ours --> L["Loading the library<br/>5 ghost rows"]:::ours
    L --> R["GET /api/guides"]:::ours
    R --> DB[("guides where mode = LIBRARY<br/>difficulty, then name")]:::db
    DB --> S{"Rows pass GuideSummarySchema?"}:::ours
    S -->|"no"| E1["500 INTERNAL"]:::error
    S -->|"yes"| C{"Rows returned?"}:::ours
    C -->|"0"| EM["No library guides yet<br/>Search for an app"]:::ours
    C -->|"1 or more"| T["Table + N reads of GET /api/guides/slug<br/>for the time columns"]:::ours
    R -.->|"offline, timeout"| E2["The library did not load. Retry"]:::error
    E1 --> E2
    classDef ours fill:#E6F4EC,stroke:#1F6B43,color:#1F6B43
    classDef db fill:#FFF4DB,stroke:#8A5A00,color:#5C3B00
    classDef error fill:#FDE7E4,stroke:#B42318,color:#B42318
```

- Only `LIBRARY` guides are listed; live guides are reached by link (`apps/api/src/services/guides.ts:16`).
- Today the list is `[]`: no seed script or library files exist, so the empty state shows.
- Each row triggers its own guide read, and a failed read only blanks that row's times (`apps/web/src/hooks/useLibraryTimes.ts:20`).
- Durations come from a regex over claim text, not from a field (`apps/web/src/utils/extract-duration.ts:13`).
- Error text: "The library did not load." plus the API message (`apps/web/src/components/app-home/LibraryStates.tsx:29`).

## Flow 6: Not found "Research live"
- Any unknown route, and a `/g/:slug` that returns 404, render `NotFoundPanel` (`apps/web/src/components/not-found/NotFoundPanel.tsx:25`).

```mermaid
flowchart TD
    A["Unknown address"]:::ours --> H["Load library list"]:::ours
    H --> K{"A path word equals a library<br/>slug or name?"}:::ours
    K -->|"yes"| S["Did you mean X? link to /g/slug"]:::ours
    K -->|"no"| U{"Path is /g/name with a plain name?"}:::ours
    U -->|"no"| D["Generic message + search box"]:::ours
    U -->|"yes"| B["Research Name live button"]:::ours
    B --> P["POST /api/runs, no force"]:::ours
    P --> R{"Result"}:::ours
    R -->|"cached"| G["Open /g/slug"]:::ours
    R -->|"started or running"| RP["Open /run/id"]:::ours
    R -->|"error"| E["Message under the button"]:::error
    classDef ours fill:#E6F4EC,stroke:#1F6B43,color:#1F6B43
    classDef error fill:#FDE7E4,stroke:#B42318,color:#B42318
```

- The name is guessed from the last path segment and capitalised (`apps/web/src/utils/not-found-hint.ts:33`).
- With an empty library the "Did you mean" branch can never fire (`apps/web/src/utils/find-guide.ts:11`).
- The button reuses Flow 1, so every Flow 1 error can appear here (`apps/web/src/hooks/useStartRun.ts:21`).
- A typo in a share link can start a paid run for a made-up name.
- Only the rate limit and the daily cap limit that cost.
