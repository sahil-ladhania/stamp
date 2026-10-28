/**
 * File: agent-failure.ts
 * Purpose: Typed stage failures before mapping to run.error SSE events.
 * Exports: AgentFailure, AgentFailureCode
 * Used by: agent graph nodes
 */
import type { RunErrorCode } from "@stamp/schema";

export type AgentFailureCode = RunErrorCode;

export type AgentFailure = {
  stage: number;
  code: AgentFailureCode;
  message: string;
  options?: { name: string; domain: string }[];
};
