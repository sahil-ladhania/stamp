/**
 * File: useDocumentTitle.ts
 * Purpose: Sets the browser tab title for the current page.
 * Exports: useDocumentTitle
 * Used by: every page
 */
import { useEffect } from "react";

const SITE_NAME = "Stamp";

/** Sets the tab title to "<title> | Stamp", or just "Stamp" when the title is empty. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  }, [title]);
}
