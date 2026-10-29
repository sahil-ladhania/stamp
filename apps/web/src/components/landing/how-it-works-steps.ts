/**
 * File: how-it-works-steps.ts
 * Purpose: The three steps from a search to a shared guide. A real sequence, so the steps are numbered. Content from
 *          docs/solution.md and docs/flow.md.
 * Exports: HowStep, HOW_STEPS
 * Used by: components/landing/HowItWorksStepper.tsx
 */
export type HowStep = { id: "search" | "research" | "share"; title: string; body: string };

export const HOW_STEPS: readonly HowStep[] = [
  {
    id: "search",
    title: "Search an app",
    body: "Type a name or a website. A guide that already exists opens straight away.",
  },
  {
    id: "research",
    title: "Watch the research",
    body: "An app with no guide yet is researched live. You see each search, each page and each claim kept or marked Uncertain.",
  },
  {
    id: "share",
    title: "Share the guide",
    body: "Copy a link with the date and every source, and send it to your team.",
  },
];
