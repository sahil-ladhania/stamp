/**
 * File: verdict-questions.ts
 * Purpose: The four questions the verdict answers first, each tied to the row of the verdict that answers it.
 * Exports: VERDICT_QUESTIONS
 * Used by: components/landing/VerdictSection.tsx
 */
import type { VerdictRowId } from "@/utils/verdict";

// From docs/solution.md section 2.
export const VERDICT_QUESTIONS: readonly { question: string; answer: string; row: VerdictRowId }[] = [
  {
    question: "How hard is it?",
    answer: "A difficulty score from 1 to 5, with the reason behind it.",
    row: "difficulty",
  },
  {
    question: "How long will it take?",
    answer: "Two milestones: the first test connection and production.",
    row: "firstTest",
  },
  {
    question: "What could block me?",
    answer: "Blocker cards with the symptom, cause, fix and who to contact.",
    row: "topBlocker",
  },
  {
    question: "What can an agent do for me?",
    answer: "Every step is marked agent, human or agent-assist.",
    row: "nextStep",
  },
];
