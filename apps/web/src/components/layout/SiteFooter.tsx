/**
 * File: SiteFooter.tsx
 * Purpose: The footer on every page: logo and tagline, link groups, and a bottom bar with the label disclaimer and the credit.
 * Exports: SiteFooter
 * Used by: PageShell
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { REPO_URL, SITE_DISCLAIMER, SITE_TAGLINE } from "@/lib/site";
import { NAV_ITEMS } from "./nav-items";
import { PageContainer } from "./PageContainer";
import { Wordmark } from "./Wordmark";

const LINK_CLASS = "text-small text-ink-muted hover:text-ink hover:underline underline-offset-4";

export function SiteFooter(): ReactElement {
  return (
    <footer className="mt-12 border-t border-rule">
      <PageContainer className="grid gap-10 py-12 tablet:grid-cols-12">
        <div className="flex flex-col items-start gap-3 tablet:col-span-6">
          <Wordmark />
          <p className="max-w-sm text-body text-ink-muted">{SITE_TAGLINE}</p>
        </div>
        <nav aria-label="Product" className="flex flex-col gap-3 tablet:col-span-3">
          <p className="text-small font-semibold text-ink">Product</p>
          <ul className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={LINK_CLASS}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {REPO_URL && (
          <nav aria-label="Project" className="flex flex-col gap-3 tablet:col-span-3">
            <p className="text-small font-semibold text-ink">Project</p>
            <ul className="flex flex-col gap-2">
              <li>
                <a href={REPO_URL} target="_blank" rel="noreferrer" className={LINK_CLASS}>
                  GitHub
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            </ul>
          </nav>
        )}
      </PageContainer>
      <div className="border-t border-rule">
        <PageContainer className="flex flex-col gap-1 py-4 text-small text-ink-muted tablet:flex-row tablet:items-center tablet:justify-between tablet:gap-6">
          <p>{SITE_DISCLAIMER}</p>
          <p>Built by Sahil</p>
        </PageContainer>
      </div>
    </footer>
  );
}
