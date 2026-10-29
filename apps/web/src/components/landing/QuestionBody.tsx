/**
 * File: QuestionBody.tsx
 * Purpose: One numbered question of the verdict section: the number, the question and its short answer. A link to its row in
 *          the sample verdict when there is one, plain text when the sample is not there.
 * Exports: QuestionBody
 * Used by: components/landing/VerdictSection.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";

type QuestionBodyProps = { index: number; question: string; answer: string; to: string | null };

const BODY_CLASS = "grid grid-cols-[2rem_1fr] gap-3 py-4";

export function QuestionBody({ index, question, answer, to }: QuestionBodyProps): ReactElement {
  const content = (
    <>
      <span aria-hidden className="font-mono text-data text-ink-muted">
        {index}
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-card-title text-ink">{question}</span>
        <span className="text-body text-ink-muted">{answer}</span>
      </span>
    </>
  );
  return to ? (
    <Link to={to} className={`${BODY_CLASS} hover:bg-card`}>
      {content}
    </Link>
  ) : (
    <div className={BODY_CLASS}>{content}</div>
  );
}
