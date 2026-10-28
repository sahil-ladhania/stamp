/**
 * File: VerdictStamp.tsx
 * Purpose: The verdict as a rubber-stamp block: app, difficulty, then each answer with its evidence label.
 * Exports: VerdictStamp
 * Used by: components/landing/HeroPoster.tsx, components/landing/VerdictSection.tsx, Guide page (step 6)
 */
import type { ReactElement } from "react";
import { DifficultyDots } from "@/components/shared/DifficultyDots";
import { EvidenceLabel } from "@/components/shared/EvidenceLabel";
import { cn } from "@/lib/utils";
import type { Guide } from "@/mocks/types";
import { ARCHETYPE_LABEL } from "@/utils/archetype";
import { getVerdictRows } from "@/utils/verdict";
import { StampFrame } from "./StampFrame";
import { StampRow } from "./StampRow";

type VerdictStampProps = {
  guide: Guide;
  /**
   * `sm` is the poster (first test, production, top blocker). `md` is the Guide page: next step and
   * top blocker get their own cards below it. `lg` shows all five rows.
   */
  size?: "sm" | "md" | "lg";
  /** False hides the app name, kind and dots, for a page whose header already shows them. */
  hasHeader?: boolean;
  isTilted?: boolean;
  className?: string;
};

const ROWS_BY_SIZE: Record<"sm" | "md", readonly string[]> = {
  sm: ["First test", "Production", "Top blocker"],
  md: ["First test", "Production", "Approval wait"],
};

/** Stamp red marks the border and the answers. Evidence labels sit beside each answer. */
export function VerdictStamp({
  guide,
  size = "lg",
  hasHeader = true,
  isTilted = false,
  className,
}: VerdictStampProps): ReactElement {
  const rows = getVerdictRows(guide).filter(
    (row) => size === "lg" || ROWS_BY_SIZE[size].includes(row.label),
  );

  return (
    <StampFrame
      label={`Verdict for ${guide.appName}`}
      isTilted={isTilted}
      className={className}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <p className="text-card-title text-ink">{guide.appName}</p>
            <p className="text-data text-ink-muted">
              {ARCHETYPE_LABEL[guide.archetype]}
            </p>
          </div>
          <DifficultyDots
            score={guide.difficulty.score}
            hasValue
            className="pt-1"
          />
        </div>
      )}
      <dl
        className={cn(
          "flex flex-col divide-y divide-rule",
          hasHeader && "border-t border-rule",
        )}
      >
        {rows.map((row) => (
          <StampRow key={row.label} label={row.label}>
            <span className="text-stamp-label text-stamp">{row.value}</span>
            <EvidenceLabel kind={row.kind} detail={row.detail} />
          </StampRow>
        ))}
      </dl>
    </StampFrame>
  );
}
