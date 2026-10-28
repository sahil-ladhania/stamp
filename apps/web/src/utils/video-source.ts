/**
 * File: video-source.ts
 * Purpose: Types for a video that has a light and a dark variant, and the pure picker for the current theme.
 * Exports: VideoSource, ThemedVideo, pickVideoSource
 * Used by: components/landing/hero-video-config.ts, components/landing/HeroVideo.tsx
 */
import type { Theme } from "./theme";

export type VideoSource = {
  src: string;
  poster: string;
  /** WebVTT captions file. Optional until one exists. */
  captionsSrc?: string;
};

export type ThemedVideo = Record<Theme, VideoSource | null>;

/** The variant for the theme, or the other variant when only one file was supplied. */
export function pickVideoSource(
  video: ThemedVideo,
  theme: Theme,
): VideoSource | null {
  const other: Theme = theme === "dark" ? "light" : "dark";
  return video[theme] ?? video[other];
}
