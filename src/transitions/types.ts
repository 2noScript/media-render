import type { Canvas } from "@napi-rs/canvas";

// ─── Param Schema ─────────────────────────────────────────────────────────────

export interface TransitionParamOption {
  value: string;
  label: string;
}

export type TransitionParamType = "number" | "color" | "boolean" | "select";

export interface TransitionParamDefinition {
  /** Unique key used in TransitionParams, e.g. "intensity", "scale" */
  key: string;
  /** Display label in inspector UI */
  label: string;
  type: TransitionParamType;
  default: number | string | boolean;
  // number-specific
  min?: number;
  max?: number;
  step?: number;
  // select-specific
  options?: TransitionParamOption[];
}

// ─── Renderer ─────────────────────────────────────────────────────────────────

export interface TransitionRenderContext {
  /** Frame of the outgoing clip (may be null before clip starts) */
  fromCanvas: Canvas | null;
  /** Frame of the incoming clip */
  toCanvas: Canvas | null;
  /**
   * Blend progress: 0.0 = start of transition (only from), 1.0 = end (only to).
   * Already eased according to TransitionParams.easing.
   */
  progress: number;
  /** Raw params from TransitionElement.params (custom per-transition values) */
  params: Record<string, any>;
  width: number;
  height: number;
  /** Target canvas context to draw the blended output onto */
  output: any; // CanvasRenderingContext2D from @napi-rs/canvas
}

export interface TransitionRenderer {
  /**
   * Renders a single blended frame at the given progress value.
   * Called once per frame within the transition window.
   */
  render(ctx: TransitionRenderContext): void;
}

// ─── Definition ───────────────────────────────────────────────────────────────

export type TransitionGroup =
  | "Basic"
  | "Slide"
  | "Zoom"
  | "Blur"
  | "Overlay"
  | "Glitch"
  | "Flash"
  | "Warp"
  | string; // extensible

export interface TransitionDefinition {
  /** Unique registry key. Must match the value used in TransitionParams.effect */
  type: string;
  /** Human-readable display name shown in the inspector */
  name: string;
  /** UI group/category for organizing the dropdown */
  group: TransitionGroup;
  /** Search keywords */
  keywords: string[];
  /** Default duration in seconds if not specified by user */
  defaultDuration?: number;
  /** Hardcoded easing curve for this transition. Default: "ease-in-out" */
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
  /** Custom param schema (besides effect/duration/easing which are always present) */
  params: TransitionParamDefinition[];
  /** The actual rendering implementation */
  renderer: TransitionRenderer;
}
