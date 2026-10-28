@AGENTS.md

## Claude Code

### Always-on rules

These load at session start.

@.cursor/rules/global/typescript-style.mdc
@.cursor/rules/global/monorepo-packages.mdc
@.cursor/rules/global/secrets-evidence.mdc
@.cursor/rules/global/code-structure.mdc

### Scoped rules

Read the matching file before you edit code in that area.

| Editing | Read |
| --- | --- |
| Tests | `.cursor/rules/global/testing.mdc` |
| `apps/web/**` | `.cursor/rules/web/structure-data.mdc`, `.cursor/rules/web/accessibility-copy.mdc` |
| `apps/web/src/components/**`, `pages/**`, `styles/**` | `.cursor/rules/web/design-system.mdc` |
| `apps/web/src/hooks/**` | `.cursor/rules/web/hooks.mdc` |
| `apps/api/src/routes/**`, `middleware/**` | `.cursor/rules/api/routes-errors.mdc` |
| `apps/api/src/**` | `.cursor/rules/api/services-utils.mdc`, `.cursor/rules/api/streaming-guardrails.mdc` |
| `apps/api/prisma/**`, services | `.cursor/rules/api/database.mdc` |
| `apps/api/src/agent/**` | `.cursor/rules/agent/graph-budgets.mdc`, `.cursor/rules/agent/evidence-scoring.mdc`, `.cursor/rules/agent/prompts-safety.mdc` |

### Working style

- Use plan mode for changes to `packages/schema`, `apps/api/prisma/schema.prisma` and the agent graph.
- Never read, print or edit `.env` files.
- Never run deploy commands. Deploys are done by hand.
- Keep each change small and run `pnpm test` before you finish.
