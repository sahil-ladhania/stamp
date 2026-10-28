/**
 * File: nav-items.ts
 * Purpose: The site's top-level links, shared by the header and the footer.
 * Exports: NAV_ITEMS
 * Used by: SiteHeader.tsx, SiteFooter.tsx
 */

export const NAV_ITEMS = [
  { to: '/app', label: 'Library' },
  { to: '/how-we-verify', label: 'How we verify' },
] as const
