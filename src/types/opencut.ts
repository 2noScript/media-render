export type TrackType = "video" | "text" | "audio" | "sticker";

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

export interface BaseTimelineElement {
  id: string;
  name: string;
  duration: number;   // Visible duration on timeline (seconds)
  startTime: number;  // Position on timeline (seconds)
  trimStart: number;  // Trim from source start (seconds)
  trimEnd: number;    // Trim from source end (seconds)
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
}

export interface ImageElement extends BaseTimelineElement {
  type: "image";
  sourceUrl: string;
  width: number;
  height: number;
  x: number;
  y: number;
  opacity: number;
}

export interface AudioElement extends BaseTimelineElement {
  type: "audio";
  sourceUrl: string;
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
}

export interface TextElement extends BaseTimelineElement {
  type: "text";
  text: string;
  style: {
    fontSize: number;
    color: string;
    fontFamily: string;
    x: number;
    y: number;
  };
}

export interface ProjectManifest {
  projectId: string;
  episodeId: string;
  settings: {
    width: number;
    height: number;
    fps: number;
    format: "mp4" | "webm";
    quality?: "low" | "medium" | "high" | "very_high";
    shouldIncludeAudio?: boolean;
  };
  tracks: Array<VideoTrack | AudioTrack | TextTrack>;
}
