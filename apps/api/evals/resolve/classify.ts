/**
 * File: classify.ts
 * Purpose: Scores what Resolve did for one provider against the domains that count as correct.
 * Exports: classify, domainMatches, Outcome, Decided
 * Used by: evals/resolve/resolve-one.ts, evals/resolve/report.ts
 */

export type Outcome =
  "ok" | "ok_asks" | "wrong_domain" | "ambiguous_wrong" | "no_docs" | "error";

/** What Resolve decided: an official domain (and its sibling domains), a question with options, nothing, or a failed search. */
export type Decided = {
  decision: "official" | "ambiguous" | "none" | "error";
  domains: readonly string[];
  options: readonly { domain: string }[];
};

/** The domain is an expected one, or a subdomain of it (pipedrive.readme.io is not readme.io). */
export function domainMatches(
  domain: string,
  expected: readonly string[],
): boolean {
  return expected.some(
    (wanted) => domain === wanted || domain.endsWith(`.${wanted}`),
  );
}

export function classify(
  result: Decided,
  expected: readonly string[],
): Outcome {
  switch (result.decision) {
    case "official":
      return result.domains.some((domain) => domainMatches(domain, expected))
        ? "ok"
        : "wrong_domain";
    case "ambiguous":
      return result.options.some((option) =>
        domainMatches(option.domain, expected),
      )
        ? "ok_asks"
        : "ambiguous_wrong";
    case "none":
      return "no_docs";
    case "error":
      return "error";
  }
}
