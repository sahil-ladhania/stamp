/**
 * File: CopyLinkButton.tsx
 * Purpose: Copies the guide's share link (`/g/<slug>`, without any `?state=`) and confirms with a toast.
 * Exports: CopyLinkButton
 * Used by: components/guide/GuideHeader.tsx, components/guide/ShareStrip.tsx
 */
import type { ReactElement } from "react";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";

type CopyLinkButtonProps = {
  slug: string;
  variant?: "primary" | "secondary";
};

export function CopyLinkButton({
  slug,
  variant = "secondary",
}: CopyLinkButtonProps): ReactElement {
  const { showToast } = useToast();

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/g/${slug}`,
      );
      showToast("Link copied");
    } catch {
      // Clipboard access can be blocked by the browser or by a missing secure context.
      showToast("Could not copy the link. Copy it from your address bar.", {
        tone: "error",
      });
    }
  }

  return (
    <Button variant={variant} onClick={copyLink}>
      <Link2 aria-hidden className="size-4" />
      Copy link
    </Button>
  );
}
