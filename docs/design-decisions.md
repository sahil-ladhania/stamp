# Design decisions

## TL;DR

- 11 decisions shape Stamp. Each one lists what we chose, why, what we rejected, and the cost.
- The deciding rule for trade-offs: **evidence > useful guidance > problem fit > agent sophistication**.
- The biggest calls: a readiness report instead of a chat, claim-level evidence, and a fixed agent pipeline.

---

## 1. How the decisions connect

```mermaid
flowchart LR
    D1[Tie-break rule]:::rule --> D2[Persona]:::prod --> D3[Report format]:::prod --> D6[Claim-level schema]:::tech --> D7[Fixed pipeline]:::tech --> D8[Stack]:::tech
    D3 --> D5[5 library apps]:::prod
    D6 --> D10[Design: evidence first]:::prod
    D1 --> D6

    classDef rule fill:#FDE7E4,stroke:#B42318,color:#B42318
    classDef prod fill:#E8EFFA,stroke:#1F4E99,color:#1F4E99
    classDef tech fill:#E6F4EC,stroke:#1F6B43,color:#1F6B43
```

Red = the rule. Blue = product decisions. Green = technical decisions.

---

## 2. Summary

| # | Decision | Chosen |
| --- | --- | --- |
| 0 | Terminology | Plain OAuth terms in the UI, plus a glossary mapping them to Composio terms |
| 1 | Tie-break rule | Evidence > guidance > problem fit > agents |
| 2 | Persona | AI-agent developer moving to production who needs their own OAuth app |
| 3 | Format | A readiness report: library + live generator, one guide page |
| 4 | Feature scope | Must, Should and Could tiers; Won't list kept explicit |
| 5 | Library apps | GitHub, HubSpot, Gmail, LinkedIn, Salesforce |
| 6 | Guide schema | Claim-level evidence, rule-based difficulty, two milestones |
| 7 | Agent design | Fixed 9-stage pipeline, 1 bounded retry |
| 8 | Stack | Turborepo; React + Vite; Express; MySQL + Prisma; LangGraph JS; OpenAI; Tavily |
| 9 | Name | Stamp |
| 10 | Visual design | Paper and ink, one red accent, evidence labels in colour + icon + word |

---

## 3. Decisions in detail

### D0. Terminology

| | |
| --- | --- |
| Chosen | Plain terms ("provider OAuth app", "user connection") with a glossary to Composio terms ("auth config", "connected account") |
| Why | Any developer understands the plain terms; the glossary shows how they map to Composio |
| Rejected | Composio-only terms: confusing outside Composio, and there is no Composio term for provider review |

### D1. Tie-break rule

| | |
| --- | --- |
| Chosen | Evidence first, then useful guidance, then problem fit, then agent sophistication |
| Why | A wrong guide is worse than no guide: it can cost a developer weeks of rejected reviews |
| Rejected | Agents first: risks an impressive agent that hangs or invents steps |

### D2. Persona

| | |
| --- | --- |
| Chosen | A developer taking an AI agent to production who needs their own OAuth app (own branding, custom scopes, or no managed app) |
| Why | Managed OAuth apps already cover prototyping; the pain starts at production |
| Rejected | An internal integrations team: not the user the problem describes |

### D3. Format

| | |
| --- | --- |
| Chosen | A readiness report: verdict first, then steps, blockers and sources; shared by link |
| Why | Developers need a plan they can act on and share, not a conversation |
| Rejected | Chat agent: free text is hard to label, verify and share. Step-by-step wizard: approvals take weeks, so tracking needs accounts and state |

### D4. Feature scope

| | |
| --- | --- |
| Chosen | Must = core loop; Should = proof features; Could = polish; Won't = explicit |
| Why | The core loop must work end to end before anything else |
| Cost | Could features are cut first if time runs short |

### D5. Library apps

| | |
| --- | --- |
| Chosen | One app per kind of hard: GitHub (instant), HubSpot (hidden limits), Gmail (review), LinkedIn (partner-gated), Salesforce (enterprise) |
| Why | Variety tests the product better than popularity |
| Rejected | Only easy apps: hides the real pain. A sixth app (Slack): overlaps GitHub's kind of hard |

### D6. Guide schema

| | |
| --- | --- |
| Chosen | Every fact is a claim with a label (Tested, Sourced, Uncertain) and sources; difficulty comes from a fixed rule; time is split into "first test" and "production" |
| Why | Labels can be checked by code; the same inputs always give the same score; HubSpot shows why one time estimate is not enough (about 1 hour to test, but a listing is needed past 25 installs) |
| Rejected | Sources per section: labels become decoration. Model-picked difficulty: scores drift between runs |
| Cost | A larger schema; the agent fills it section by section to keep output valid |

### D7. Agent design

| | |
| --- | --- |
| Chosen | A fixed pipeline: the model plans searches and extracts facts; code verifies quotes and scores; one retry if a section has no verified quote |
| Why | Predictable time and cost during a live demo; quote checks in code cannot agree with a mistake |
| Rejected | A free agent loop: unbounded time and cost. Multi-agent hand-offs: errors compound, and a model checking a model can agree with a hallucination |

### D8. Stack

| | |
| --- | --- |
| Chosen | Turborepo with pnpm; React + Vite on Vercel; Express, MySQL and Prisma on Railway; LangGraph JS; OpenAI; Tavily; Zod shared by both apps |
| Why | Fits the team's skills; an always-on API keeps long runs and streams stable; one shared schema prevents drift |
| Rejected | CopilotKit and chat UI kits: Stamp has no chat. Free hosts that sleep: the first request would hang |

### D9. Name

| | |
| --- | --- |
| Chosen | Stamp: "Know what it takes to get your OAuth app stamped." |
| Why | One syllable; names the outcome the developer wants: approval |
| Rejected | ReviewETA, OAuth Preflight (clashes with CORS preflight), Vet (clashes with an existing developer tool) |

### D10. Visual design

| | |
| --- | --- |
| Chosen | Paper and ink, one red accent for the verdict, three label colours, each with an icon and a word |
| Why | Makes evidence the visual centre; passes WCAG AA in light and dark modes |
| Rejected | Dark terminal look: bright accents hurt label contrast. Default component styles: look like every other project |

---

## 4. Findings that shaped the decisions

| Finding | Effect | Source |
| --- | --- | --- |
| Composio's own setup guides list clicks but not waits or blockers | Defined the gap Stamp fills | [composio.dev/auth/hubspot](https://composio.dev/auth/hubspot) |
| New HubSpot apps stop at 25 installs until listed | Led to the two-milestone time model | [HubSpot changelog](https://developers.hubspot.com/changelog/new-marketplace-distribution-app-install-limits) |
| HubSpot treats apps that connect it to AI agents as "AI connectors" with extra listing rules | A blocker every AI-agent developer should see | [HubSpot forum](https://community.hubspot.com/t/ai-connector-as-legacy-public-app-install-limitation/148177) |
| A popular Salesforce guide still recommends a path Salesforce now restricts | Official sources must win over third-party ones | [Salesforce](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_understanding_authentication.htm) |
| Composio docs show two callback paths, `/api/v3/` and `/api/v3.1/` | A live example of the Uncertain label | [docs 1](https://docs.composio.dev/docs/custom-app-vs-managed-app.md), [docs 2](https://docs.composio.dev/docs/auth-configuration/custom-auth-configs) |

---

## Next

- Read [solution.md](./solution.md) to see the decisions as one product.
