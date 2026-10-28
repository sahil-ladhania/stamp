/**
 * File: script.ts
 * Purpose: The scripted, typed event plan for each stub scenario, matching docs/api-design.md.
 * Exports: buildPlan, StubPlan, StageScript
 * Used by: agent/stub/run-stub-agent.ts
 */
import { STAGES, type Guide, type StageId } from "@stamp/schema";
import type { AgentFailure } from "../agent-failure.js";
import type { AgentEvent } from "../run-agent.js";
import { scenarioFor, type StubScenario } from "./scenarios.js";
import { buildStubGuide, listClaims, stubPages } from "./stub-guide.js";

/** One stage: the events emitted between its stage.started and stage.done (those two are added by the runner). */
export type StageScript = { stage: StageId; events: AgentEvent[] };

export type StubPlan =
  | {
      kind: "guide";
      stages: StageScript[];
      guide: Guide;
      status: "done" | "partial";
    }
  | {
      kind: "failure";
      stages: StageScript[];
      failing: StageScript;
      failure: AgentFailure;
    };

function titleWords(slug: string): string {
  return slug.replace(/-/g, " ");
}

function searchEvents(runId: string, slug: string): AgentEvent[] {
  const name = titleWords(slug);
  return [
    `${name} oauth app setup`,
    `${name} oauth scopes`,
    `${name} app review requirements`,
    `${name} install limits`,
  ].map((query) => ({ type: "search.query", runId, query }));
}

function pageEvents(runId: string, slug: string): AgentEvent[] {
  return stubPages(slug).map(({ url, tier }) => ({
    type: "page.fetched",
    runId,
    url,
    tier,
  }));
}

/** claim.verified for every sourced claim, claim.downgraded for the claims that fell back to uncertain. */
function claimEvents(
  runId: string,
  guide: Guide,
  partial: boolean,
): AgentEvent[] {
  const claims = listClaims(guide);
  const verified: AgentEvent[] = claims
    .filter((claim) => claim.label === "sourced")
    .map((claim) => ({
      type: "claim.verified",
      runId,
      claimId: claim.id,
      url: claim.sources[0]?.url ?? "",
    }));
  const downgradedIds = partial
    ? ["blockers.0.symptom", "blockers.0.cause", "blockers.0.fix", "limits.0"]
    : ["limits.0"];
  const downgraded: AgentEvent[] = downgradedIds.map((claimId) => ({
    type: "claim.downgraded",
    runId,
    claimId,
    reason: partial ? "time_budget" : "quote_not_found",
  }));
  return [...verified, ...downgraded];
}

function stagesUpTo(
  last: number,
  runId: string,
  slug: string,
  guide: Guide,
  partial: boolean,
): StageScript[] {
  const eventsByStage = new Map<number, AgentEvent[]>([
    [2, searchEvents(runId, slug)],
    [3, pageEvents(runId, slug)],
    [5, claimEvents(runId, guide, partial)],
  ]);
  return STAGES.filter((stage) => stage.id <= last).map((stage) => ({
    stage: stage.id,
    events: eventsByStage.get(stage.id) ?? [],
  }));
}

function failure(
  stage: StageId,
  code: AgentFailure["code"],
  text: string,
): AgentFailure {
  return { stage, code, message: `Stub scenario: ${text}` };
}

/** Builds the plan for a run; the scenario comes from the slug, everything else is fixed test data. */
export function buildPlan(runId: string, slug: string, asOf: Date): StubPlan {
  const scenario: StubScenario = scenarioFor(slug);
  const partial = scenario === "partial";
  const guide = buildStubGuide({ slug, partial, asOf });
  const stages = (last: number): StageScript[] =>
    stagesUpTo(last, runId, slug, guide, partial);

  switch (scenario) {
    case "error":
      return {
        kind: "failure",
        stages: stages(3),
        failing: { stage: 4, events: [] },
        failure: failure(
          4,
          "INTERNAL",
          "simulated INTERNAL failure while extracting facts.",
        ),
      };
    case "ambiguous":
      return {
        kind: "failure",
        stages: [],
        failing: { stage: 0, events: [] },
        failure: {
          ...failure(0, "AMBIGUOUS_APP", "this name matches two apps."),
          options: [
            { name: "Stub Alpha", domain: "alpha.example.com" },
            { name: "Stub Beta", domain: "beta.example.com" },
          ],
        },
      };
    case "notoauth":
      return {
        kind: "failure",
        stages: stages(2),
        failing: { stage: 3, events: pageEvents(runId, slug).slice(0, 2) },
        failure: failure(3, "NOT_OAUTH", "simulated API-key-only app."),
      };
    default:
      return {
        kind: "guide",
        stages: stages(8),
        guide,
        status: partial ? "partial" : "done",
      };
  }
}
