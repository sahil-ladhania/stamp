/**
 * File: BannerPattern.tsx
 * Purpose: The quiet picture behind the closing banner: a grid that fades out toward the centre and a large faint stamp outline.
 *          Drawn with SVG from the design tokens, so it follows the theme and needs no image.
 * Exports: BannerPattern
 * Used by: components/landing/ClosingBanner.tsx
 */
import type { ReactElement } from "react";

export function BannerPattern(): ReactElement {
  return (
    <svg
      aria-hidden
      focusable="false"
      className="pointer-events-none absolute inset-0 -z-10 size-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="banner-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="var(--rule)" strokeWidth="1" />
        </pattern>
        <radialGradient id="banner-fade" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="white" stopOpacity="1" />
        </radialGradient>
        <mask id="banner-mask">
          <rect width="100%" height="100%" fill="url(#banner-fade)" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#banner-grid)" mask="url(#banner-mask)" />
      <g transform="translate(88 40) rotate(-8)" fill="none" stroke="var(--stamp)" opacity="0.14">
        <rect x="0" y="0" width="150" height="104" rx="8" strokeWidth="4" />
        <rect x="8" y="8" width="134" height="88" rx="4" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
