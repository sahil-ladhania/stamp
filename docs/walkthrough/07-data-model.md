# 07 Data model

## The five tables
- Schema source: `apps/api/prisma/schema.prisma`. Migration: `apps/api/prisma/migrations/20261028103848_init/migration.sql`.

```mermaid
erDiagram
    GUIDES ||--o{ RUNS : "built by"
    GUIDES ||--o{ VERIFICATION_LOG : "checked by, cascade delete"
    RUNS ||--o{ VERIFICATION_LOG : "writes"
    GUIDES ||--o{ CLAIM_REPORTS : "flagged in, cascade delete"
    GUIDES:::db {
        string id PK
        string slug UK
        string appName
        string domain
        enum mode "LIBRARY or LIVE"
        enum archetype
        int difficulty "1 to 5, copy of data"
        json data "the whole guide"
        datetime asOf
        datetime expiresAt "null for library"
    }
    RUNS:::db {
        string id PK
        string slug "not a foreign key"
        enum status "RUNNING DONE PARTIAL FAILED"
        int stageReached "0 to 8"
        string errorCode
        string activeSlug UK "the lock"
        string guideId FK "null until saved"
        datetime startedAt
        datetime finishedAt
    }
    PAGE_CACHE:::db {
        string urlHash PK "sha256 of URL"
        text url
        enum tier
        longtext text
        string contentHash
        datetime expiresAt "fetch + 7 days"
    }
    VERIFICATION_LOG:::db {
        string id PK
        string guideId FK
        string runId FK "nullable"
        string claimId
        enum method "QUOTE_MATCH or PROBE used"
        enum result "PASS or FAIL"
        text detail "JSON"
        text sourceUrl
    }
    CLAIM_REPORTS:::db {
        string id PK
        string guideId FK
        string claimId
        text note
        datetime createdAt
    }
    classDef db fill:#FFF4DB,stroke:#8A5A00,color:#5C3B00
```

- `page_cache` stands alone: keyed by URL hash, shared by every run and guide.
- `runs.slug` is plain text, so a run can name a slug that has no guide (`apps/api/prisma/schema.prisma`).
- Indexes: unique `guides.slug`, unique `runs.activeSlug`, `guides(mode, difficulty)`, `runs(slug, startedAt)`.
- Nothing deletes rows: no code calls `delete`, so `runs`, `page_cache` and the log only grow.
- Reads of `verification_log` and `claim_reports` do not exist in the API; both are write-only today.

## Guide lifecycle: library, live, expiry

```mermaid
stateDiagram-v2
    [*] --> LiveFresh: run saves guide, expiresAt = now + 7 days
    [*] --> Library: seeded by hand, no seed script exists today
    LiveFresh --> LiveExpired: 7 days pass
    LiveFresh --> LiveFresh: forced refresh, upsert replaces the row
    LiveExpired --> LiveFresh: new run saves, upsert replaces the row
    Library --> Library: live save refused, library_guide_protected
    class LiveFresh ours
    class LiveExpired db
    class Library ours
    classDef ours fill:#E6F4EC,stroke:#1F6B43,color:#1F6B43
    classDef db fill:#FFF4DB,stroke:#8A5A00,color:#5C3B00
```

- A library guide is never overwritten: save checks the existing row's mode first (`apps/api/src/services/guide-save.ts:36`).
- `force` on a library slug returns `cached` and starts nothing (`apps/api/src/services/runs.ts:23`).
- An expired live guide is still served and linked; only `POST /api/runs` treats it as stale (`apps/api/src/services/runs.ts:29`).
- A refresh replaces the row in place. There is no history, so the old guide is gone (`apps/api/src/services/guide-save.ts:50`).
- A failed refresh leaves the old row, because save is the last stage. A weaker successful refresh still wins.
- Claim ids are positions like `steps.0`, so after a refresh an old report may point at different content.

## Page cache

```mermaid
flowchart TD
    U["URL from search results"]:::ours --> N["Normalise URL, SHA-256 = urlHash"]:::ours
    N --> C[("page_cache row?")]:::db
    C -->|"fresh"| H["Hit: reuse text and contentHash,<br/>tier recomputed for this app"]:::ours
    C -->|"missing or expired"| X["Tavily extract"]:::outside
    C -->|"read error"| M["Logged, treated as a miss"]:::error --> X
    X -->|"under 300 chars"| DR["Dropped"]:::error
    X -->|"ok"| ST[("upsert text, contentHash = sha256 of text,<br/>expiresAt = now + 7 days")]:::db
    ST --> P["Page held for this run"]:::ours
    H --> P
    classDef ours fill:#E6F4EC,stroke:#1F6B43,color:#1F6B43
    classDef outside fill:#F3E8FD,stroke:#6B2FA0,color:#4A1D75
    classDef db fill:#FFF4DB,stroke:#8A5A00,color:#5C3B00
    classDef error fill:#FDE7E4,stroke:#B42318,color:#B42318
```

- Normal form: lowercase host, no fragment or credentials, tracking params removed, params sorted (`apps/api/src/utils/hash-url.ts:17`).
- Removed params: `utm_*`, `fbclid`, `gclid`, `msclkid`, `mc_cid`, `mc_eid` (`apps/api/src/utils/hash-url.ts:10`).
- A row is a hit while `expiresAt` is in the future (`apps/api/src/services/page-cache.ts:27`).
- Two runs storing one new URL at once: the second falls back to an update (`apps/api/src/services/page-cache.ts:63`).
- Cache hits still send `page.fetched`, so the trace cannot tell cached from new pages.
- A cached page can be up to 7 days old. No re-check is made against the live page.

## Verification log
- One row per quote check or probe, written once per run at save (`apps/api/src/services/verification-log.ts:26`).
- Quote checks cover claim slots, gates evidence, and both sides of each proposed conflict (`apps/api/src/agent/nodes/verify.ts:49`).
- `detail` is JSON: `contentHash` of the page checked, plus `reason` or HTTP `status` (`apps/api/src/services/verification-log.ts:15`).
- Rows pile up across runs on purpose; each row names its run (`apps/api/src/services/verification-log.ts:23`).
- A failed log write is a warning; the guide and the run still succeed (`apps/api/src/agent/nodes/save.ts:67`).
- The log is skipped when a library guide owns the slug (`apps/api/src/agent/nodes/save.ts:56`).
- `MANUAL` and `BROWSER` methods exist in the enum but nothing writes them.

## Claim reports
- One row per report: guide, claim id, optional note, time (`apps/api/src/services/reports.ts:31`).
- No status, owner, run id or claim text is stored, and no screen or endpoint reads the rows.
- Deleting a guide would delete its reports and log rows (`apps/api/prisma/schema.prisma`).
- There is no dedupe, so one reader can file the same report many times within the rate limit.
