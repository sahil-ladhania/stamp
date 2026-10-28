/**
 * File: HeroVideo.tsx
 * Purpose: The hero demo video: muted autoplay on a loop, play/pause and mute controls, a light and a dark
 *          file chosen by theme (the same 36 second timeline, so a swap resumes in place). Falls back to the
 *          code-built poster when there is no file or it fails.
 * Exports: HeroVideo
 * Used by: components/landing/Hero.tsx
 */
import type { ReactElement } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTheme } from "@/hooks/useTheme";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import type { Guide } from "@/types/guide-model";
import { pickVideoSource } from "@/utils/video-source";
import { HERO_VIDEO } from "./hero-video-config";
import { HeroPoster } from "./HeroPoster";
import { VideoControls } from "./VideoControls";

type HeroVideoProps = {
  /** The sample guide for the fallback poster. Null when there is none. */
  sampleGuide: Guide | null;
};

export function HeroVideo({ sampleGuide }: HeroVideoProps): ReactElement {
  const { theme } = useTheme();
  const isReducedMotion = useReducedMotion();
  const source = pickVideoSource(HERO_VIDEO, theme);
  const { videoRef, isPlaying, isMuted, hasFailed, togglePlay, toggleMute } =
    useVideoPlayer({
      src: source?.src ?? null,
      shouldAutoplay: !isReducedMotion,
    });

  if (!source || hasFailed) {
    return <HeroPoster guide={sampleGuide} />;
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-md border border-rule bg-card">
      {/* The src attribute swaps in place on a theme change, so the element and its mute state persist. */}
      <video
        ref={videoRef}
        src={source.src}
        poster={source.poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Demo: Stamp researches HubSpot and produces a verdict you can share"
        onClick={togglePlay}
        className="size-full cursor-pointer object-cover"
      >
        {source.captionsSrc && (
          <track
            kind="captions"
            src={source.captionsSrc}
            srcLang="en"
            label="English"
          />
        )}
      </video>
      <VideoControls
        isPlaying={isPlaying}
        isMuted={isMuted}
        onTogglePlay={togglePlay}
        onToggleMute={toggleMute}
      />
    </div>
  );
}
