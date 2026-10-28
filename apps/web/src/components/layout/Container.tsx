/**
 * File: Container.tsx
 * Purpose: Centred page column with the side gutters. `content` is 880px, `wide` is 1120px.
 * Exports: Container
 * Used by: SiteHeader, SiteFooter, every page and section
 */
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ContainerProps = {
  size?: "content" | "wide";
  as?: "div" | "section" | "header" | "footer";
  className?: string;
  children: ReactNode;
};

const SIZE_CLASS = { content: "max-w-content", wide: "max-w-wide" } as const;

/** 16px gutter on phones, 24px from the tablet breakpoint. */
export function Container({
  size = "content",
  as: Tag = "div",
  className,
  children,
}: ContainerProps): ReactElement {
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-4 tablet:px-6",
        SIZE_CLASS[size],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
