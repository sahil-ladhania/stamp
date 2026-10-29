/**
 * File: extract-sections.ts
 * Purpose: The instruction for each of the nine extraction sections, naming every field of its output schema.
 * Exports: SECTION_INSTRUCTIONS
 * Used by: agent/prompts/extract.ts
 */
import type { SectionId } from "../extract/sections.js";

export const SECTION_INSTRUCTIONS: Record<SectionId, string> = {
  steps: [
    "Section: steps. List the steps a developer takes to set up OAuth for this app, in order, from creating the app to getting an access token.",
    'Output {"steps": [...]}. Each step has: title (short, imperative), detail (a claim saying what to do), actor ("human" when a person must do it, "agent" when software can do it alone, "agent_assist" when software can help a person) and effort (a claim about how long or how hard the step is, or null).',
    "Use an empty list when the excerpts describe no setup steps.",
  ].join("\n"),
  scopes: [
    "Section: scopes. List the OAuth scopes or permissions an app can request.",
    'Output {"scopes": [...]}. Each has: name (exactly as written in the excerpts) and reason (a claim saying what the scope allows).',
    "A scope is a single string the provider defines for an app to request. It is not a role, a header, a placeholder, an example value or a half-written pattern, and it is not a permission of an administrator API. The quote must contain the name.",
    "Use an empty list when no scopes are described.",
  ].join("\n"),
  requirements: [
    "Section: requirements. List what must be in place before setup can start, such as a paid plan, a verified domain or a certain account type.",
    'Output {"requirements": [...]}, one claim for each requirement. Use an empty list when none are described.',
  ].join("\n"),
  blockers: [
    "Section: blockers. List problems that stop or delay getting OAuth working.",
    'Output {"blockers": [...]}. Each has: symptom (a claim: what the developer sees), cause (a claim or null), fix (a claim or null) and contact (a claim naming who to ask, or null).',
    "Use an empty list when no problems are described.",
  ].join("\n"),
  milestones: [
    "Section: milestones. Say how long it takes to reach two milestones.",
    "Output four claims, each a claim or null: firstTestEffort (how long it takes to make a first test call), firstTestWait (how long to wait before that works), productionEffort (how long it takes to prepare for production) and productionWait (how long approval or review takes before production). The quote must be the sentence that states the time, with a number of minutes, hours, days, weeks or months. Use null for anything the excerpts do not give a time for; never describe work instead of giving a time. The text you write is replaced by the time found in the quote.",
  ].join("\n"),
  gates: [
    "Section: gates. Fill in the facts behind the difficulty rating. Each fact needs a claim as evidence, or stays unknown.",
    "authMethod: oauth (the app supports OAuth), both (OAuth and API keys), api_key_only (API keys only, no OAuth) or unknown; authEvidence: the claim that backs it.",
    "A review gate is a review or approval of the developer's app by the provider, the company that runs the platform. An administrator or organisation owner approving apps for their own workspace or organisation is not a review gate. Use none only when a page says no review is needed; otherwise use unknown.",
    "reviewGate: unknown; none (no review needed); optional_listing (review only for an optional marketplace listing); required_to_scale (review needed to go past test accounts or install caps); security_assessment (a security assessment or audit is required); partner_vetting (the developer must become a vetted partner). reviewGateEvidence: the claim that backs it.",
    "approvalWait: unknown, none (no approval step) or range. For a range give approvalWaitMinDays and approvalWaitMaxDays as whole days (a week is 7 days; use null for both otherwise) and approvalWaitEvidence: the claim that states it.",
    "prerequisites: one claim for each distinct prerequisite before setup can start. hiddenLimits: one claim for each cap or limit that applies only after launch. enterprisePlanEvidence: a claim if an enterprise or other special plan is required, else null.",
  ].join("\n"),
  limits: [
    "Section: limits. List caps and limits that apply after launch, such as install caps and rate limits.",
    'Output {"limits": [...]}, one claim for each. Use an empty list when none are described.',
  ].join("\n"),
  conflicts: [
    "Section: conflicts. Find places where two sources disagree about the same fact, for example different review times.",
    'Output {"conflicts": [...]}. Each has: topic (short), sourceA and sourceB (claims from different urls), preferredUrl (the url you trust more; prefer official sources) and reason (a claim explaining the difference).',
    "Use an empty list when the sources do not disagree.",
  ].join("\n"),
  verdict: [
    "Section: verdict. Summarise how hard it is to set up OAuth for this app and what blocks it.",
    "Output summary (one claim backed by an excerpt, or null), nextStepIndex (the position, starting at 0, of the step to do first in the numbered steps below, or null) and topBlockerIndex (always null; code chooses the top blocker).",
    "Never state that something is absent or not needed unless an excerpt says so in those words.",
  ].join("\n"),
};
