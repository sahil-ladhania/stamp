/**
 * File: top-blocker.test.ts
 * Purpose: Tests the top blocker relevance rules: pass, fail and manual-check outcomes from keywords, source tier and wrong-product pages.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { loadGolden, type Golden } from "../lib/golden.js";
import { scoreTopBlocker, type BlockerInput } from "./top-blocker.js";

const all = await loadGolden();
const golden = (slug: string): Golden => {
  const found = all.find((g) => g.slug === slug);
  if (!found) throw new Error(`no golden ${slug}`);
  return found;
};

const OFFICIAL =
  "https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification";

function blocker(
  text: string,
  over: {
    label?: "sourced" | "tested" | "uncertain";
    url?: string;
    tier?: "official" | "third_party" | "forum";
  } = {},
): BlockerInput {
  const label = over.label ?? "sourced";
  return {
    id: "blockers.0",
    claims: [
      {
        label,
        text,
        sources:
          label === "uncertain"
            ? []
            : [{ url: over.url ?? OFFICIAL, tier: over.tier ?? "official" }],
      },
    ],
  };
}

describe("scoreTopBlocker", () => {
  const gmail = golden("gmail");

  it("reports none when the guide has no top blocker", () => {
    expect(scoreTopBlocker(null, gmail).verdict).toBe("none");
  });

  it("passes an approval blocker backed by an official source", () => {
    const result = scoreTopBlocker(
      blocker(
        "Restricted Gmail scopes need an annual security assessment before launch",
      ),
      gmail,
    );
    expect(result.verdict).toBe("pass");
  });

  it("passes an Uncertain blocker that is still about approval", () => {
    const result = scoreTopBlocker(
      blocker("Verification may be required for sensitive scopes", {
        label: "uncertain",
      }),
      gmail,
    );
    expect(result.verdict).toBe("pass");
  });

  it("fails a Sourced blocker that rests on a third-party page", () => {
    const result = scoreTopBlocker(
      blocker("Google verification is required for sensitive scopes", {
        url: "https://www.cloudsponge.com/blog/x",
        tier: "third_party",
      }),
      gmail,
    );
    expect(result.verdict).toBe("fail");
    expect(result.reasons.join(" ")).toMatch(/third_party/);
  });

  it("lists each reason once when several claims rest on the same page", () => {
    const page = "https://www.cloudsponge.com/blog/x";
    const claim = {
      label: "sourced" as const,
      text: "Google verification is required",
      sources: [{ url: page, tier: "third_party" as const }],
    };
    const result = scoreTopBlocker(
      { id: "blockers.0", claims: [claim, claim, claim] },
      gmail,
    );
    expect(result.verdict).toBe("fail");
    expect(result.reasons).toHaveLength(1);
  });

  it("fails a security-threat blog topic that is not about getting approved", () => {
    const result = scoreTopBlocker(
      blocker("Attackers can register malicious applications to steal tokens", {
        url: "https://airlockdigital.com/x",
        tier: "third_party",
      }),
      golden("microsoft"),
    );
    expect(result.verdict).toBe("fail");
    expect(result.reasons.join(" ")).toMatch(/off-topic/);
  });

  it("fails a blocker whose source is the wrong product", () => {
    const result = scoreTopBlocker(
      blocker("Verification is required", {
        url: "https://docs.cloud.google.com/contact-center/ccai-platform/docs/oauth-email-google",
      }),
      gmail,
    );
    expect(result.verdict).toBe("fail");
    expect(result.reasons.join(" ")).toMatch(/wrong product/);
  });

  it("fails the Notion top blocker that comes from the Snowflake connector article", () => {
    const result = scoreTopBlocker(
      blocker("You see 'invalid_client' while signing in or refreshing.", {
        url: "https://www.notion.com/zh-cn/help/set-up-the-snowflake-mcp-for-notion",
      }),
      golden("notion"),
    );
    expect(result.verdict).toBe("fail");
    expect(result.reasons.join(" ")).toMatch(/wrong product/);
  });

  it("sends a blocker with no golden keyword to a manual check", () => {
    const result = scoreTopBlocker(
      blocker("Rate limits apply to the batch endpoint"),
      gmail,
    );
    expect(result.verdict).toBe("manual");
  });

  it("matches keywords from any golden blocker, ignoring case", () => {
    const result = scoreTopBlocker(
      blocker("The BRAND VERIFICATION step comes first"),
      gmail,
    );
    expect(result.verdict).toBe("pass");
  });
});
