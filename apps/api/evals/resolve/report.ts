/**
 * File: report.ts
 * Purpose: Writes the resolve stress report as markdown: outcome counts, outcomes by provider type, one row per provider, and what the search saw for every provider that did not end ok.
 * Exports: renderReport, describeDecision
 * Used by: evals/resolve/cli.ts
 */
import { PROVIDER_TYPES } from "./providers.js";
import type { Outcome } from "./classify.js";
import type { ResolveRecord } from "./resolve-one.js";

const OUTCOMES: readonly Outcome[] = [
  "ok",
  "ok_asks",
  "wrong_domain",
  "ambiguous_wrong",
  "no_docs",
  "error",
];
const row = (cells: readonly (string | number)[]): string =>
  `| ${cells.join(" | ")} |`;
const cell = (text: string): string => text.replace(/\|/g, "\\|");
const hostOf = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/** A short phrase for what Resolve did. */
export function describeDecision(record: ResolveRecord): string {
  switch (record.decision) {
    case "official": {
      const others = record.domains.filter(
        (domain) => domain !== record.domain,
      );
      const extra = others.length > 0 ? ` (also ${others.join(", ")})` : "";
      return `official ${record.domain}${extra}${record.via === "typed" ? " (typed, no search)" : ""}`;
    }
    case "ambiguous":
      return `asks: ${record.options.map((option) => option.domain).join(", ")}`;
    case "none":
      return "NO_PUBLIC_DOCS";
    case "error":
      return `search failed: ${record.error ?? "unknown"}`;
  }
}

function countsByOutcome(records: readonly ResolveRecord[]): string[] {
  return [
    row(["Outcome", "Providers"]),
    row(["---", "---"]),
    ...OUTCOMES.map((outcome) =>
      row([outcome, records.filter((r) => r.outcome === outcome).length]),
    ),
  ];
}

function countsByType(records: readonly ResolveRecord[]): string[] {
  const lines = [
    row(["Type", "Providers", ...OUTCOMES]),
    row(Array(OUTCOMES.length + 2).fill("---")),
  ];
  for (const type of PROVIDER_TYPES) {
    const of = records.filter((r) => r.types.includes(type));
    if (of.length === 0) continue;
    lines.push(
      row([
        type,
        of.length,
        ...OUTCOMES.map((o) => of.filter((r) => r.outcome === o).length || ""),
      ]),
    );
  }
  return lines;
}

function whatTheSearchSaw(record: ResolveRecord): string[] {
  const hits = record.hits.map(
    (hit) => `${hostOf(hit.url)} "${hit.title.slice(0, 60)}"`,
  );
  const top = record.candidates.map((c) => `${c.domain} ${c.match} ${c.score}`);
  return [
    `### ${record.typed}: ${record.outcome}`,
    `- Query: ${record.query ?? "none (no search)"}`,
    `- Expected: ${record.expected.join(", ")}`,
    `- Top candidates: ${top.length > 0 ? top.join("; ") : "none"}`,
    `- Hits (${record.hits.length}): ${hits.length > 0 ? hits.join("; ") : "none"}`,
    "",
  ];
}

/** The full report for one run or replay. */
export function renderReport(
  records: readonly ResolveRecord[],
  heading: string,
): string {
  const credits = records.reduce((sum, r) => sum + (r.credits ?? 0), 0);
  const failed = records.filter((r) => r.outcome !== "ok");
  return [
    `# ${heading}`,
    "",
    `${records.length} providers, ${records.filter((r) => r.via === "search").length} searched, ${credits} Tavily credits reported.`,
    "",
    ...countsByOutcome(records),
    "",
    "## By type",
    "",
    ...countsByType(records),
    "",
    "## Every provider",
    "",
    row(["Provider", "Types", "Expected", "What Resolve did", "Outcome"]),
    row(["---", "---", "---", "---", "---"]),
    ...records.map((r) =>
      row([
        cell(r.typed),
        r.types.join(", "),
        r.expected.join(", "),
        cell(describeDecision(r)),
        r.outcome,
      ]),
    ),
    "",
    "## What the search saw, where the outcome is not ok",
    "",
    ...failed.flatMap(whatTheSearchSaw),
  ].join("\n");
}
