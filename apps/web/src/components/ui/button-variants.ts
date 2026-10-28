/**
 * File: button-variants.ts
 * Purpose: Class variants for buttons and link-styled buttons, built from design tokens.
 * Exports: buttonVariants, ButtonVariants
 * Used by: components/ui/button.tsx, pages and sections that style a Link as a button
 */
import { cva, type VariantProps } from 'class-variance-authority'

// No shadows: hover raises the border colour only.
export const buttonVariants = cva(
  'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md border text-small font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'border-stamp bg-stamp text-on-stamp hover:border-ink active:translate-y-px',
        secondary: 'border-rule bg-card text-ink hover:border-ink-muted active:translate-y-px',
        ghost: 'border-transparent bg-transparent text-ink-muted hover:border-rule hover:text-ink',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-body font-semibold',
        icon: 'size-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
