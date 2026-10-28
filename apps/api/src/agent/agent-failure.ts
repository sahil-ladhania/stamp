/**
 * File: agent-failure.ts
 * Purpose: Typed stage failures before mapping to run.error SSE events, and a builder with the standard message.
 * Exports: AgentFailure, AgentFailureCode, makeFailure
 * Used by: agent graph nodes, agent/run-real-agent.ts
 */
import type { RunErrorCode } from "@stamp/schema";
import { RUN_ERROR_MESSAGES } from "../services/run-messages.js";

export type AgentFailureCode = RunErrorCode;

export type AgentFailure = {
  stage: number;
  code: AgentFailureCode;
  message: string;
  options?: { name: string; domain: string }[];
};

/** A failure with the plain-language message for its code; `options` is for AMBIGUOUS_APP only. */
export function makeFailure(
  stage: number,
  code: AgentFailureCode,
  options?: AgentFailure["options"],
): AgentFailure {
  return {
    stage,
    code,
    message: RUN_ERROR_MESSAGES[code],
    ...(options ? { options } : {}),
  };
}
