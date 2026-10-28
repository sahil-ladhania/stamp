/**
 * File: gate-facts.ts
 * Purpose: Shared gate-fact builders for the scoring tests.
 * Exports: baseFacts, facts, days
 * Used by: scoring/difficulty*.test.ts
 */
import type { ApprovalWait, GateFacts } from "../difficulty.js";

export const baseFacts: GateFacts = {
  reviewGate: "unknown",
  approvalWait: "none",
  prerequisites: 0,
  hiddenLimits: 0,
  needsEnterprisePlan: false,
};

/** Facts with only the given fields changed. */
export const facts = (overrides: Partial<GateFacts>): GateFacts => ({
  ...baseFacts,
  ...overrides,
});

/** An approval wait range in days. */
export const days = (minDays: number, maxDays: number): ApprovalWait => ({
  minDays,
  maxDays,
});
