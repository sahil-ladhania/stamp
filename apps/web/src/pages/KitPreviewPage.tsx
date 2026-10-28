/**
 * File: KitPreviewPage.tsx
 * Purpose: TEMPORARY, unlinked route `/_kit` to review shared components in both themes. Delete after step 6.
 * Exports: KitPreviewPage
 * Used by: router.tsx
 */
import type { ReactElement } from 'react'
import { Container } from '@/components/layout/Container'
import { AppCard } from '@/components/shared/AppCard'
import { DifficultyDots } from '@/components/shared/DifficultyDots'
import { EvidenceLabel } from '@/components/shared/EvidenceLabel'
import { SearchBar } from '@/components/shared/SearchBar'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useMockSearch } from '@/hooks/useMockSearch'
import { useToast } from '@/hooks/useToast'
import { LIBRARY_SUMMARIES } from '@/mocks/guides'
import { EVIDENCE_KINDS, EVIDENCE_META } from '@/utils/evidence'

export function KitPreviewPage(): ReactElement {
  useDocumentTitle('Kit preview')
  const { showToast } = useToast()
  const { submit } = useMockSearch()

  return (
    <Container className="flex flex-col gap-12 py-12">
      <SectionHeading level={1} title="Kit preview" description="Temporary page to review shared components." />

      <section className="flex flex-col gap-4" aria-labelledby="kit-buttons">
        <SectionHeading level={3} title="Buttons" id="kit-buttons" />
        <div className="flex flex-wrap items-center gap-3">
          <Button>Get the guide</Button>
          <Button variant="secondary">Copy link</Button>
          <Button variant="ghost">Retry run</Button>
          <Button disabled>Get the guide</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="kit-evidence">
        <SectionHeading level={3} title="Evidence labels" id="kit-evidence" description="Hover or focus a label to see its detail." />
        <div className="flex flex-wrap gap-3">
          {EVIDENCE_KINDS.map((kind) => (
            <EvidenceLabel key={kind} kind={kind} detail={`${EVIDENCE_META[kind].meaning}. ${EVIDENCE_META[kind].howSet}.`} />
          ))}
          <EvidenceLabel kind="sourced" />
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="kit-dots">
        <SectionHeading level={3} title="Difficulty dots" id="kit-dots" />
        <div className="flex flex-wrap gap-6">
          {[1, 2, 3, 4, 5].map((score) => (
            <DifficultyDots key={score} score={score} hasValue />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="kit-search">
        <SectionHeading level={3} title="Search bar" id="kit-search" description="Try HubSpot for a library guide, or any other name for the demo run." />
        <SearchBar onSubmit={submit} />
        <SearchBar onSubmit={submit} size="lg" />
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="kit-cards">
        <SectionHeading level={3} title="App cards" id="kit-cards" />
        <ul className="grid gap-4 tablet:grid-cols-2">
          {LIBRARY_SUMMARIES.map((guide) => (
            <li key={guide.slug}>
              <AppCard guide={guide} />
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="kit-toast">
        <SectionHeading level={3} title="Toasts" id="kit-toast" />
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => showToast('Link copied')}>
            Copy link
          </Button>
          <Button variant="secondary" onClick={() => showToast('Could not copy the link. Select it and copy by hand.', { tone: 'error' })}>
            Show an error
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="kit-type">
        <SectionHeading level={3} title="Type scale" id="kit-type" />
        <p className="text-page-title">Page title, Inter 32</p>
        <p className="text-section">Section heading, Inter 24</p>
        <p className="text-card-title">Card title, Inter 18</p>
        <p className="text-body">Body, Inter 15. Copy the client secret into the auth config.</p>
        <p className="text-small">Small, Inter 13. Human · about 10 min</p>
        <p className="text-data">crm.objects.contacts.read</p>
        <p className="text-stamp-label text-stamp">First test: about 1 hour</p>
      </section>
    </Container>
  )
}
