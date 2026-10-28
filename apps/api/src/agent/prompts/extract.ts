/**
 * File: extract.ts
 * Purpose: Builds the messages for one extraction call and for its one schema repair.
 * Exports: extractMessages, repairMessages, MAX_REPAIR_ECHO_CHARS, ExtractPromptInput
 * Used by: agent/extract/run-section.ts
 */
import type { ChatMessage } from "../../lib/openai-client.js";
import type { Excerpt } from "../extract/passages.js";
import type { SectionId } from "../extract/sections.js";
import { SECTION_INSTRUCTIONS } from "./extract-sections.js";
import { EXTRACT_RULES, inert, renderSources } from "./shared.js";

export type ExtractPromptInput = {
  section: SectionId;
  app: { appName: string; domain: string };
  nonce: string;
  excerpts: readonly Excerpt[];
  /** Extra data for the section, such as the verdict's numbered steps and blockers. */
  context?: string;
};

/** How much of a bad reply is shown back to the model in a repair request. */
export const MAX_REPAIR_ECHO_CHARS = 3_000;

/** The system rules, then the app, the delimited sources and, last, the instruction for this one section. */
export function extractMessages(input: ExtractPromptInput): ChatMessage[] {
  const parts = [
    `App: ${inert(input.app.appName)} (${inert(input.app.domain)})`,
    input.context,
    renderSources(input.excerpts, input.nonce),
    SECTION_INSTRUCTIONS[input.section],
    "Reply with the JSON for this section only.",
  ].filter((part): part is string => part !== undefined && part !== "");
  return [
    { role: "system", content: EXTRACT_RULES(input.nonce) },
    { role: "user", content: parts.join("\n\n") },
  ];
}

/** The same request plus the bad reply and the validation error, asking for a corrected reply once. */
export function repairMessages(
  original: ChatMessage[],
  badReply: string,
  problem: string,
): ChatMessage[] {
  return [
    ...original,
    { role: "assistant", content: badReply.slice(0, MAX_REPAIR_ECHO_CHARS) },
    {
      role: "user",
      content: `That reply was not accepted: ${problem}\nReply again with corrected JSON only. Keep answers you cannot support as null or an empty list.`,
    },
  ];
}
