/**
 * File: verify-sections.ts
 * Purpose: The anchor ids and short names of the How we verify sections, shared by the contents row and the sections.
 * Exports: VERIFY_SECTIONS
 * Used by: components/verify/VerifyIntro.tsx
 */

export const VERIFY_SECTIONS = [
  { id: "labels", navLabel: "The three labels" },
  { id: "quote-check", navLabel: "Code checks every quote" },
  { id: "conflicts", navLabel: "When sources disagree" },
  { id: "difficulty", navLabel: "How difficulty is scored" },
  { id: "limits", navLabel: "Run limits" },
  { id: "cannot-verify", navLabel: "What Stamp cannot verify" },
] as const;
