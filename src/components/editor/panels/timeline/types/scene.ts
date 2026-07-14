import type { VideoTrack, AudioTrack, OverlayTrack } from "./tracks";

export interface Bookmark {
	time: number;
	note?: string;
	color?: string;
	duration?: number;
}

export type TrackType = "video" | "text" | "audio" | "graphic" | "effect";

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
