import type { SceneTracks } from "./types";

export * from "./types";

export function calculateTotalDuration({
	tracks,
}: {
	tracks: SceneTracks;
}): number {
	const orderedTracks = [...tracks.overlay, tracks.main, ...tracks.audio];
	if (orderedTracks.length === 0) return 0;

	const trackEndTimes = orderedTracks.map((track) =>
		track.elements
			.filter((el) => el.type !== "transition")
			.reduce((maxEnd, element) => {
				const elementEnd = element.startTime + element.duration;
				return Math.max(maxEnd, elementEnd);
			}, 0),
	);

	return Math.max(...trackEndTimes, 0);
}
