/**
 * File: export-guides.ts
 * Purpose: Copies saved guides from an eval run folder into the library folder, only the ones that pass the library check. It never edits a guide: a guide that fails is left out and the reasons are returned.
 * Exports: exportGuides, libraryFileText, ExportOutcome, ExportStatus
 * Used by: scripts/library-export.ts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { GuideSchema, type Guide } from "@stamp/schema";
import { checkLibraryGuide, type LibraryFinding } from "./check-guide.js";

export type ExportStatus = "written" | "refused" | "missing";
export type ExportOutcome = {
  slug: string;
  status: ExportStatus;
  failures: LibraryFinding[];
  notes: string[];
};

/** A slug becomes a file name, so it may not hold a path. */
const SLUG = /^[a-z0-9][a-z0-9-]*$/;

/** The text of a library file: mode library, the schema's key order, two-space indent, a final newline. */
export function libraryFileText(guide: Guide): string {
  const parsed = GuideSchema.parse({ ...guide, mode: "library" });
  return `${JSON.stringify(parsed, null, 2)}\n`;
}

const refused = (
  slug: string,
  failures: LibraryFinding[],
  notes: string[] = [],
): ExportOutcome => ({
  slug,
  status: "refused",
  failures,
  notes,
});

async function exportOne(
  runDir: string,
  slug: string,
  outDir: string,
): Promise<ExportOutcome> {
  if (!SLUG.test(slug)) {
    return refused(slug, [{ rule: "slug", message: "not a valid app slug" }]);
  }
  let input: unknown;
  try {
    input = JSON.parse(
      await readFile(join(runDir, `${slug}.guide.json`), "utf8"),
    );
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { slug, status: "missing", failures: [], notes: [] };
    }
    return refused(slug, [
      { rule: "schema", message: "the file is not valid JSON" },
    ]);
  }
  const { guide, failures, notes } = checkLibraryGuide(input, slug);
  if (!guide || failures.length > 0) return refused(slug, failures, notes);
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, `${slug}.json`), libraryFileText(guide), "utf8");
  return { slug, status: "written", failures: [], notes };
}

/** One outcome per slug, in order. Each guide stands alone: one that fails does not stop the others. */
export async function exportGuides(input: {
  runDir: string;
  slugs: readonly string[];
  outDir: string;
}): Promise<ExportOutcome[]> {
  const outcomes: ExportOutcome[] = [];
  for (const slug of input.slugs) {
    outcomes.push(await exportOne(input.runDir, slug, input.outDir));
  }
  return outcomes;
}
