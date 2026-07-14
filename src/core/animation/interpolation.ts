import type {
	AnimationChannel,
	AnimationInterpolation,
	AnimationValue,
	DiscreteAnimationChannel,
	DiscreteValue,
	ScalarAnimationChannel,
	ScalarAnimationKey,
	ScalarSegmentType,
} from "@/core/animation/types";

function byTimeAscending({
	leftTime,
	rightTime,
}: {
	leftTime: number;
	rightTime: number;
}): number {
	return leftTime - rightTime;
}

function _isWithinTimePair({
	time,
	leftTime,
	rightTime,
}: {
	time: number;
	leftTime: number;
	rightTime: number;
}): boolean {
	return time >= leftTime && time <= rightTime;
}

function _lerpNumber({
	leftValue,
	rightValue,
	progress,
}: {
	leftValue: number;
	rightValue: number;
	progress: number;
}): number {
	return leftValue + (rightValue - leftValue) * progress;
}

function normalizeRightHandle({
	handle,
	leftKey,
	rightKey,
}: {
	handle: ScalarAnimationKey["rightHandle"];
	leftKey: ScalarAnimationKey;
	rightKey: ScalarAnimationKey;
}) {
	if (!handle) {
		return undefined;
	}

	const span = Math.max(1, rightKey.time - leftKey.time);
	return {
		dt: Math.min(span, Math.max(0, handle.dt)),
		dv: handle.dv,
	};
}

function normalizeLeftHandle({
	handle,
	leftKey,
	rightKey,
}: {
	handle: ScalarAnimationKey["leftHandle"];
	leftKey: ScalarAnimationKey;
	rightKey: ScalarAnimationKey;
}) {
	if (!handle) {
		return undefined;
	}

	const span = Math.max(1, rightKey.time - leftKey.time);
	return {
		dt: Math.max(-span, Math.min(0, handle.dt)),
		dv: handle.dv,
	};
}

function normalizeScalarKey({
	key,
}: {
	key: ScalarAnimationKey;
}): ScalarAnimationKey {
	return {
		...key,
		tangentMode: key.tangentMode ?? "flat",
		segmentToNext: key.segmentToNext ?? "linear",
	};
}

function normalizeScalarChannel({
	channel,
}: {
	channel: ScalarAnimationChannel;
}): ScalarAnimationChannel {
	const sortedKeys = [...channel.keys]
		.map((key) => normalizeScalarKey({ key }))
		.sort((leftKey, rightKey) =>
			byTimeAscending({
				leftTime: leftKey.time,
				rightTime: rightKey.time,
			}),
		);
	const nextKeys = sortedKeys.map((key, index) => {
		const previousKey = sortedKeys[index - 1];
		const nextKey = sortedKeys[index + 1];
		return {
			...key,
			leftHandle:
				previousKey != null
					? normalizeLeftHandle({
							handle: key.leftHandle,
							leftKey: previousKey,
							rightKey: key,
						})
					: undefined,
			rightHandle:
				nextKey != null
					? normalizeRightHandle({
							handle: key.rightHandle,
							leftKey: key,
							rightKey: nextKey,
						})
					: undefined,
		};
	});

	return {
		...channel,
		keys: nextKeys,
	};
}

export function normalizeChannel<TChannel extends AnimationChannel>({
	channel,
}: {
	channel: TChannel;
}): TChannel {
	if (channel.kind === "scalar") {
		return normalizeScalarChannel({
			channel,
		}) as TChannel;
	}

	return {
		...channel,
		keys: [...channel.keys].sort((leftKeyframe, rightKeyframe) =>
			byTimeAscending({
				leftTime: leftKeyframe.time,
				rightTime: rightKeyframe.time,
			}),
		),
	} as TChannel;
}

function _extrapolateScalarEdge({
	mode,
	edgeKey,
	neighborKey,
	time,
}: {
	mode: "hold" | "linear";
	edgeKey: ScalarAnimationKey;
	neighborKey: ScalarAnimationKey | undefined;
	time: number;
}) {
	if (mode === "hold" || !neighborKey) {
		return edgeKey.value;
	}

	const span = neighborKey.time - edgeKey.time;
	if (span === 0) {
		return edgeKey.value;
	}

	return (
		edgeKey.value +
		((time - edgeKey.time) / span) * (neighborKey.value - edgeKey.value)
	);
}

export function getScalarSegmentInterpolation({
	segment,
}: {
	segment: ScalarSegmentType;
}): AnimationInterpolation {
	if (segment === "step") {
		return "hold";
	}

	return segment === "bezier" ? "bezier" : "linear";
}

import { getScalarChannelValueAtTime as wasmGetScalarChannelValueAtTime } from "money-printer-wasm";

export function getScalarChannelValueAtTime({
	channel,
	time,
	fallbackValue,
}: {
	channel: ScalarAnimationChannel | undefined;
	time: number;
	fallbackValue: number;
}): number {
	if (!channel || channel.keys.length === 0) {
		return fallbackValue;
	}

	return wasmGetScalarChannelValueAtTime(
		channel,
		time,
		fallbackValue,
	) as number;
}

export function getDiscreteChannelValueAtTime({
	channel,
	time,
	fallbackValue,
}: {
	channel: DiscreteAnimationChannel | undefined;
	time: number;
	fallbackValue: DiscreteValue;
}): DiscreteValue {
	if (!channel || channel.keys.length === 0) {
		return fallbackValue;
	}

	const normalizedChannel = normalizeChannel({
		channel,
	});
	let currentValue = fallbackValue;
	for (const key of normalizedChannel.keys) {
		if (time < key.time) {
			break;
		}
		currentValue = key.value;
	}
	return currentValue;
}

export function getChannelValueAtTime({
	channel,
	time,
	fallbackValue,
}: {
	channel: AnimationChannel | undefined;
	time: number;
	fallbackValue: AnimationValue;
}): AnimationValue {
	if (!channel || channel.keys.length === 0) {
		return fallbackValue;
	}

	if (channel.kind === "scalar") {
		return typeof fallbackValue === "number"
			? getScalarChannelValueAtTime({
					channel,
					time,
					fallbackValue,
				})
			: fallbackValue;
	}

	if (typeof fallbackValue !== "string" && typeof fallbackValue !== "boolean") {
		return fallbackValue;
	}

	return getDiscreteChannelValueAtTime({
		channel,
		time,
		fallbackValue,
	});
}
