/**
 * File: nav-item.ts
 * Purpose: The shape of one entry in the section navigation.
 * Exports: NavItem
 * Used by: components/nav/*, components/guide/guide-sections.ts, components/verify/verify-sections.ts
 */
export type NavItem = {
  /** The element id of the section it jumps to. */
  id: string;
  label: string;
  /** Shows the small Uncertain marker: the section is mostly Uncertain. */
  isUncertain?: boolean;
};
