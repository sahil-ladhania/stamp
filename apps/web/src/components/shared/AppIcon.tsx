/**
 * File: AppIcon.tsx
 * Purpose: Monochrome marks for the apps that have one (Simple Icons paths, currentColor). An app without a mark renders none.
 * Exports: AppIcon
 * Used by: AppCard, ExampleApps, GuideHeader, AmbiguousOptions, ConflictCard, RunHeader
 */
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import {
  isLibraryAppSlug,
  type LibraryAppSlug,
} from "@/utils/library-app-slug";

/** Single-path marks from Simple Icons (MIT), scaled to 24×24. */
const PATH: Record<LibraryAppSlug, string> = {
  github:
    "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  hubspot:
    "M18.164 7.523V5.016a2.135 2.135 0 0 1 .997-1.816l3.005-1.753a.376.376 0 0 0-.182-.341.372.372 0 0 0-.478.058l-2.011 1.738a2.133 2.133 0 0 1-2.491 0L5.205 1.222a.372.372 0 0 0-.478-.058.376.376 0 0 0-.182.341v2.507a2.133 2.133 0 0 1-1.027 1.816l-3.005 1.753a.376.376 0 0 0-.182.341v3.512c0 .141.075.271.197.341l3.005 1.753a2.135 2.135 0 0 1 1.027 1.816v2.507c0 .141.075.271.197.341l2.011 1.178a.376.376 0 0 0 .388 0l2.011-1.178a.376.376 0 0 0 .197-.341v-2.507a2.135 2.135 0 0 1 1.027-1.816l3.005-1.753a.376.376 0 0 0 .197-.341V9.617a2.134 2.134 0 0 1-1.027-1.816v-2.507a.376.376 0 0 0-.197-.341l-3.005-1.753a2.135 2.135 0 0 1-.997-1.816zm-6.164 8.285a3.285 3.285 0 1 1 0-6.57 3.285 3.285 0 0 1 0 6.57z",
  gmail:
    "M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.546l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z",
};

type AppIconProps = {
  slug: string;
  className?: string;
};

/** Renders nothing for unknown slugs so live apps never get a fake mark. */
export function AppIcon({ slug, className }: AppIconProps): ReactElement | null {
  if (!isLibraryAppSlug(slug)) {
    return null;
  }

  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("size-5 shrink-0", className)}
    >
      <path d={PATH[slug]} />
    </svg>
  );
}
