import { registerTransitions } from "../registry";

// Basic
import { fadeDefinition, fadeBlackDefinition, fadeWhiteDefinition } from "./fade";

// Slide
import {
  slideLeftDefinition,
  slideRightDefinition,
  slideUpDefinition,
  slideDownDefinition,
  slideBlurFadeDefinition,
} from "./slide";

// Zoom
import {
  zoomInDefinition,
  zoomOutDefinition,
  pullInDefinition,
  zoomSpinDefinition,
  zoomFadeDefinition,
} from "./zoom";

// Overlay / Cinematic + Warp (split file)
import {
  ghostDefinition,
  pageTurnDefinition,
  splitDefinition,
  waveRippleDefinition,
  swirlDefinition,
} from "./overlay";

// Glitch
import { rgbGlitchDefinition, pixelateDefinition, shakeDefinition } from "./glitch";

// Flash / Light
import { flashWhiteDefinition, flashBlackDefinition, glowFadeDefinition } from "./flash";

// Blur
import {
  blurFadeDefinition,
  verticalBlurDefinition,
  horizontalBlurDefinition,
  zoomBlurDefinition,
} from "./blur";

/**
 * Registers all built-in transition definitions.
 * Call this once at app startup (e.g. in bootstrap.ts) before any rendering.
 *
 * To add a new transition:
 * 1. Create a file in this directory (e.g. `wipe.ts`)
 * 2. Export a TransitionDefinition from it
 * 3. Import and pass it to registerTransitions() below
 */
export function registerDefaultTransitions(): void {
  registerTransitions(
    // ── Basic ──────────────────────────────────────────
    fadeDefinition,
    fadeBlackDefinition,
    fadeWhiteDefinition,

    // ── Slide / Camera ─────────────────────────────────
    slideLeftDefinition,
    slideRightDefinition,
    slideUpDefinition,
    slideDownDefinition,
    slideBlurFadeDefinition,

    // ── Zoom ───────────────────────────────────────────
    zoomInDefinition,
    zoomOutDefinition,
    pullInDefinition,
    zoomSpinDefinition,
    zoomFadeDefinition,

    // ── Overlay / Cinematic ────────────────────────────
    ghostDefinition,
    pageTurnDefinition,

    // ── Split / Warp ───────────────────────────────────
    splitDefinition,
    waveRippleDefinition,
    swirlDefinition,

    // ── Glitch / Distortion ────────────────────────────
    rgbGlitchDefinition,
    pixelateDefinition,
    shakeDefinition,

    // ── Flash / Light ──────────────────────────────────
    flashWhiteDefinition,
    flashBlackDefinition,
    glowFadeDefinition,

    // ── Blur ───────────────────────────────────────────
    blurFadeDefinition,
    verticalBlurDefinition,
    horizontalBlurDefinition,
    zoomBlurDefinition,
  );
}

