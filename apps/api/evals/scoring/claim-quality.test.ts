/**
 * File: claim-quality.test.ts
 * Purpose: Tests sorting Sourced and Tested claims by the page they stand on: good, wrong product, related product or third party.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { loadGolden, type Golden } from "../lib/golden.js";
import { scoreClaimQuality } from "./claim-quality.js";

const all = await loadGolden();
const golden = (slug: string): Golden => {
  const found = all.find((g) => g.slug === slug);
  if (!found) throw new Error(`no golden ${slug}`);
  return found;
};

type TestClaim = {
  label: "sourced" | "tested" | "uncertain";
  sources: { url: string; tier: "official" | "third_party" | "forum" }[];
};
const claim = (
  url: string,
  tier: "official" | "third_party" | "forum" = "official",
  label: TestClaim["label"] = "sourced",
): TestClaim => ({
  label,
  sources: label === "uncertain" ? [] : [{ url, tier }],
});

const GOOD = "https://developers.google.com/workspace/gmail/api/auth/scopes";
const WRONG =
  "https://docs.cloud.google.com/contact-center/ccai-platform/docs/oauth-email-google";

describe("scoreClaimQuality", () => {
  it("counts a claim on a good official page as good", () => {
    expect(scoreClaimQuality([claim(GOOD)], golden("gmail"))).toEqual({
      sourced: 1,
      good: 1,
      wrongProduct: 0,
      related: 0,
      thirdParty: 0,
      share: 1,
    });
  });

  it("counts a claim on another product's page as wrong product, though the tier says official", () => {
    const result = scoreClaimQuality([claim(WRONG)], golden("gmail"));
    expect(result).toMatchObject({ wrongProduct: 1, good: 0, share: 0 });
  });

  it("counts a claim on Slack's legacy page as related, not wrong product", () => {
    const result = scoreClaimQuality(
      [claim("https://api.slack.com/docs/oauth")],
      golden("slack"),
    );
    expect(result).toMatchObject({ related: 1, wrongProduct: 0, good: 0 });
  });

  it("counts a claim on a third-party or forum page as third party", () => {
    const result = scoreClaimQuality(
      [
        claim("https://www.unipile.com/x", "third_party"),
        claim("https://stackoverflow.com/q/1", "forum"),
      ],
      golden("gmail"),
    );
    expect(result).toMatchObject({ thirdParty: 2, good: 0 });
  });

  it("counts the worst source when a claim has several", () => {
    const mixed: TestClaim = {
      label: "sourced",
      sources: [
        { url: GOOD, tier: "official" },
        { url: WRONG, tier: "official" },
      ],
    };
    expect(scoreClaimQuality([mixed], golden("gmail"))).toMatchObject({
      wrongProduct: 1,
      good: 0,
    });
  });

  it("ignores Uncertain claims", () => {
    const result = scoreClaimQuality(
      [claim(GOOD), claim("", "official", "uncertain")],
      golden("gmail"),
    );
    expect(result.sourced).toBe(1);
  });

  it("counts Tested claims with the Sourced ones", () => {
    expect(
      scoreClaimQuality([claim(GOOD, "official", "tested")], golden("gmail"))
        .sourced,
    ).toBe(1);
  });

  it("reports a share of the Sourced claims, and zero when there are none", () => {
    const result = scoreClaimQuality(
      [claim(GOOD), claim(GOOD), claim(WRONG), claim(WRONG)],
      golden("gmail"),
    );
    expect(result.share).toBe(0.5);
    expect(scoreClaimQuality([], golden("gmail")).share).toBe(0);
  });

  it("flags the Notion Snowflake article in any language", () => {
    const result = scoreClaimQuality(
      [
        claim(
          "https://www.notion.com/zh-cn/help/set-up-the-snowflake-mcp-for-notion",
        ),
      ],
      golden("notion"),
    );
    expect(result.wrongProduct).toBe(1);
  });
});
