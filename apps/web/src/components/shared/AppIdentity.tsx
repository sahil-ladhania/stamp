/**
 * File: AppIdentity.tsx
 * Purpose: An app's mark and its display name. The name is always the guide's app name, never made from the slug. The apps with a
 *          monochrome mark (GitHub, HubSpot, Gmail) show it; any other app gets a neutral initial tile, so rows line up.
 * Exports: AppIdentity
 * Used by: guide header, library table, verdict, cards, example chips
 */
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import { isLibraryAppSlug } from "@/utils/library-app-slug";
import { AppIcon } from "./AppIcon";

type AppIdentityProps = {
  name: string;
  slug: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE = {
  sm: { mark: "size-5", tile: "size-5 text-[0.6875rem]", text: "text-body" },
  md: { mark: "size-6", tile: "size-6 text-small", text: "text-card-title" },
  lg: { mark: "size-8", tile: "size-8 text-card-title", text: "" },
} as const;

export function AppIdentity({ name, slug, size = "md", className }: AppIdentityProps): ReactElement {
  const { mark, tile, text } = SIZE[size];

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      {isLibraryAppSlug(slug) ? (
        <AppIcon slug={slug} className={cn(mark, "text-ink-muted")} />
      ) : (
        <span
          aria-hidden
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-md border border-rule bg-paper font-semibold text-ink-muted",
            tile,
          )}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className={cn("min-w-0 break-words", text)}>{name}</span>
    </span>
  );
}
