/**
 * File: queries.ts
 * Purpose: Builds the run's search queries in code: default templates, the checked model suggestions merged in, and retry wording.
 * Exports: PlannedQuery, OPEN_TOPICS, searchName, defaultQueries, acceptQuery, mergePlan, retryQueries
 * Used by: agent/nodes/plan.ts, agent/search/jobs.ts, agent/state.ts
 */
import { nameKey } from "../utils/name-key.js";
import {
  QUERY_TOPICS,
  type PlanOutput,
  type QueryTopic,
} from "./plan-output.js";

export type PlannedQuery = { topic: QueryTopic; text: string };

/** Topics also searched across the whole web, to find third-party and forum reports. */
export const OPEN_TOPICS: readonly QueryTopic[] = ["review", "approvalWait"];

/**
 * What every query is about: the product phrase when the run has one ("Gmail API"), else the app's name.
 * It goes where the functions below take a name, so templates carry it and a model query must contain it.
 */
export function searchName(app: {
  appName: string;
  product: string | null;
}): string {
  return app.product ?? app.appName;
}

const TEMPLATES: Record<QueryTopic, (name: string) => string> = {
  setup: (name) => `${name} OAuth app setup client ID redirect URI`,
  scopes: (name) => `${name} OAuth scopes permissions`,
  review: (name) => `${name} OAuth app review approval requirements`,
  limits: (name) => `${name} API rate limits app install limits`,
  authType: (name) => `${name} API authentication OAuth or API key`,
  approvalWait: (name) => `${name} OAuth app approval how long does it take`,
};

/** One template query per topic: what a run searches when the model gives nothing usable. */
export function defaultQueries(name: string): PlannedQuery[] {
  return QUERY_TOPICS.map((topic) => ({ topic, text: TEMPLATES[topic](name) }));
}

const MIN_QUERY_CHARS = 8;
const MAX_QUERY_CHARS = 160;
const MIN_WORDS = 3;
const MAX_WORDS = 16;

/**
 * A model suggestion, cleaned, or null if it should not be used. Anything but letters, digits, spaces and
 * a few plain marks is dropped (this removes quotes and operators like "site:"), and a query must mention
 * the app and stay short. It is only ever a search string: it is never run as an instruction.
 */
export function acceptQuery(name: string, raw: string | null): string | null {
  if (raw === null || /:\/\/|www\./i.test(raw)) {
    return null;
  }
  const text = raw
    .replace(/[^\p{L}\p{N} .,&+'/#-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = text.split(" ").length;
  const key = nameKey(name);
  const mentionsApp = key === "" || nameKey(text).includes(key);
  const sized =
    text.length >= MIN_QUERY_CHARS &&
    text.length <= MAX_QUERY_CHARS &&
    words >= MIN_WORDS &&
    words <= MAX_WORDS;
  return sized && mentionsApp ? text : null;
}

/** The run's queries: the model's suggestion for each topic where it passes the checks, else the template. */
export function mergePlan(
  name: string,
  plan: PlanOutput | null,
): PlannedQuery[] {
  const queries: PlannedQuery[] = [];
  const seen = new Set<string>();
  for (const topic of QUERY_TOPICS) {
    const text =
      (plan ? acceptQuery(name, plan[topic]) : null) ?? TEMPLATES[topic](name);
    if (!seen.has(text.toLowerCase())) {
      seen.add(text.toLowerCase());
      queries.push({ topic, text });
    }
  }
  return queries;
}

const setupRetry = (name: string): PlannedQuery => ({
  topic: "setup",
  text: `${name} how to create an OAuth app step by step guide`,
});

/** Retry wording per guide section, different from the first-pass templates so the search finds new pages. */
const RETRY_TEMPLATES: Record<string, (name: string) => PlannedQuery> = {
  reviewGate: (name) => ({
    topic: "review",
    text: `${name} OAuth app review process who approves apps`,
  }),
  steps: setupRetry,
  scopes: (name) => ({
    topic: "scopes",
    text: `${name} OAuth scopes list required permissions access token`,
  }),
  requirements: (name) => ({
    topic: "review",
    text: `${name} OAuth app requirements before you can start`,
  }),
  blockers: (name) => ({
    topic: "review",
    text: `${name} OAuth app review rejected common problems`,
  }),
  limits: (name) => ({
    topic: "limits",
    text: `${name} API limits caps restrictions apps`,
  }),
};

const MAX_RETRY_QUERIES = 3;

/** Differently worded queries for the sections that had no matched quote: at most three, and never from the model. */
export function retryQueries(
  name: string,
  missingSections: string[],
): PlannedQuery[] {
  const queries = [
    ...new Map(
      missingSections
        .flatMap((section) => {
          const template = RETRY_TEMPLATES[section];
          return template ? [template(name)] : [];
        })
        .map((query) => [query.text, query] as const),
    ).values(),
  ].slice(0, MAX_RETRY_QUERIES);
  return queries.length > 0 ? queries : [setupRetry(name)];
}
