export const TICKS_PER_SECOND = 120_000;

export type FrameRate = {
	numerator: number;
	denominator: number;
};

// 1. Convert ticks to seconds (matching i64 ticks in Rust)
export function mediaTimeToSeconds({ time }: { time: number }): number {
	return time / TICKS_PER_SECOND;
}

// 2. Define structures for Keyframes
export type CurveHandle = {
	dt: number;
	dv: number;
};

export type BezierSolveKey = {
	time: number;
	value: number;
};

// 3. Bezier solver algorithm (translated directly from rust/crates/scene/src/animation/bezier.rs)
function getBezierPoint(progress: number, p0: number, p1: number, p2: number, p3: number): number {
	const mt = 1.0 - progress;
	return (
		mt * mt * mt * p0 +
		3.0 * mt * mt * progress * p1 +
		3.0 * mt * progress * progress * p2 +
		progress * progress * progress * p3
	);
}

function getDefaultRightHandle(leftKey: BezierSolveKey, rightKey: BezierSolveKey): CurveHandle {
	return {
		dt: (rightKey.time - leftKey.time) / 3.0,
		dv: (rightKey.value - leftKey.value) / 3.0,
	};
}

function getDefaultLeftHandle(leftKey: BezierSolveKey, rightKey: BezierSolveKey): CurveHandle {
	return {
		dt: -(rightKey.time - leftKey.time) / 3.0,
		dv: -(rightKey.value - leftKey.value) / 3.0,
	};
}

function normalizeRightHandle(handle: CurveHandle | null | undefined, leftTime: number, rightTime: number): CurveHandle | null {
	if (!handle) return null;
	const span = Math.max(rightTime - leftTime, 1);
	return {
		dt: Math.max(Math.min(handle.dt, span), 0),
		dv: handle.dv,
	};
}

function normalizeLeftHandle(handle: CurveHandle | null | undefined, leftTime: number, rightTime: number): CurveHandle | null {
	if (!handle) return null;
	const span = Math.max(rightTime - leftTime, 1);
	return {
		dt: Math.max(Math.min(handle.dt, 0), -span),
		dv: handle.dv,
	};
}

const BEZIER_SOLVE_ITERATIONS = 20;

function solveBezierProgressForTime(
	time: number,
	leftKey: BezierSolveKey,
	rightKey: BezierSolveKey,
	rightHandle: CurveHandle | null | undefined,
	leftHandle: CurveHandle | null | undefined,
): number {
	const rHandle = normalizeRightHandle(rightHandle, leftKey.time, rightKey.time) || getDefaultRightHandle(leftKey, rightKey);
	const lHandle = normalizeLeftHandle(leftHandle, leftKey.time, rightKey.time) || getDefaultLeftHandle(leftKey, rightKey);

	let lower = 0.0;
	let upper = 1.0;

	for (let i = 0; i < BEZIER_SOLVE_ITERATIONS; i++) {
		const mid = (lower + upper) / 2.0;
		const estimate = getBezierPoint(
			mid,
			leftKey.time,
			leftKey.time + rHandle.dt,
			rightKey.time + lHandle.dt,
			rightKey.time,
		);
		if (estimate < time) {
			lower = mid;
		} else {
			upper = mid;
		}
	}

	return (lower + upper) / 2.0;
}

// 4. Extrapolation edge (Hold / Cycle...)
function extrapolateScalarEdge(
	mode: string,
	edgeKeyTime: number,
	edgeKeyValue: number,
	neighborKey: { time: number; value: number } | null | undefined,
	time: number,
): number {
	if (mode === "hold" || !neighborKey) {
		return edgeKeyValue;
	}
	const span = neighborKey.time - edgeKeyTime;
	if (span === 0) {
		return edgeKeyValue;
	}
	return edgeKeyValue + ((time - edgeKeyTime) / span) * (neighborKey.value - edgeKeyValue);
}

// 5. Main keyframe interpolation (translated directly from rust/crates/scene/src/animation/channel.rs)
export function getScalarChannelValueAtTime(
	channel: any,
	time: number,
	fallbackValue: number,
): number {
	if (!channel || !channel.keys || channel.keys.length === 0) {
		return fallbackValue;
	}

	const keys = [...channel.keys].sort((a, b) => a.time - b.time);
	const firstKey = keys[0];
	const lastKey = keys[keys.length - 1];

	if (time <= firstKey.time) {
		if (time < firstKey.time) {
			const beforeMode = channel.extrapolation?.before || "hold";
			const neighbor = keys.length > 1 ? keys[1] : null;
			return extrapolateScalarEdge(beforeMode, firstKey.time, firstKey.value, neighbor, time);
		}
		return firstKey.value;
	}

	if (time >= lastKey.time) {
		if (time > lastKey.time) {
			const afterMode = channel.extrapolation?.after || "hold";
			const neighbor = keys.length > 1 ? keys[keys.length - 2] : null;
			return extrapolateScalarEdge(afterMode, lastKey.time, lastKey.value, neighbor, time);
		}
		return lastKey.value;
	}

	for (let i = 0; i < keys.length - 1; i++) {
		const leftKey = keys[i];
		const rightKey = keys[i + 1];

		if (time === rightKey.time) {
			return rightKey.value;
		}

		if (time >= leftKey.time && time <= rightKey.time) {
			const segmentToNext = leftKey.segmentToNext || "linear";

			if (segmentToNext === "step" || segmentToNext === "hold") {
				return leftKey.value;
			}

			const span = rightKey.time - leftKey.time;
			if (span === 0) {
				return rightKey.value;
			}

			const progress = Math.max(0, Math.min((time - leftKey.time) / span, 1));
			if (segmentToNext === "linear") {
				return leftKey.value + (rightKey.value - leftKey.value) * progress;
			}

			// Bezier
			const lSolveKey = { time: leftKey.time, value: leftKey.value };
			const rSolveKey = { time: rightKey.time, value: rightKey.value };

			const curveProgress = solveBezierProgressForTime(
				time,
				lSolveKey,
				rSolveKey,
				leftKey.rightHandle,
				rightKey.leftHandle,
			);

			const rHandleResolved = normalizeRightHandle(leftKey.rightHandle, leftKey.time, rightKey.time) || getDefaultRightHandle(lSolveKey, rSolveKey);
			const lHandleResolved = normalizeLeftHandle(rightKey.leftHandle, leftKey.time, rightKey.time) || getDefaultLeftHandle(lSolveKey, rSolveKey);

			return getBezierPoint(
				curveProgress,
				leftKey.value,
				leftKey.value + rHandleResolved.dv,
				rightKey.value + lHandleResolved.dv,
				rightKey.value,
			);
		}
	}

	return lastKey.value;
}
