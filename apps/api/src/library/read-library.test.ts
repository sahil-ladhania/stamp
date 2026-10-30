/**
 * File: read-library.test.ts
 * Purpose: Tests reading a library folder: files by name, each checked, bad files reported, other files and a missing folder ignored.
 * Exports: (none)
 * Used by: vitest
 */
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { libraryGuide } from "./fixtures/library-guide.js";
import { readLibraryDir } from "./read-library.js";

let dir = "";
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "library-read-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const put = (name: string, content: unknown) =>
  writeFile(
    join(dir, name),
    typeof content === "string" ? content : JSON.stringify(content),
  );
const libraryFile = (slug: string) => libraryGuide({ slug, mode: "library" });

describe("readLibraryDir", () => {
  it("reads the json files in name order and checks each one", async () => {
    await put("b.json", libraryFile("b"));
    await put("a.json", libraryFile("a"));
    const files = await readLibraryDir(dir);
    expect(files.map((f) => f.slug)).toEqual(["a", "b"]);
    expect(files.every((f) => f.check.failures.length === 0)).toBe(true);
  });

  it("ignores files that are not json, such as the review sheet", async () => {
    await put("REVIEW.md", "# notes");
    await put("a.json", libraryFile("a"));
    expect((await readLibraryDir(dir)).map((f) => f.slug)).toEqual(["a"]);
  });

  it("treats a folder that does not exist as an empty library", async () => {
    expect(await readLibraryDir(join(dir, "nope"))).toEqual([]);
  });

  it("fails a file that still says it is a live guide", async () => {
    await put("a.json", libraryGuide({ slug: "a", mode: "live" }));
    expect(
      (await readLibraryDir(dir))[0]?.check.failures.map((f) => f.rule),
    ).toEqual(["mode"]);
  });

  it("fails a file whose slug differs from its name", async () => {
    await put("a.json", libraryFile("other"));
    expect(
      (await readLibraryDir(dir))[0]?.check.failures.map((f) => f.rule),
    ).toEqual(["slug"]);
  });

  it("fails a file that is not JSON instead of throwing", async () => {
    await put("a.json", "{ nope");
    expect((await readLibraryDir(dir))[0]?.check).toMatchObject({
      guide: null,
      failures: [{ rule: "schema" }],
    });
  });

  it("reads an empty folder as an empty library", async () => {
    await mkdir(join(dir, "empty"));
    expect(await readLibraryDir(join(dir, "empty"))).toEqual([]);
  });
});
