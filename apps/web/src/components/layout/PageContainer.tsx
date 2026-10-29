/**
 * File: PageContainer.tsx
 * Purpose: The one page frame: a centred column with the side gutters, shared by the header, every page and the footer,
 *          so content starts at the same x position everywhere. Reading text keeps its own 70-character width inside it.
 * Exports: PageContainer
 * Used by: SiteHeader, SiteFooter, every page and section
 */
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageContainerProps = {
  as?: "div" | "section" | "header" | "footer";
  className?: string;
  children: ReactNode;
};

/** 1120px at most, with a 16px gutter on phones and 24px from the tablet breakpoint. */
export function PageContainer({
  as: Tag = "div",
  className,
  children,
}: PageContainerProps): ReactElement {
  return (
    <Tag className={cn("mx-auto w-full max-w-wide px-4 tablet:px-6", className)}>
      {children}
    </Tag>
  );
}
