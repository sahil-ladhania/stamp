/**
 * File: table.tsx
 * Purpose: Token-styled table primitives. The wrapper scrolls sideways on a narrow screen instead of squeezing the columns.
 * Exports: Table, TableHeader, TableBody, TableRow, TableHead, TableCell
 * Used by: components/app-home/LibraryTable.tsx, components/guide/ScopesTable.tsx, components/guide/SourcesTable.tsx
 */
import type { ComponentProps, ReactElement } from 'react'
import { cn } from '@/lib/utils'

export function Table({ className, ...props }: ComponentProps<'table'>): ReactElement {
  return (
    <div className="relative w-full overflow-x-auto">
      <table className={cn('w-full border-collapse text-left', className)} {...props} />
    </div>
  )
}

export function TableHeader({ className, ...props }: ComponentProps<'thead'>): ReactElement {
  return <thead className={cn('border-b border-rule', className)} {...props} />
}

export function TableBody({ className, ...props }: ComponentProps<'tbody'>): ReactElement {
  return <tbody className={cn('divide-y divide-rule', className)} {...props} />
}

export function TableRow({ className, ...props }: ComponentProps<'tr'>): ReactElement {
  return <tr className={cn('align-top', className)} {...props} />
}

export function TableHead({ className, ...props }: ComponentProps<'th'>): ReactElement {
  return <th scope="col" className={cn('px-3 py-2 text-small font-normal text-ink-muted', className)} {...props} />
}

export function TableCell({ className, ...props }: ComponentProps<'td'>): ReactElement {
  return <td className={cn('px-3 py-3 text-body text-ink', className)} {...props} />
}
