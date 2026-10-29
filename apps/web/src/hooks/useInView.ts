/**
 * File: useInView.ts
 * Purpose: Reports whether an element is in the viewport, with an option to stay true after the first time (for one-time motion).
 * Exports: useInView
 * Used by: components/verdict/StampMark.tsx
 */
import { useEffect, useState } from 'react'

type InViewOptions = { once?: boolean; threshold?: number }

/** Attach `ref` to the element. With `once`, the observer disconnects after the first time it is seen. */
export function useInView<T extends Element>({ once = false, threshold = 0.3 }: InViewOptions = {}): {
  ref: (node: T | null) => void
  isInView: boolean
} {
  const [node, setNode] = useState<T | null>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting) {
          setIsInView(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setIsInView(false)
        }
      },
      { threshold },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [node, once, threshold])

  return { ref: setNode, isInView }
}
