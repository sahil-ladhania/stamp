/**
 * File: export-guides.test.ts
 * Purpose: Tests the guide exporter: it copies a passing guide without changing it, refuses a failing one and writes nothing for it, and keeps each guide separate.
 * Exports: (none)
 * Used by: vitest
 */
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GuideSchema } from "@stamp/schema";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { exportGuides, libraryFileText } from "./export-guides.js";
import { claim, libraryGuide, thirdParty } from "./fixtures/library-guide.js";

let dir = "";
const runDir = () => join(dir, "run");
const outDir = () => join(dir, "out");

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "library-export-"));
  await mkdir(runDir());
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const save = (slug: string, guide: unknown) =>
  writeFile(join(runDir(), `${slug}.guide.json`), JSON.stringify(guide));
const run = (slugs: string[]) =>
  exportGuides({ runDir: runDir(), slugs, outDir: outDir() });

describe("exportGuides", () => {
  it("copies a passing guide as a library guide and changes nothing else in it", async () => {
    const guide = libraryGuide();
    await save("acme", guide);
    const [outcome] = await run(["acme"]);
    expect(outcome).toMatchObject({
      slug: "acme",
      status: "written",
      failures: [],
    });
    const written = JSON.parse(
      await readFile(join(outDir(), "acme.json"), "utf8"),
    );
    expect(written).toEqual({ ...guide, mode: "library" });
    expect(GuideSchema.safeParse(written).success).toBe(true);
  });

  it("writes the same bytes when run twice", async () => {
    await save("acme", libraryGuide());
    await run(["acme"]);
    const first = await readFile(join(outDir(), "acme.json"), "utf8");
    await run(["acme"]);
    expect(await readFile(join(outDir(), "acme.json"), "utf8")).toBe(first);
    expect(first.endsWith("}\n")).toBe(true);
  });

  it("refuses a failing guide, names the claim, and writes no file", async () => {
    await save(
      "acme",
      libraryGuide({
        requirements: [claim("requirements.0", "sourced", [thirdParty])],
      }),
    );
    const [outcome] = await run(["acme"]);
    expect(outcome?.status).toBe("refused");
    expect(outcome?.failures).toEqual([
      {
        rule: "official_source",
        claimId: "requirements.0",
        message: "sourced claim with no official source",
      },
    ]);
    expect(existsSync(join(outDir(), "acme.json"))).toBe(false);
  });

  it("does not let one failing guide stop the next", async () => {
    await save("bad", libraryGuide({ slug: "bad", coverage: "partial" }));
    await save("good", libraryGuide({ slug: "good" }));
    const outcomes = await run(["bad", "good"]);
    expect(outcomes.map((o) => [o.slug, o.status])).toEqual([
      ["bad", "refused"],
      ["good", "written"],
    ]);
    expect(existsSync(join(outDir(), "good.json"))).toBe(true);
  });

  it("reports a guide that is not in the run folder as missing", async () => {
    expect((await run(["nothing"]))[0]).toMatchObject({
      slug: "nothing",
      status: "missing",
    });
  });

  it("refuses a file that is not JSON", async () => {
    await writeFile(join(runDir(), "acme.guide.json"), "{ not json");
    expect((await run(["acme"]))[0]?.failures[0]?.rule).toBe("schema");
  });

  it.each(["../escape", "a/b", "Acme", ""])(
    "refuses the slug %j, which is not a file name",
    async (slug) => {
      const [outcome] = await run([slug]);
      expect(outcome?.status).toBe("refused");
      expect(outcome?.failures[0]?.rule).toBe("slug");
    },
  );
});

describe("libraryFileText", () => {
  it("sets the mode to library and keeps the schema's key order", () => {
    const keys = Object.keys(JSON.parse(libraryFileText(libraryGuide())));
    expect(keys.slice(0, 6)).toEqual([
      "schemaVersion",
      "slug",
      "appName",
      "domain",
      "mode",
      "archetype",
    ]);
    expect(JSON.parse(libraryFileText(libraryGuide())).mode).toBe("library");
  });
});
