/**
 * File: top-blocker.test.ts
 * Purpose: Tests choosing the guide's top blocker in code: approval before setup before limit, never an error message, Sourced official before the rest, and none when nothing qualifies.
 * Exports: (none)
 * Used by: vitest
 */
import type { Blocker, Claim } from "@stamp/schema";
import { describe, expect, it } from "vitest";
import { blockerKind, pickTopBlockerId } from "./top-blocker.js";

const claim = (
  id: string,
  text: string,
  label: Claim["label"] = "sourced",
  tier: "official" | "third_party" = "official",
): Claim => ({
  id,
  text,
  label,
  sources:
    label === "uncertain"
      ? []
      : [
          {
            url: "https://docs.acme.com/x",
            quote: "A quote that is long enough.",
            tier,
            retrievedAt: "2026-10-29T00:00:00.000Z",
          },
        ],
});
const blocker = (
  n: number,
  symptom: string,
  over: {
    cause?: string;
    fix?: string;
    label?: Claim["label"];
    tier?: "official" | "third_party";
  } = {},
): Blocker => ({
  id: `blockers.${n}`,
  symptom: claim(`blockers.${n}.symptom`, symptom, over.label, over.tier),
  cause: claim(`blockers.${n}.cause`, over.cause ?? "", over.label, over.tier),
  fix: claim(`blockers.${n}.fix`, over.fix ?? "", over.label, over.tier),
  contact: null,
});

describe("blockerKind", () => {
  it.each([
    ["App review rejected", "approval"],
    ["Your app must pass a security assessment before launch", "approval"],
    ["The redirect URI does not match the one registered", "setup"],
    ["You need a paid plan to create an app", "setup"],
    ["Apps are limited to 25 installs until approved", "approval"],
    ["Rate limit of 100 requests per 10 seconds", "limit"],
    ["Request fails with invalid_client", "error"],
    ["HTTP 401 Unauthorized when exchanging the code", "error"],
    ["The sky is blue", null],
  ] as const)("%s is %s", (symptom, kind) => {
    expect(blockerKind(blocker(0, symptom))).toBe(kind);
  });

  it("reads an error symptom as an error even when the cause names setup things", () => {
    expect(
      blockerKind(
        blocker(0, "Request fails with invalid_client", {
          cause: "The client ID or redirect URI is wrong",
        }),
      ),
    ).toBe("error");
  });
});

describe("pickTopBlockerId", () => {
  it("picks approval over setup over limit", () => {
    const list = [
      blocker(0, "Rate limit of 100 requests per 10 seconds"),
      blocker(1, "The redirect URI does not match"),
      blocker(2, "App review takes weeks and can be rejected"),
    ];
    expect(pickTopBlockerId(list)).toBe("blockers.2");
    expect(pickTopBlockerId(list.slice(0, 2))).toBe("blockers.1");
    expect(pickTopBlockerId(list.slice(0, 1))).toBe("blockers.0");
  });

  it("never picks an error message, so a guide with only errors has no top blocker", () => {
    expect(
      pickTopBlockerId([blocker(0, "Request fails with invalid_client")]),
    ).toBeNull();
    expect(pickTopBlockerId([])).toBeNull();
  });

  it("prefers a Sourced official blocker among equals, then the earlier one", () => {
    const list = [
      blocker(0, "App review is required", { label: "uncertain" }),
      blocker(1, "App review is required", { tier: "third_party" }),
      blocker(2, "App review is required"),
      blocker(3, "App review is required"),
    ];
    expect(pickTopBlockerId(list)).toBe("blockers.2");
  });

  it("still picks an Uncertain approval blocker when nothing better exists, because it is shown as Uncertain", () => {
    expect(
      pickTopBlockerId([
        blocker(0, "App review is required", { label: "uncertain" }),
      ]),
    ).toBe("blockers.0");
  });
});
