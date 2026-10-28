/**
 * File: assemble-sections.ts
 * Purpose: Builds each guide section from the drafts and the verified claims; every gap becomes an Uncertain unknown claim that says why.
 * Exports: buildVerdict, buildMilestones, buildRequirements, buildLimits, buildScopes, buildSteps, buildBlockers
 * Used by: agent/guide/assemble.ts
 */
import type {
  Blocker,
  Claim,
  Milestones,
  Scope,
  Step,
  Verdict,
} from "@stamp/schema";
import type { Drafts } from "../state.js";
import type { ClaimResolver } from "./claim-lookup.js";
import { slotId } from "./claim-slots.js";
import { makeUnknownClaim, unknownWhy } from "./unknown-claim.js";

export function buildSteps(drafts: Drafts, resolve: ClaimResolver): Step[] {
  if (drafts.steps?.status !== "drafted") return [];
  return drafts.steps.payload.steps.map((step, i) => ({
    id: slotId.step(i),
    title: step.title,
    detail: resolve(slotId.stepPart(i, "detail"), step.detail),
    actor: step.actor,
    effort: resolve(slotId.stepPart(i, "effort"), step.effort),
  }));
}

export function buildScopes(drafts: Drafts, resolve: ClaimResolver): Scope[] {
  if (drafts.scopes?.status !== "drafted") return [];
  return drafts.scopes.payload.scopes.map((scope, i) => ({
    id: slotId.scope(i),
    name: scope.name,
    reason: resolve(slotId.scopeReason(i), scope.reason),
  }));
}

export function buildBlockers(
  drafts: Drafts,
  resolve: ClaimResolver,
): Blocker[] {
  if (drafts.blockers?.status !== "drafted") return [];
  return drafts.blockers.payload.blockers.map((blocker, i) => ({
    id: slotId.blocker(i),
    symptom: resolve(slotId.blockerPart(i, "symptom"), blocker.symptom),
    cause: resolve(slotId.blockerPart(i, "cause"), blocker.cause),
    fix: resolve(slotId.blockerPart(i, "fix"), blocker.fix),
    contact:
      blocker.contact === null
        ? null
        : resolve(slotId.blockerPart(i, "contact"), blocker.contact),
  }));
}

/** A list of claims that must not be empty: with none, one unknown claim says so. */
function listOrUnknown(
  claims: Claim[],
  id: string,
  section: Drafts["requirements"] | Drafts["limits"],
): Claim[] {
  return claims.length > 0
    ? claims
    : [makeUnknownClaim(id, unknownWhy(section))];
}

export function buildRequirements(
  drafts: Drafts,
  resolve: ClaimResolver,
): Claim[] {
  const claims =
    drafts.requirements?.status === "drafted"
      ? drafts.requirements.payload.requirements.map((c, i) =>
          resolve(slotId.requirement(i), c),
        )
      : [];
  return listOrUnknown(claims, slotId.requirement(0), drafts.requirements);
}

export function buildLimits(drafts: Drafts, resolve: ClaimResolver): Claim[] {
  const claims =
    drafts.limits?.status === "drafted"
      ? drafts.limits.payload.limits.map((c, i) => resolve(slotId.limit(i), c))
      : [];
  return listOrUnknown(claims, slotId.limit(0), drafts.limits);
}

export function buildMilestones(
  drafts: Drafts,
  resolve: ClaimResolver,
): Milestones {
  const section = drafts.milestones;
  const payload = section?.status === "drafted" ? section.payload : null;
  const why = unknownWhy(section);
  const claim = (
    milestone: "firstTest" | "production",
    part: "effort" | "wait",
    draft: Parameters<ClaimResolver>[1],
  ) => resolve(slotId.milestone(milestone, part), draft, why);
  return {
    firstTest: {
      effort: claim("firstTest", "effort", payload?.firstTestEffort ?? null),
      wait: claim("firstTest", "wait", payload?.firstTestWait ?? null),
    },
    production: {
      effort: claim("production", "effort", payload?.productionEffort ?? null),
      wait: claim("production", "wait", payload?.productionWait ?? null),
    },
  };
}

/** The verdict points at a step and a blocker by position; a position with nothing behind it is null. */
export function buildVerdict(
  drafts: Drafts,
  resolve: ClaimResolver,
  counts: { steps: number; blockers: number },
): Verdict {
  const section = drafts.verdict;
  const payload = section?.status === "drafted" ? section.payload : null;
  const pick = (
    index: number | null | undefined,
    count: number,
    id: (i: number) => string,
  ) =>
    index !== null && index !== undefined && index >= 0 && index < count
      ? id(index)
      : null;
  return {
    summary: resolve(
      slotId.verdictSummary,
      payload?.summary ?? null,
      unknownWhy(section),
    ),
    nextStepId: pick(payload?.nextStepIndex, counts.steps, slotId.step),
    topBlockerId: pick(
      payload?.topBlockerIndex,
      counts.blockers,
      slotId.blocker,
    ),
  };
}
