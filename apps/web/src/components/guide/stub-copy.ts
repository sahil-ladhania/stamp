/**
 * File: stub-copy.ts
 * Purpose: Wording for the two guide stubs: an app that is not OAuth and an app with no public docs.
 *          Neither names an app: the docs name no app that uses API keys or lacks docs.
 * Exports: StubKind, STUB_COPY
 * Used by: components/guide/GuideStub.tsx, pages/GuidePage.tsx
 */
import type { StampRowData } from "./ResultStamp";

export type StubKind = "not-oauth" | "no-docs";

type StubCopy = { heading: string; lead: string; rows: StampRowData[] };

export const STUB_COPY: Record<StubKind, StubCopy> = {
  "not-oauth": {
    heading: "This app is out of scope",
    lead: "It uses API keys, not OAuth. Stamp covers provider OAuth apps only, so this guide is a stub.",
    rows: [
      { label: "Result", value: "Out of scope" },
      { label: "Reason", value: "Uses API keys, not OAuth" },
      { label: "Next step", value: "Search for another app" },
    ],
  },
  "no-docs": {
    heading: "No public docs for this app",
    lead: "Stamp searched but found no public docs it can use. Contact the provider for setup details.",
    rows: [
      { label: "Result", value: "No public docs" },
      { label: "Reason", value: "No source page found" },
      { label: "Next step", value: "Contact the provider" },
    ],
  },
};
