/**
 * File: GuidePage.tsx
 * Purpose: Guide route `/g/:slug`. Loads the guide and shows the right state: loading, the guide, a failed load,
 *          or the not-found panel for an unknown slug.
 * Exports: GuidePage
 * Used by: router.tsx
 */
import type { ReactElement } from "react";
import { useParams } from "react-router";
import { GuideLoadError } from "@/components/guide/GuideLoadError";
import { GuideSkeleton } from "@/components/guide/GuideSkeleton";
import { GuideView } from "@/components/guide/GuideView";
import { NotFoundPanel } from "@/components/not-found/NotFoundPanel";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useGuide } from "@/hooks/useGuide";
import { mapGuide } from "@/utils/map-guide";
import { getNotFoundHint } from "@/utils/not-found-hint";

export function GuidePage(): ReactElement {
  const { slug = "" } = useParams();
  const { data, error, isLoading, reload } = useGuide(slug);
  const guide = data ? mapGuide(data) : null;
  const isNotFound = error?.code === "NOT_FOUND";
  const path = `/g/${slug}`;

  useDocumentTitle(
    guide
      ? `${guide.appName} OAuth readiness`
      : isNotFound
        ? "No guide yet"
        : error
          ? "The guide did not load"
          : "Guide",
  );

  if (isNotFound) return <NotFoundPanel path={path} hint={getNotFoundHint(path)} />;
  if (error) return <GuideLoadError error={error} onRetry={reload} />;
  if (isLoading || !guide) return <GuideSkeleton />;
  return <GuideView guide={guide} />;
}
