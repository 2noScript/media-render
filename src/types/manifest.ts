export type ParamValue = number | string | boolean;
export type ParamValues = Record<string, any>;

export interface Effect {
  id: string;
  type: string;
  params: ParamValues;
  enabled: boolean;
}

/**
 * Core parameters for a TransitionElement.
 * Stored in `TransitionElement.params` on the VideoTrack.
 * Contains only custom parameters specific to the transition definition.
 *
 * @example
 * { intensity: 1 }
 * { scale: 1.3 }
 * { frequency: 3, intensity: 0.6 }
 */
export interface TransitionParams extends ParamValues {
  /** Per-transition custom params — see TransitionDefinition.params for schema */
  [key: string]: any;
}




export interface Mask {
  id: string;
  type: string;
  params: ParamValues;
}

export type ScalarSegmentType = "step" | "linear" | "bezier";
export type TangentMode = "auto" | "aligned" | "broken" | "flat";
export type ChannelExtrapolationMode = "hold" | "linear";

export interface CurveHandle {
  dt: number;
  dv: number;
}

export interface BaseAnimationKeyframe<TValue extends ParamValue> {
  id: string;
  time: number; // relative to element start time
  value: TValue;
}

export interface ScalarAnimationKey extends BaseAnimationKeyframe<number> {
  leftHandle?: CurveHandle;
  rightHandle?: CurveHandle;
  segmentToNext: ScalarSegmentType;
  tangentMode: TangentMode;
}

export type DiscreteValue = string | boolean;
export interface DiscreteAnimationKey extends BaseAnimationKeyframe<DiscreteValue> {}

export interface ScalarChannel {
  keys: ScalarAnimationKey[];
  extrapolation?: {
    before: ChannelExtrapolationMode;
    after: ChannelExtrapolationMode;
  };
}

export interface DiscreteChannel {
  keys: DiscreteAnimationKey[];
}

export type AnimationChannel = ScalarChannel | DiscreteChannel;
export type CompositeChannelData = Record<string, AnimationChannel | undefined>;
export type ChannelData = AnimationChannel | CompositeChannelData | any[]; // Allow flat array of keyframes for dual compatibility

export interface ElementAnimations {
  [propertyPath: string]: ChannelData | undefined;
}

export type TrackType = "video" | "text" | "audio" | "graphic" | "effect" | "transition";

export type ElementRef = {
  trackId: string;
  elementId: string;
};

export interface Bookmark {
  time: number;
  note?: string;
  color?: string;
  duration?: number;
}

export type OverlayTrack = VideoTrack | TextTrack | GraphicTrack | EffectTrack;

export interface SceneTracks {
  overlay: OverlayTrack[];
  main: VideoTrack;
  audio: AudioTrack[];
}

export interface TScene {
  id: string;
  name: string;
  isMain: boolean;
  tracks: SceneTracks;
  bookmarks: Bookmark[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BaseTrack {
  id: string;
  name: string;
  type: TrackType;
}

export interface VideoTrack extends BaseTrack {
  type: "video";
  elements: (VideoElement | ImageElement | TransitionElement)[];
  isMain: boolean;
  muted: boolean;
  hidden: boolean;
}

export interface AudioTrack extends BaseTrack {
  type: "audio";
  elements: AudioElement[];
  muted: boolean;
}

export interface TextTrack extends BaseTrack {
  type: "text";
  elements: TextElement[];
  hidden: boolean;
}

export interface GraphicTrack extends BaseTrack {
  type: "graphic";
  elements: (StickerElement | GraphicElement)[];
  hidden: boolean;
}

export interface EffectTrack extends BaseTrack {
  type: "effect";
  elements: EffectElement[];
  hidden: boolean;
}

export interface RetimeConfig {
  rate: number;
  maintainPitch?: boolean;
}

export interface BaseTimelineElement {
  id: string;
  name: string;
  duration: number;   // Visible duration on timeline (seconds)
  startTime: number;  // Position on timeline (seconds)
  trimStart: number;  // Trim from source start (seconds)
  trimEnd: number;    // Trim from source end (seconds)
  animations?: ElementAnimations;
  params?: ParamValues;
}

export interface VisualParams {
  "transform.positionX"?: number;
  "transform.positionY"?: number;
  "transform.scaleX"?: number;
  "transform.scaleY"?: number;
  "transform.rotate"?: number;
  "transform.flipX"?: boolean;
  "transform.flipY"?: boolean;
  "transform.opacity"?: number;
  width?: number;
  height?: number;
  opacity?: number;
  [key: string]: any;
}

export interface VideoParams extends VisualParams {
  volume?: number;
  muted?: boolean;
  blurIntensity?: number;
}

export interface ImageParams extends VisualParams {
  blurIntensity?: number;
}

export interface AudioParams {
  volume?: number;
  muted?: boolean;
  [key: string]: any;
}

export interface TextParams {
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right" | "start" | "end";
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  backgroundPadding?: number;
  "background.enabled"?: boolean;
  "background.color"?: string;
  "background.cornerRadius"?: number;
  "background.paddingX"?: number;
  "background.paddingY"?: number;
  "background.offsetX"?: number;
  "background.offsetY"?: number;
  "transform.positionX"?: number;
  "transform.positionY"?: number;
  "transform.scaleX"?: number;
  "transform.scaleY"?: number;
  "transform.rotation"?: number;
  "transform.opacity"?: number;
  [key: string]: any;
}

export interface StickerParams extends VisualParams {}

export interface GraphicParams extends VisualParams {
  color?: string;
}

export interface EffectParams {
  [key: string]: any;
}

export interface VideoElement extends BaseTimelineElement {
  type: "video";
  params?: VideoParams;
  mediaId?: string;
  sourceUrl?: string; // Engine extension: remote/local source URL
  isSourceAudioEnabled?: boolean;
  hidden?: boolean;
  retime?: RetimeConfig;
  effects?: Effect[];
  masks?: Mask[];
}

export interface ImageElement extends BaseTimelineElement {
  type: "image";
  params?: ImageParams;
  mediaId?: string;
  sourceUrl?: string; // Engine extension: remote/local source URL
  hidden?: boolean;
  effects?: Effect[];
  masks?: Mask[];
}

export interface AudioElement extends BaseTimelineElement {
  type: "audio";
  params?: AudioParams;
  mediaId?: string;
  sourceUrl?: string; // Engine extension: remote/local source URL
  sourceType?: "upload" | "library";
  hidden?: boolean;
  retime?: RetimeConfig;
}

export interface TextElement extends BaseTimelineElement {
  type: "text";
  params?: TextParams;
  fontUrl?: string;      // Engine extension: remote custom font URL
  hidden?: boolean;
  effects?: Effect[];
}

export interface StickerElement extends BaseTimelineElement {
  type: "sticker";
  params?: StickerParams;
  stickerId: string;
  sourceUrl?: string; // Engine extension: remote/local source URL
  intrinsicWidth?: number;
  intrinsicHeight?: number;
  hidden?: boolean;
  effects?: Effect[];
}

export interface GraphicElement extends BaseTimelineElement {
  type: "graphic";
  params?: GraphicParams;
  definitionId: string;
  hidden?: boolean;
  effects?: Effect[];
  masks?: Mask[];
}

export interface EffectElement extends BaseTimelineElement {
  type: "effect";
  params?: EffectParams;
  effectType: string;
}

/**
 * A TransitionElement sits ON the VideoTrack at the boundary between two clips.
 *
 * Timeline layout:
 *   [Clip A ─────────────────────────────────────────]
 *                              [TransitionElement────]
 *                                   [──── Clip B ────────────────]
 *
 * - startTime  = clipA.startTime + clipA.duration - duration  (overlaps the tail of Clip A)
 * - duration   = transition duration (seconds)
 * - fromElementId  references Clip A (the outgoing clip)
 * - toElementId    references Clip B (the incoming clip)
 *
 * The renderer blends Clip A out and Clip B in during this window.
 */
export interface TransitionElement extends BaseTimelineElement {
  type: "transition";
  /** The name of the transition effect (e.g. "fade", "slide_left") */
  transitionType: string;
  /** ID of the outgoing clip (the clip that ends) */
  fromElementId: string;
  /** ID of the incoming clip (the clip that starts) */
  toElementId: string;
  params?: TransitionParams;
}

export type ExportFormat = "mp4" | "webm";
export type ExportQuality = "low" | "medium" | "high" | "very_high";

export interface Manifest {
  id: string;
  settings: {
    width: number;
    height: number;
    fps: number;
    format: ExportFormat;
    quality?: ExportQuality;
    shouldIncludeAudio?: boolean;
  };
  tracks: SceneTracks;
}

export type TimelineElement =
  | AudioElement
  | VideoElement
  | ImageElement
  | TextElement
  | StickerElement
  | GraphicElement
  | EffectElement
  | TransitionElement;

export type ElementType = TimelineElement["type"];

export type CreateAudioElement = Omit<AudioElement, "id">;
export type CreateVideoElement = Omit<VideoElement, "id">;
export type CreateImageElement = Omit<ImageElement, "id">;
export type CreateTextElement = Omit<TextElement, "id">;
export type CreateStickerElement = Omit<StickerElement, "id">;
export type CreateGraphicElement = Omit<GraphicElement, "id">;
export type CreateEffectElement = Omit<EffectElement, "id">;
export type CreateTransitionElement = Omit<TransitionElement, "id">;

export type CreateTimelineElement =
  | CreateAudioElement
  | CreateVideoElement
  | CreateImageElement
  | CreateTextElement
  | CreateStickerElement
  | CreateGraphicElement
  | CreateEffectElement
  | CreateTransitionElement;

export interface ClipboardItem {
  trackId: string;
  trackType: TrackType;
  element: CreateTimelineElement;
}

export type ExportParams = Manifest["settings"];
