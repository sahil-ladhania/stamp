/**
 * File: useVideoPlayer.ts
 * Purpose: Play/pause and mute state for one looping video, kept in sync with the element.
 *          When `src` changes (theme swap) it resumes at the same time and play state.
 * Exports: useVideoPlayer
 * Used by: components/landing/HeroVideo.tsx
 */
import { useEffect, useRef, useState, type RefObject } from "react";

type UseVideoPlayerOptions = {
  /** Null means there is no file yet; nothing is attached. */
  src: string | null;
  /** False for reduced motion: the video stays paused until the visitor presses play. */
  shouldAutoplay: boolean;
};

type UseVideoPlayerResult = {
  videoRef: RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  isMuted: boolean;
  hasFailed: boolean;
  togglePlay: () => void;
  toggleMute: () => void;
};

/** Starts muted (browsers only autoplay muted video). Unmuting is always a click. */
export function useVideoPlayer({
  src,
  shouldAutoplay,
}: UseVideoPlayerOptions): UseVideoPlayerResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Intent is set by the visitor (or the autoplay default), never by pause events.
  const wantsPlayRef = useRef(shouldAutoplay);
  const positionRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  // Keyed by src so a failed light file does not block the dark file after a theme swap.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Read before the browser resets the position for the new file.
    const resumeAt = positionRef.current;
    const syncPlaying = (): void => setIsPlaying(!video.paused);
    const syncMuted = (): void => setIsMuted(video.muted);
    const trackPosition = (): void => {
      positionRef.current = video.currentTime;
    };
    const markFailed = (): void => setFailedSrc(src);
    const resume = (): void => {
      if (resumeAt > 0 && resumeAt < video.duration) {
        video.currentTime = resumeAt;
      }
      // A refused play() (power saving, autoplay policy) leaves the Play button showing.
      if (wantsPlayRef.current) video.play().catch(syncPlaying);
    };

    video.addEventListener("play", syncPlaying);
    video.addEventListener("pause", syncPlaying);
    video.addEventListener("volumechange", syncMuted);
    video.addEventListener("timeupdate", trackPosition);
    video.addEventListener("error", markFailed);
    syncPlaying();
    syncMuted();

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      resume();
    } else {
      video.addEventListener("loadedmetadata", resume, { once: true });
    }

    return () => {
      video.removeEventListener("play", syncPlaying);
      video.removeEventListener("pause", syncPlaying);
      video.removeEventListener("volumechange", syncMuted);
      video.removeEventListener("timeupdate", trackPosition);
      video.removeEventListener("error", markFailed);
      video.removeEventListener("loadedmetadata", resume);
    };
  }, [src]);

  function togglePlay(): void {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      wantsPlayRef.current = true;
      video.play().catch(() => setIsPlaying(false));
    } else {
      wantsPlayRef.current = false;
      video.pause();
    }
  }

  function toggleMute(): void {
    const video = videoRef.current;
    if (video) video.muted = !video.muted;
  }

  return {
    videoRef,
    isPlaying,
    isMuted,
    hasFailed: failedSrc !== null && failedSrc === src,
    togglePlay,
    toggleMute,
  };
}
