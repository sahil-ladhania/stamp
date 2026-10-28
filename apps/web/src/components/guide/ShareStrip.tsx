/**
 * File: ShareStrip.tsx
 * Purpose: Last block of a guide: send the link to the team. The button is red only when nothing else on the page is.
 * Exports: ShareStrip
 * Used by: components/guide/GuideView.tsx
 */
import type { ReactElement } from "react";
import { PageSection } from "@/components/shared/PageSection";
import { CopyLinkButton } from "./CopyLinkButton";

type ShareStripProps = { slug: string; isPrimary: boolean };

export function ShareStrip({ slug, isPrimary }: ShareStripProps): ReactElement {
  return (
    <PageSection
      id="share"
      title="Share this guide"
      description="Send it to your team. The link keeps the date and every source."
    >
      <div>
        <CopyLinkButton
          slug={slug}
          variant={isPrimary ? "primary" : "secondary"}
        />
      </div>
    </PageSection>
  );
}
