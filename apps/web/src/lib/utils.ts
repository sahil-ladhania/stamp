/**
 * File: utils.ts
 * Purpose: Shared helpers for class name merging (shadcn/ui components).
 * Exports: cn
 * Used by: future src/components/ui/*
 */
import { cn as cnMerge } from 'cn'
import type { ClassValue } from 'clsx'

/** Merges class names and resolves conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]): string {
  return cnMerge(inputs)
}
