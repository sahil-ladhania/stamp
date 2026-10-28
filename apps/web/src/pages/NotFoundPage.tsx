/**
 * File: NotFoundPage.tsx
 * Purpose: Catch-all route `*`. Passes the address to the panel, which works out what the visitor likely meant.
 * Exports: NotFoundPage
 * Used by: router.tsx
 */
import type { ReactElement } from "react";
import { useLocation } from "react-router";
import { NotFoundPanel } from "@/components/not-found/NotFoundPanel";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function NotFoundPage(): ReactElement {
  useDocumentTitle("Page not found");
  const { pathname } = useLocation();

  return <NotFoundPanel path={pathname} />;
}
