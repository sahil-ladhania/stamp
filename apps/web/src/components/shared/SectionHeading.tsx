/**
 * File: SectionHeading.tsx
 * Purpose: A heading with an optional one-line description and a right-aligned aside.
 * Exports: SectionHeading
 * Used by: every page section
 */
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  title: string;
  /** 1 = page title, 2 = section, 3 = card title. Keeps the document outline honest. */
  level?: 1 | 2 | 3;
  description?: string;
  aside?: ReactNode;
  id?: string;
  className?: string;
};

const TITLE_CLASS = {
  1: "text-page-title",
  2: "text-section",
  3: "text-card-title",
} as const;

/** Renders the real h1, h2 or h3 so pages never skip a level. */
export function SectionHeading({
  title,
  level = 2,
  description,
  aside,
  id,
  className,
}: SectionHeadingProps): ReactElement {
  const Tag = `h${level}` as const;

  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-6 gap-y-2",
        className,
      )}
    >
      <div
        className={cn(
          "flex max-w-prose flex-col",
          level === 1 ? "gap-2" : "gap-1",
        )}
      >
        <Tag
          id={id}
          className={cn(TITLE_CLASS[level], "text-balance text-ink")}
        >
          {title}
        </Tag>
        {description && (
          <p className="text-body text-ink-muted">{description}</p>
        )}
      </div>
      {aside}
    </div>
  );
}
