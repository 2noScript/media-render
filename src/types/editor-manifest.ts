export type TrackType = "video" | "text" | "audio" | "graphic" | "effect";

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
  elements: (VideoElement | ImageElement)[];
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
  animations?: any;
  params?: any;
}

export interface VideoElement extends BaseTimelineElement {
  type: "video";
  sourceUrl: string;
  volume: number;
  width: number;
  height: number;
  x: number;
  y: number;
  opacity: number;
  effects?: any[];
  masks?: any[];
  retime?: RetimeConfig;
}

export interface ImageElement extends BaseTimelineElement {
  type: "image";
  sourceUrl: string;
  width: number;
  height: number;
  x: number;
  y: number;
  opacity: number;
  effects?: any[];
  masks?: any[];
}

export interface AudioElement extends BaseTimelineElement {
  type: "audio";
  sourceUrl: string;
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
  retime?: RetimeConfig;
}

export interface TextElement extends BaseTimelineElement {
  type: "text";
  text: string;
  effects?: any[];
  style: {
    fontSize: number;
    color: string;
    fontFamily: string;
    x?: number;
    y?: number;
    textAlign?: "left" | "right" | "center" | "start" | "end";
    strokeColor?: string;
    strokeWidth?: number;
    fontUrl?: string;
  };
  opacity?: number;
}

export interface StickerElement extends BaseTimelineElement {
  type: "sticker";
  stickerId: string;
  intrinsicWidth?: number;
  intrinsicHeight?: number;
  width: number;
  height: number;
  x: number;
  y: number;
  opacity: number;
  effects?: any[];
}

export interface GraphicElement extends BaseTimelineElement {
  type: "graphic";
  definitionId: string;
  width: number;
  height: number;
  x: number;
  y: number;
  opacity: number;
  effects?: any[];
  masks?: any[];
}

export interface EffectElement extends BaseTimelineElement {
  type: "effect";
  effectType: string;
}

export interface EditorManifest {
  id: string;
  settings: {
    width: number;
    height: number;
    fps: number;
    format: "mp4" | "webm";
    quality?: "low" | "medium" | "high" | "very_high";
    shouldIncludeAudio?: boolean;
  };
  tracks: Array<VideoTrack | AudioTrack | TextTrack | GraphicTrack | EffectTrack>;
}

export type TimelineElement =
  | AudioElement
  | VideoElement
  | ImageElement
  | TextElement
  | StickerElement
  | GraphicElement
  | EffectElement;

export type ElementType = TimelineElement["type"];

export type CreateAudioElement = Omit<AudioElement, "id">;
export type CreateVideoElement = Omit<VideoElement, "id">;
export type CreateImageElement = Omit<ImageElement, "id">;
export type CreateTextElement = Omit<TextElement, "id">;
export type CreateStickerElement = Omit<StickerElement, "id">;
export type CreateGraphicElement = Omit<GraphicElement, "id">;
export type CreateEffectElement = Omit<EffectElement, "id">;

export type CreateTimelineElement =
  | CreateAudioElement
  | CreateVideoElement
  | CreateImageElement
  | CreateTextElement
  | CreateStickerElement
  | CreateGraphicElement
  | CreateEffectElement;

export interface ClipboardItem {
  trackId: string;
  trackType: TrackType;
  element: CreateTimelineElement;
}
