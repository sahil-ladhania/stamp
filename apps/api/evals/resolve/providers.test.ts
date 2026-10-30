/**
 * File: providers.test.ts
 * Purpose: Tests the stress list file and its loader: the committed list is valid and covers every type, and a bad list is refused.
 * Exports: (none)
 * Used by: vitest
 */
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PROVIDER_TYPES, loadProviders, needsSearch } from "./providers.js";

describe("the committed stress list", () => {
  it("is valid and has 36 entries, 33 of which need a search", async () => {
    const providers = await loadProviders();
    expect(providers).toHaveLength(36);
    expect(providers.filter(needsSearch)).toHaveLength(33);
  });

  it("has the six tuning apps as controls and nothing else", async () => {
    const controls = (await loadProviders())
      .filter((p) => p.control)
      .map((p) => p.typed);
    expect(controls).toEqual([
      "GitHub",
      "Gmail",
      "HubSpot",
      "Microsoft",
      "Notion",
      "Slack",
    ]);
  });

  it("covers every type at least once", async () => {
    const used = new Set((await loadProviders()).flatMap((p) => p.types));
    expect([...PROVIDER_TYPES].filter((type) => !used.has(type))).toEqual([]);
  });
});

describe("loadProviders", () => {
  let dir = "";
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "resolve-list-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const entry = (typed: string, extra: object = {}) => ({
    typed,
    types: ["dev_subdomain"],
    expected: ["acme.com"],
    docs: "https://developer.acme.com/",
    ...extra,
  });
  const load = async (list: unknown[]) => {
    const file = join(dir, "list.json");
    await writeFile(file, JSON.stringify(list));
    return loadProviders(file);
  };

  it("refuses a name listed twice, whatever its case", async () => {
    await expect(load([entry("Acme"), entry("acme")])).rejects.toThrow(/twice/);
  });

  it("refuses an unknown type and a domain that is not a domain", async () => {
    await expect(load([entry("Acme", { types: ["nope"] })])).rejects.toThrow();
    await expect(
      load([entry("Acme", { expected: ["Not A Domain"] })]),
    ).rejects.toThrow();
  });

  it("refuses a typed_domain type on a name, and a domain typed without it", async () => {
    await expect(
      load([entry("Acme", { types: ["typed_domain"] })]),
    ).rejects.toThrow(/typed_domain/);
    await expect(load([entry("acme.com")])).rejects.toThrow(/typed_domain/);
  });

  it("refuses a control flag without the control type", async () => {
    await expect(load([entry("Acme", { control: true })])).rejects.toThrow(
      /control/,
    );
  });
});
