/**
 * File: GuideStub.tsx
 * Purpose: The page for a guide that is only a stub: out of scope (not OAuth) or no public docs. Names no app.
 * Exports: GuideStub
 * Used by: pages/GuidePage.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { buttonVariants } from "@/components/ui/button-variants";
import { ResultStamp } from "./ResultStamp";
import { STUB_COPY, type StubKind } from "./stub-copy";

export function GuideStub({ kind }: { kind: StubKind }): ReactElement {
  const copy = STUB_COPY[kind];

  return (
    <Container className="grid gap-12 py-12 desktop:grid-cols-12 desktop:items-start">
      <div className="flex flex-col gap-6 desktop:col-span-7">
        <SectionHeading
          level={1}
          title={copy.heading}
          description={copy.lead}
        />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link to="/app" className={buttonVariants({ size: "lg" })}>
            Search for another app
          </Link>
          <Link
            to="/how-we-verify"
            className="text-body text-sourced underline underline-offset-4"
          >
            Read how we verify
          </Link>
        </div>
      </div>
      <div className="desktop:col-span-5">
        <ResultStamp
          label="Guide stub result"
          title="This app"
          subtitle="Guide stub"
          rows={copy.rows}
        />
      </div>
    </Container>
  );
}
