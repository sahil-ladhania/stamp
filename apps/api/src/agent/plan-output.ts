/**
 * File: plan-output.ts
 * Purpose: The plan stage's structured model output: one search query per topic, or null when the model would have to guess.
 * Exports: QUERY_TOPICS, QueryTopic, PlanOutputSchema, PlanOutput
 * Used by: agent/queries.ts, agent/prompts/plan.ts, agent/nodes/plan.ts
 */
import { z } from "zod";

/** What the research needs to find out, in the order the queries run. */
export const QUERY_TOPICS = [
  "setup",
  "scopes",
  "review",
  "limits",
  "authType",
  "approvalWait",
] as const;
export type QueryTopic = (typeof QUERY_TOPICS)[number];

/** A search query, or null for "unknown": the model could not write a useful one without guessing. */
const QueryOrUnknown = z.string().nullable();

export const PlanOutputSchema = z.strictObject({
  setup: QueryOrUnknown,
  scopes: QueryOrUnknown,
  review: QueryOrUnknown,
  limits: QueryOrUnknown,
  authType: QueryOrUnknown,
  approvalWait: QueryOrUnknown,
});
export type PlanOutput = z.infer<typeof PlanOutputSchema>;
