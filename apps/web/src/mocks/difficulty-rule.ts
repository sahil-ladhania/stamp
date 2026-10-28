/**
 * File: difficulty-rule.ts
 * Purpose: DISPLAY COPY of the difficulty rule in docs/solution.md section 6, for the How we verify page.
 *          The real rule lives in code (apps/api). This copy can drift from it, so import the rule
 *          from @stamp/schema once the schema exports it, and delete this file.
 * Exports: POINT_COLUMNS, RuleFactor, DIFFICULTY_FACTORS, ScoreBand, SCORE_BANDS
 * Used by: components/verify/DifficultyRuleTable.tsx, components/verify/ScoreBands.tsx
 */

export const POINT_COLUMNS = [0, 1, 2, 3] as const;

/** `cells[points]` is the text for that many points; null means the rule has no such level. */
export type RuleFactor = { name: string; cells: readonly (string | null)[] };

// Factor names match the `factors` in the mock guides, so an example can be looked up by name.
export const DIFFICULTY_FACTORS: readonly RuleFactor[] = [
  {
    name: "Review gate",
    cells: [
      "None",
      "Optional listing",
      "Required to scale",
      "Security assessment or partner vetting",
    ],
  },
  {
    name: "Approval wait",
    cells: [
      "Under 1 day",
      "1 to 7 days",
      "1 to 4 weeks, or unknown",
      "Over 4 weeks",
    ],
  },
  { name: "Prerequisites", cells: ["None", "1", "2 or more", null] },
  { name: "Hidden limits", cells: ["None", "1 or more", null, null] },
];

export type ScoreBand = {
  range: string;
  min: number;
  max: number;
  score: 1 | 2 | 3 | 4 | 5;
};

export const SCORE_BANDS: readonly ScoreBand[] = [
  { range: "0 to 1", min: 0, max: 1, score: 1 },
  { range: "2 to 3", min: 2, max: 3, score: 2 },
  { range: "4 to 5", min: 4, max: 5, score: 3 },
  { range: "6 to 7", min: 6, max: 7, score: 4 },
  { range: "8 to 9", min: 8, max: 9, score: 5 },
];
