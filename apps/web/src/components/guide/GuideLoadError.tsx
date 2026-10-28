/**
 * File: GuideLoadError.tsx
 * Purpose: The guide page when the guide failed to load (not when it does not exist): what happened, and a retry.
 * Exports: GuideLoadError
 * Used by: pages/GuidePage.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import type { ApiError } from "@/lib/api-error";
import { getApiErrorMessage } from "@/utils/error-messages";

type GuideLoadErrorProps = { error: ApiError; onRetry: () => void };

export function GuideLoadError({
  error,
  onRetry,
}: GuideLoadErrorProps): ReactElement {
  return (
    <div role="alert">
      <Container className="flex flex-col items-start gap-6 py-12">
        <SectionHeading
          level={1}
          title="The guide did not load"
          description={getApiErrorMessage(error)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={onRetry}>
            Retry loading the guide
          </Button>
          <Link
            to="/app"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Open the library
          </Link>
        </div>
      </Container>
    </div>
  );
}
