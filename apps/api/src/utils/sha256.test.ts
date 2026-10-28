/**
 * File: sha256.test.ts
 * Purpose: Tests the SHA-256 helper against known digests.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { sha256Hex } from "./sha256.js";

describe("sha256Hex", () => {
  it("matches the published digest of 'abc'", () => {
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("matches the published digest of the empty string", () => {
    expect(sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("hashes UTF-8 bytes, and any change changes the digest", () => {
    expect(sha256Hex("caf\u00E9")).toMatch(/^[0-9a-f]{64}$/);
    expect(sha256Hex("page text")).not.toBe(sha256Hex("page text "));
  });
});
