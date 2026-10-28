/**
 * File: utils.ts
 * Purpose: Shared helpers for class name merging (shadcn/ui components and Stamp components).
 * Exports: cn
 * Used by: components/ui/*, components/layout/*, components/shared/*
 */
import { createCn } from 'cn/config'
import type { ClassValue } from 'clsx'

// Stamp's type scale from styles/token-theme.css. Without this the merger reads `text-small`
// as a colour and drops it whenever a colour class such as `text-ink` follows it.
const STAMP_TEXT_SIZES = ['page-title', 'section', 'card-title', 'body', 'small', 'data', 'stamp-label']

const cnMerge = createCn({
  extend: { classGroups: { 'font-size': [{ text: STAMP_TEXT_SIZES }] } },
})

/** Merges class names and resolves conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]): string {
  return cnMerge(inputs)
}
