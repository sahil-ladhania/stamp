/**
 * File: top-blocker.ts
 * Purpose: Judges whether the guide's top blocker is a setup or approval blocker backed by an official source, flagging unsure cases for a manual check.
 * Exports: scoreTopBlocker, BlockerInput, BlockerClaim, BlockerVerdict
 * Used by: evals/scoring/score-app.ts
 */
import type { EvidenceLabel, SourceTier } from "@stamp/schema";
import type { Golden } from "../lib/golden.js";
import { scoreSources } from "./sources.js";

export type BlockerClaim = {
  label: EvidenceLabel;
  text: string;
  sources: { url: string; tier: SourceTier }[];
};
export type BlockerInput = { id: string; claims: BlockerClaim[] };

/** "none" means the guide names no top blocker; "manual" means the rules could not decide. */
export type BlockerVerdict = {
  verdict: "pass" | "fail" | "manual" | "none";
  reasons: string[];
};

// Security-threat vocabulary: a page about attackers is not about getting a developer approved.
const OFF_TOPIC =
  /\b(attack(?:er|ers|s)?|malicious|malware|phishing|ransomware|exploits?|breach(?:es)?|threat actors?)\b/i;
// Generic setup and approval words, used only to word the manual-check reason.
const SETUP_WORDS =
  /\b(approv\w*|review\w*|verif\w*|consent|admin\w*|install\w*|regist\w*|scopes?|quota|limits?|marketplace|assessment|submit\w*|permission\w*|publish\w*)\b/i;

/**
 * Fails on a wrong-product page, on a Sourced or Tested claim that rests on a non-official page, and on
 * off-topic threat prose. Passes when a golden blocker keyword appears. Anything else needs a human.
 */
export function scoreTopBlocker(
  blocker: BlockerInput | null,
  golden: Golden,
): BlockerVerdict {
  if (blocker === null) {
    return { verdict: "none", reasons: ["the guide names no top blocker"] };
  }
  const text = blocker.claims
    .map((claim) => claim.text)
    .join(" ")
    .toLowerCase();
  const urls = blocker.claims.flatMap((claim) =>
    claim.sources.map((s) => s.url),
  );
  const fails: string[] = [];

  for (const url of scoreSources(urls, golden).wrongProduct) {
    fails.push(`cites a wrong product page: ${url}`);
  }
  for (const claim of blocker.claims) {
    const outsider = claim.sources.find((source) => source.tier !== "official");
    if (claim.label !== "uncertain" && outsider) {
      fails.push(
        `a ${claim.label} claim rests on a ${outsider.tier} page: ${outsider.url}`,
      );
    }
  }
  const keywordHit = golden.blockers.some((entry) =>
    entry.keywords.some((keyword) => text.includes(keyword.toLowerCase())),
  );
  if (OFF_TOPIC.test(text) && !keywordHit) {
    fails.push(
      "off-topic: reads as a security threat, not a setup or approval blocker",
    );
  }

  if (fails.length > 0) {
    return { verdict: "fail", reasons: [...new Set(fails)] };
  }
  if (keywordHit)
    return { verdict: "pass", reasons: ["matches a golden blocker keyword"] };
  const hint = SETUP_WORDS.test(text)
    ? "setup or approval words present, but no golden keyword"
    : "no golden keyword and no setup or approval words";
  return { verdict: "manual", reasons: [`${hint}: check by hand`] };
}
