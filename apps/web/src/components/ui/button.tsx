/**
 * File: button.tsx
 * Purpose: Token-styled button primitive (primary, secondary, ghost).
 * Exports: Button
 * Used by: SearchBar, ThemeToggle, pages and sections
 */
import type { ComponentProps, ReactElement } from 'react'
import { cn } from '@/lib/utils'
import { buttonVariants, type ButtonVariants } from './button-variants'

type ButtonProps = ComponentProps<'button'> & ButtonVariants

/** Renders a real button; defaults to type="button" so it never submits a form by accident. */
export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps): ReactElement {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
