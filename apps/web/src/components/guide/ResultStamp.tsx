/**
 * File: ResultStamp.tsx
 * Purpose: A tilted stamp that gives a result for something that is not a guide: a missing page or a guide stub.
 *          It lands once on load, like a stamp pressed slightly off straight.
 * Exports: StampRowData, ResultStamp
 * Used by: components/not-found/NotFoundPanel.tsx, components/guide/GuideStub.tsx
 */
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import { StampFrame } from "./StampFrame";
import { StampRow } from "./StampRow";

export type StampRowData = { label: string; value: string };

type ResultStampProps = {
  /** Names the stamp for screen readers. */
  label: string;
  title: string;
  subtitle: string;
  rows: readonly StampRowData[];
  /** Mono and break-anywhere, for an address. */
  isTitleMono?: boolean;
};

export function ResultStamp({
  label,
  title,
  subtitle,
  rows,
  isTitleMono = false,
}: ResultStampProps): ReactElement {
  return (
    <StampFrame label={label} isTilted hasEntrance>
      <div className="flex flex-col">
        <p
          className={cn(
            "text-card-title text-ink",
            isTitleMono ? "font-mono break-all" : "break-words",
          )}
        >
          {title}
        </p>
        <p className="text-data text-ink-muted">{subtitle}</p>
      </div>
      <dl className="flex flex-col divide-y divide-rule border-t border-rule">
        {rows.map((row) => (
          <StampRow key={row.label} label={row.label}>
            <span className="text-stamp-label text-stamp">{row.value}</span>
          </StampRow>
        ))}
      </dl>
    </StampFrame>
  );
}
