/**
 * File: golden.ts
 * Purpose: The golden set: Zod schema for one app's hand-researched answers, a loader for evals/golden/*.json and the set selector.
 * Exports: GoldenSchema, Golden, GateValue, loadGolden, selectGolden, GOLDEN_DIR
 * Used by: evals/scoring/*, evals/lib/run-batch.ts, evals/cli.ts
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

export const GOLDEN_DIR = fileURLToPath(new URL("../golden/", import.meta.url));

const Source = z.strictObject({
  url: z.string().url(),
  quote: z.string().min(1),
});

const GateSchema = z.enum([
  "unknown",
  "none",
  "optional_listing",
  "required_to_scale",
  "security_assessment",
  "partner_vetting",
]);
export type GateValue = z.infer<typeof GateSchema>;

const Confidence = z.enum(["high", "medium", "low"]);
const Range = z.strictObject({
  label: z.string().min(1),
  minDays: z.number().nonnegative(),
  maxDays: z.number().nonnegative(),
});

const ValidRegex = z.string().refine((pattern) => {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}, "namePattern must be a valid regular expression");

const WaitSchema = z
  .strictObject({
    kind: z.enum(["range", "none", "unknown"]),
    minDays: z.number().nonnegative().optional(),
    maxDays: z.number().nonnegative().optional(),
    stated: z.string().min(1),
    derivation: z.string().optional(),
    confidence: Confidence,
    // At most one alternate range: the rule is two accepted values per field.
    alsoValid: z.array(Range).max(1).optional(),
    source: Source.optional(),
    moreSources: z.array(Source).optional(),
  })
  .refine(
    (wait) =>
      wait.kind !== "range" ||
      (wait.minDays !== undefined &&
        wait.maxDays !== undefined &&
        wait.minDays <= wait.maxDays),
    "a range wait needs minDays not above maxDays",
  );

export const GoldenSchema = z.strictObject({
  slug: z.string().min(1),
  set: z.enum(["tuning", "holdout"]),
  typedNames: z.array(z.string().min(1)).min(1),
  researchedOn: z.string().min(1),
  product: z.strictObject({ name: z.string().min(1), source: Source }),
  docs: z.strictObject({
    domains: z.array(z.string().min(1)).min(1),
    pathHints: z.array(z.string()),
  }),
  oauthAppCreation: z.strictObject({
    where: z.string().min(1),
    source: Source,
  }),
  reviewGate: z.strictObject({
    value: GateSchema,
    alsoAccept: z.array(GateSchema).max(1),
    confidence: Confidence,
    trigger: z.string().min(1),
    source: Source,
    moreSources: z.array(Source).optional(),
  }),
  approvalWait: WaitSchema,
  testBeforeApproval: z.strictObject({
    possible: z.boolean(),
    how: z.string().min(1),
    source: Source,
  }),
  scopes: z.strictObject({
    kind: z.enum(["scope_strings", "capabilities"]),
    namePattern: ValidRegex,
    namePatternFlags: z.string().optional(),
    knownFake: z.array(z.string()),
    offSurface: z
      .strictObject({
        names: z.array(z.string()).min(1),
        why: z.string().min(1),
        source: Source,
      })
      .optional(),
    real: z
      .array(z.strictObject({ name: z.string().min(1), source: Source }))
      .min(3)
      .max(6),
  }),
  blockers: z
    .array(
      z.strictObject({
        summary: z.string().min(1),
        kind: z.enum(["approval", "setup", "limit"]),
        keywords: z.array(z.string().min(1)).min(1),
        source: Source,
      }),
    )
    .min(2),
  avoidProducts: z.array(
    z.strictObject({
      name: z.string().min(1),
      severity: z.enum(["hard", "soft"]),
      hostPathHints: z.array(z.string().min(1)).min(1),
      why: z.string().min(1),
      evidence: z.string().min(1),
    }),
  ),
  notes: z.array(z.string()),
});
export type Golden = z.infer<typeof GoldenSchema>;

/** Reads and validates every golden file; a file that fails the schema stops the run with its name. */
export async function loadGolden(dir: string = GOLDEN_DIR): Promise<Golden[]> {
  const files = (await readdir(dir)).filter((name) => name.endsWith(".json"));
  const all = await Promise.all(
    files.sort().map(async (name) => {
      const parsed = GoldenSchema.safeParse(
        JSON.parse(await readFile(join(dir, name), "utf8")),
      );
      if (!parsed.success) {
        const paths = parsed.error.issues.map((i) => i.path.join("."));
        throw new Error(
          `Golden file ${name} is invalid at: ${paths.join(", ")}`,
        );
      }
      return parsed.data;
    }),
  );
  return all;
}

/** "tuning" or "holdout" picks a whole set; anything else must be a golden slug. */
export function selectGolden(
  all: readonly Golden[],
  selector: string,
): Golden[] {
  if (selector === "tuning" || selector === "holdout") {
    return all.filter((golden) => golden.set === selector);
  }
  const one = all.find((golden) => golden.slug === selector);
  if (!one) {
    const known = all.map((golden) => golden.slug).join(", ");
    throw new Error(
      `Unknown golden "${selector}". Use tuning, holdout or one of: ${known}`,
    );
  }
  return [one];
}
