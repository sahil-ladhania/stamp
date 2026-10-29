/**
 * File: read-library.ts
 * Purpose: Reads the committed library files (apps/api/library/<slug>.json) and runs the library check on each, so the seed, its dry run and the guard test read the same way.
 * Exports: readLibraryDir, LIBRARY_DIR, LibraryFile
 * Used by: scripts/db-seed.ts, library/library-files.test.ts
 */
import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkLibraryGuide, type LibraryCheck } from "./check-guide.js";

export const LIBRARY_DIR = fileURLToPath(
  new URL("../../library/", import.meta.url),
);

export type LibraryFile = { slug: string; check: LibraryCheck };

async function checkFile(dir: string, name: string): Promise<LibraryFile> {
  const slug = basename(name, ".json");
  let input: unknown;
  try {
    input = JSON.parse(await readFile(join(dir, name), "utf8"));
  } catch {
    const failure = {
      rule: "schema" as const,
      message: "the file is not valid JSON",
    };
    return { slug, check: { guide: null, failures: [failure], notes: [] } };
  }
  const check = checkLibraryGuide(input, slug);
  // A committed library file says it is one; the exporter writes it that way.
  if (check.guide && check.guide.mode !== "library") {
    check.failures.push({
      rule: "mode",
      message: `mode is "${check.guide.mode}", not "library"`,
    });
  }
  return { slug, check };
}

/** Every `*.json` file in the folder, by name, each checked. A folder that does not exist holds no guides. */
export async function readLibraryDir(
  dir: string = LIBRARY_DIR,
): Promise<LibraryFile[]> {
  let names: string[];
  try {
    names = (await readdir(dir))
      .filter((name) => name.endsWith(".json"))
      .sort();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  return Promise.all(names.map((name) => checkFile(dir, name)));
}
