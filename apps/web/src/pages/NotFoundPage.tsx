/**
 * File: NotFoundPage.tsx
 * Purpose: Catch-all route `*`. Works out the address and what the visitor likely meant, then composes the panel.
 * Exports: NotFoundPage
 * Used by: router.tsx
 */
import type { ReactElement } from "react";
import { useLocation } from "react-router";
import { NotFoundPanel } from "@/components/not-found/NotFoundPanel";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useMockScenario } from "@/hooks/useMockScenario";
import { NOT_FOUND_MOCK_PATHS } from "@/mocks/not-found";
import { PAGE_SCENARIOS } from "@/mocks/scenarios";
import { getNotFoundHint } from "@/utils/not-found-hint";

export function NotFoundPage(): ReactElement {
  useDocumentTitle("Page not found");
  const { pathname } = useLocation();
  const { scenario } = useMockScenario(PAGE_SCENARIOS["not-found"]);
  // `?state=` swaps in a mock address so every state can be reviewed; otherwise the real one is used.
  const path =
    scenario === "default" ? pathname : NOT_FOUND_MOCK_PATHS[scenario];

  return <NotFoundPanel path={path} hint={getNotFoundHint(path)} />;
}
