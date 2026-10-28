/**
 * File: smoke-live.ts
 * Purpose: Hand-run check of the real Tavily and OpenAI clients: one search and one tiny structured call per model tier.
 * Exports: (none)
 * Used by: pnpm --filter api smoke:live (by hand only; never run by tests or CI)
 */
import "dotenv/config";
import { z } from "zod";
import { getConfig, requireRealAgentConfig } from "../src/config.js";
import { ModelCallError } from "../src/lib/openai-client.js";
import { structured } from "../src/lib/openai.js";
import { searchWeb } from "../src/lib/tavily.js";
import {
  createRunUsage,
  summarizeUsage,
  type ModelTier,
  type RunUsage,
} from "../src/lib/usage.js";

// Uses the constraints the real claim schemas use (min length, min items, url, enum, nullable),
// so a pass also proves OpenAI strict mode accepts the schema after sanitising.
const SmokeSchema = z.strictObject({
  answer: z.string().min(1),
  confidence: z.enum(["high", "medium", "low"]),
  tags: z.array(z.string().min(1)).min(1),
  homepage: z.string().url().nullable(),
});

const SEARCH_QUERY = "Slack API OAuth installing apps";
const MESSAGES = [
  { role: "system" as const, content: "Answer in the requested JSON shape." },
  {
    role: "user" as const,
    content:
      "What does OAuth stand for? Answer in at most five words, with 1 to 3 tags, and homepage https://oauth.net or null.",
  },
];

function say(line: string): void {
  process.stdout.write(`${line}\n`);
}

/** Error text for the terminal; a 400 also shows OpenAI's reason, because that is how a schema rejection reads. */
function describe(err: unknown): string {
  if (err instanceof ModelCallError && err.status === 400) {
    const reason = err.cause instanceof Error ? err.cause.message : "unknown";
    return `${err.message}: ${reason}`;
  }
  return err instanceof Error ? `${err.name}: ${err.message}` : "unknown error";
}

async function check(
  name: string,
  run: () => Promise<string>,
): Promise<boolean> {
  try {
    say(`PASS ${name}: ${await run()}`);
    return true;
  } catch (err) {
    say(`FAIL ${name}: ${describe(err)}`);
    return false;
  }
}

async function searchCheck(usage: RunUsage): Promise<string> {
  const result = await searchWeb(SEARCH_QUERY, {
    timeoutMs: 20_000,
    maxResults: 3,
    usage,
  });
  const first = result.hits[0];
  if (!first) {
    throw new Error("search returned no hits");
  }
  return `${result.hits.length} hits, first ${first.url}, credits ${result.credits ?? "not reported"}`;
}

async function modelCheck(tier: ModelTier, usage: RunUsage): Promise<string> {
  const result = await structured(tier, {
    schema: SmokeSchema,
    name: "smoke_check",
    messages: MESSAGES,
    timeoutMs: 30_000,
    usage,
  });
  if (!result.ok) {
    throw new Error(`${result.failure}: ${result.message}`);
  }
  const { inputTokens, outputTokens } = result.usage;
  return `${result.model}, ${inputTokens} in / ${outputTokens} out, ${result.durationMs} ms, answer "${result.data.answer}"`;
}

/** Names the missing settings (never their values); returns false when any are absent. */
function checkSettings(): boolean {
  try {
    requireRealAgentConfig(getConfig());
    return true;
  } catch (err) {
    const detail =
      err instanceof z.ZodError
        ? `invalid settings in apps/api/.env: ${err.issues.map((issue) => issue.path.join(".")).join(", ")}`
        : err instanceof Error
          ? `${err.message} (set them in apps/api/.env)`
          : "unknown error";
    say(`Cannot run: ${detail}`);
    return false;
  }
}

async function main(): Promise<void> {
  if (!checkSettings()) {
    process.exitCode = 1;
    return;
  }
  const tiers: ModelTier[] = process.argv.includes("--strong")
    ? ["fast", "strong"]
    : ["fast"];
  const usage = createRunUsage();
  const results = [
    await check("tavily search", () => searchCheck(usage)),
    ...(await Promise.all(
      tiers.map((tier) =>
        check(`${tier} model`, () => modelCheck(tier, usage)),
      ),
    )),
  ];
  say(`Usage: ${JSON.stringify(summarizeUsage(usage))}`);
  process.exitCode = results.every(Boolean) ? 0 : 1;
}

await main();
