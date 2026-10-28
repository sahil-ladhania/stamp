/**
 * File: VideoControls.tsx
 * Purpose: Play/pause and mute/unmute buttons laid over the bottom-left of a video.
 * Exports: VideoControls
 * Used by: components/landing/HeroVideo.tsx
 */
import type { ReactElement } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

type VideoControlsProps = {
  isPlaying: boolean;
  isMuted: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
};

/** Card-coloured chips with a border, so they stay readable over any frame. */
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
    <div className="absolute bottom-3 left-3 flex gap-2">
      <Tooltip content={playLabel}>
        <Button
          variant="secondary"
          size="icon"
          aria-label={playLabel}
          onClick={onTogglePlay}
        >
          <PlayIcon aria-hidden className="size-4" />
        </Button>
      </Tooltip>
      <Tooltip content={muteLabel}>
        <Button
          variant="secondary"
          size="icon"
          aria-label={muteLabel}
          onClick={onToggleMute}
        >
          <MuteIcon aria-hidden className="size-4" />
        </Button>
      </Tooltip>
    </div>
  );
}
