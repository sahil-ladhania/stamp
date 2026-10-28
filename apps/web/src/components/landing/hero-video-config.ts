/**
 * File: hero-video-config.ts
 * Purpose: Where the Landing demo video lives: one 36 second file per theme in apps/web/public/video/, each with
 *          a poster. Both cut to the same timeline, so a theme swap resumes at the same moment. The MP4s have
 *          their index first (faststart), so playback starts before the whole file has downloaded.
 * Exports: HERO_VIDEO
 * Used by: components/landing/HeroVideo.tsx
 */
import type { ThemedVideo } from "@/utils/video-source";

export const HERO_VIDEO: ThemedVideo = {
  light: { src: "/video/hero-light.mp4", poster: "/video/hero-light.webp" },
  dark: { src: "/video/hero-dark.mp4", poster: "/video/hero-dark.webp" },
};
