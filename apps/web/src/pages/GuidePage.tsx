/**
 * File: GuidePage.tsx
 * Purpose: Guide route `/g/:slug`. Picks what to show: the guide, a stub, or the not-found panel for an unknown slug.
 * Exports: GuidePage
 * Used by: router.tsx
 */
import type { ReactElement } from "react";
import { useParams } from "react-router";
import { GuideStub } from "@/components/guide/GuideStub";
import { GuideView } from "@/components/guide/GuideView";
import { STUB_COPY } from "@/components/guide/stub-copy";
import { NotFoundPanel } from "@/components/not-found/NotFoundPanel";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useMockScenario } from "@/hooks/useMockScenario";
import { applyGuideScenario } from "@/mocks/guide-scenarios";
import { getMockGuide } from "@/mocks/guides";
import { PAGE_SCENARIOS } from "@/mocks/scenarios";
import { getNotFoundHint } from "@/utils/not-found-hint";

export function GuidePage(): ReactElement {
  const { slug = "" } = useParams();
  const { scenario } = useMockScenario(PAGE_SCENARIOS.guide);
  const guide = getMockGuide(slug);
  const isStub = scenario === "not-oauth" || scenario === "no-docs";
  const path = `/g/${slug}`;

  useDocumentTitle(
    isStub
      ? STUB_COPY[scenario].heading
      : guide
        ? `${guide.appName} OAuth readiness`
        : "No guide yet",
  );

  if (isStub) return <GuideStub kind={scenario} />;
  if (!guide) return <NotFoundPanel path={path} hint={getNotFoundHint(path)} />;
  return <GuideView guide={applyGuideScenario(guide, scenario)} />;
}
