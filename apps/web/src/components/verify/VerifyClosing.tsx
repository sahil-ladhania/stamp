/**
 * File: VerifyClosing.tsx
 * Purpose: Last block of How we verify: send the visitor to a real guide to see the labels in context.
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
          description="The HubSpot guide shows Sourced and Uncertain claims side by side, with a source conflict."
        />
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/g/hubspot" className={buttonVariants({ size: "lg" })}>
            Open the HubSpot guide
          </Link>
          <Link
            to="/app"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Open the library
          </Link>
        </div>
      </Container>
    </section>
  );
}
