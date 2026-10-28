/**
 * File: difficulty.ts
 * Purpose: Difficulty breakdown stored on a guide (computed by code, not the model).
 * Exports: DifficultyBreakdownSchema
 * Used by: guide/guide.ts
 */
import { z } from "zod";
import { difficultyScoreForTotal } from "../constants.js";

export const DifficultyBreakdownSchema = z
  .strictObject({
    reviewGate: z.number().int().min(0).max(3),
    approvalWait: z.number().int().min(0).max(3),
    prerequisites: z.number().int().min(0).max(2),
    hiddenLimits: z.number().int().min(0).max(1),
    total: z.number().int().min(0).max(9),
    score: z.number().int().min(1).max(5),
  })
  .superRefine((value, ctx) => {
    const sum =
      value.reviewGate +
      value.approvalWait +
      value.prerequisites +
      value.hiddenLimits;
    if (sum !== value.total) {
      ctx.addIssue({
        code: "custom",
        message: "total must equal the sum of the four factors",
        path: ["total"],
      });
    }
    const expectedScore = difficultyScoreForTotal(value.total);
    if (value.score !== expectedScore) {
      ctx.addIssue({
        code: "custom",
        message: `score must be ${expectedScore} for total ${value.total}`,
        path: ["score"],
      });
    }
  });
export type DifficultyBreakdown = z.infer<typeof DifficultyBreakdownSchema>;
