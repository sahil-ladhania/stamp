/**
 * File: verify-sections.ts
 * Purpose: The anchor ids and short names of the How we verify sections, as the entries of the section navigation.
 * Exports: VERIFY_NAV_ITEMS
 * Used by: pages/HowWeVerifyPage.tsx
 */
import type { NavItem } from "@/components/nav/nav-item";

export const VERIFY_NAV_ITEMS: readonly NavItem[] = [
  { id: "labels", label: "The three labels" },
  { id: "quote-check", label: "Code checks every quote" },
  { id: "conflicts", label: "When sources disagree" },
  { id: "difficulty", label: "How difficulty is scored" },
  { id: "limits", label: "Run limits" },
  { id: "cannot-verify", label: "What Stamp cannot verify" },
];
