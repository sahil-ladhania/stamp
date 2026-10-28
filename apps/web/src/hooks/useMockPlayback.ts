/**
 * File: useMockPlayback.ts
 * Purpose: Replays a timed list of run events with a timer, or returns them all at once.
 *          Returns the shape the real `useRunStream` hook will return, so the page changes by one import.
 * Exports: useMockPlayback
 * Used by: components/run/RunScreen.tsx
 */
import { useEffect, useState } from "react";
import type { RunEvent, TimedRunEvent } from "@/mocks/types";

type UseMockPlaybackOptions = {
  events: readonly TimedRunEvent[];
  /** False shows the final frame at once. */
  isPlayback: boolean;
};

type UseMockPlaybackResult = {
  events: RunEvent[];
  elapsedMs: number;
  isFinished: boolean;
};

const TICK_MS = 100;

export function useMockPlayback({
  events,
  isPlayback,
}: UseMockPlaybackOptions): UseMockPlaybackResult {
  const lastAtMs = events.at(-1)?.atMs ?? 0;
  const [playedMs, setPlayedMs] = useState(0);

  useEffect(() => {
    if (!isPlayback) return;
    const startedAt = performance.now();
    const timer = window.setInterval(() => {
      const next = Math.min(performance.now() - startedAt, lastAtMs);
      setPlayedMs(next);
      if (next >= lastAtMs) window.clearInterval(timer);
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [isPlayback, lastAtMs]);

  const elapsedMs = isPlayback ? playedMs : lastAtMs;
  return {
    events: events
      .filter((item) => item.atMs <= elapsedMs)
      .map((item) => item.event),
    elapsedMs,
    isFinished: elapsedMs >= lastAtMs,
  };
}
