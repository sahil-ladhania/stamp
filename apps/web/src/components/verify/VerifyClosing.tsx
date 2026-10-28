/**
 * File: VerifyClosing.tsx
 * Purpose: Last block of How we verify: send the visitor to look up an app and see the labels in context.
 *          It names no guide, so it stays true whatever the library holds.
 * Exports: VerifyClosing
 * Used by: pages/HowWeVerifyPage.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { buttonVariants } from "@/components/ui/button-variants";

export function VerifyClosing(): ReactElement {
  return (
    <section
      aria-labelledby="verify-closing-heading"
      className="border-t border-rule py-12"
    >
      <Container className="flex flex-col gap-6">
        <SectionHeading
          id="verify-closing-heading"
          title="See it on a real guide"
          description="Look up any app. Every claim in its guide shows its label, its source and the quote behind it."
        />
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/app" className={buttonVariants({ size: "lg" })}>
            Look up an app
          </Link>
          <Link
            to="/"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Go to the home page
          </Link>
        </div>
      </Container>
    </section>
  );
}
