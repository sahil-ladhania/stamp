/**
 * File: VideoControls.tsx
 * Purpose: Play/pause and mute/unmute as one small pill laid over the bottom-left of a video.
 * Exports: VideoControls
 * Used by: components/landing/HeroVideo.tsx
 */
import type { ReactElement } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

type VideoControlsProps = {
  isPlaying: boolean;
  isMuted: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
};

const BUTTON_CLASS =
  "inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-paper";

/** Card-coloured with a border, so it stays readable over any frame. */
export function VideoControls({
  isPlaying,
  isMuted,
  onTogglePlay,
  onToggleMute,
}: VideoControlsProps): ReactElement {
  const playLabel = isPlaying ? "Pause video" : "Play video";
  const muteLabel = isMuted ? "Unmute video" : "Mute video";
  const PlayIcon = isPlaying ? Pause : Play;
  const MuteIcon = isMuted ? VolumeX : Volume2;

  return (
    <div
      role="group"
      aria-label="Video controls"
      className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full border border-rule bg-card p-1"
    >
      <Tooltip content={playLabel}>
        <button type="button" aria-label={playLabel} onClick={onTogglePlay} className={BUTTON_CLASS}>
          <PlayIcon aria-hidden className="size-4" />
        </button>
      </Tooltip>
      <Tooltip content={muteLabel}>
        <button type="button" aria-label={muteLabel} onClick={onToggleMute} className={BUTTON_CLASS}>
          <MuteIcon aria-hidden className="size-4" />
        </button>
      </Tooltip>
    </div>
  );
}
