/**
 * File: TextLink.tsx
 * Purpose: A navigation link in ink, with a trailing arrow and no underline at rest; the underline shows on hover and on
 *          focus. It replaces underlined blue body links. An external href opens in a new tab and says so.
 * Exports: TextLink
 * Used by: every section call to action
 */
import type { ReactElement, ReactNode } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

type TextLinkProps = {
  children: ReactNode;
  className?: string;
  /** Set false for a link that already has an icon of its own. */
  hasArrow?: boolean;
} & ({ to: string; href?: never } | { href: string; to?: never });

const BASE =
  "group inline-flex items-center gap-1 text-body font-medium text-ink no-underline underline-offset-4 hover:underline focus-visible:underline";

export function TextLink({ children, className, hasArrow = true, to, href }: TextLinkProps): ReactElement {
  const classes = cn(BASE, className);
  if (to !== undefined) {
    return (
      <Link to={to} className={classes}>
        {children}
        {hasArrow && (
          <ArrowRight
            aria-hidden
            className="size-4 shrink-0 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
          />
        )}
      </Link>
    );
  }
  const isExternal = /^https?:/.test(href ?? "");
  return (
    <a
      href={href}
      className={classes}
      {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {children}
      {hasArrow && (isExternal ? <ArrowUpRight aria-hidden className="size-4 shrink-0" /> : <ArrowRight aria-hidden className="size-4 shrink-0" />)}
      {isExternal && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}
