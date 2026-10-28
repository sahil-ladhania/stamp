/**
 * File: Callout.tsx
 * Purpose: A neutral card with a left accent bar and an icon, for a note, a warning or a blocker. It replaces the full amber
 *          fills: the colour of a label belongs on a label badge only. Info uses a muted bar, warning an ink bar.
 * Exports: Callout
 * Used by: components/guide/*, components/verify/CannotVerifySection.tsx, components/landing/*
 */
import type { HTMLAttributes, ReactElement, ReactNode } from "react";
import { Info, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type CalloutProps = {
  variant?: "info" | "warning";
  title?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  icon?: LucideIcon;
  className?: string;
} & Pick<HTMLAttributes<HTMLDivElement>, "role" | "id">;

const VARIANT = {
  info: { bar: "border-l-ink-muted", icon: Info, tone: "text-ink-muted" },
  warning: { bar: "border-l-ink", icon: TriangleAlert, tone: "text-ink" },
} as const;

export function Callout({
  variant = "info",
  title,
  children,
  actions,
  icon,
  className,
  ...rest
}: CalloutProps): ReactElement {
  const { bar, icon: DefaultIcon, tone } = VARIANT[variant];
  const Icon = icon ?? DefaultIcon;

  return (
    <div
      className={cn("flex gap-3 rounded-md border border-l-4 border-rule bg-card p-4", bar, className)}
      {...rest}
    >
      <Icon aria-hidden className={cn("mt-0.5 size-5 shrink-0", tone)} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {title && <p className="text-body font-semibold text-ink">{title}</p>}
        {children && <div className="text-body text-ink">{children}</div>}
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
