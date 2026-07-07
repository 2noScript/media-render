export interface Keyframe<T> {
  time: number; // local element time in seconds
  value: T;
}

/**
 * Linearly interpolates between two numbers.
 */
export function interpolateLinear(startValue: number, endValue: number, ratio: number): number {
  return startValue + (endValue - startValue) * ratio;
}

/**
 * Resolves the animated value at a specific local time from a set of keyframes.
 * Falls back to the default value if no keyframes exist.
 */
export function resolveAnimatedValue<T extends number | string | boolean>(
  keyframes: Keyframe<T>[] | undefined,
  localTime: number,
  fallbackValue: T
): T {
  if (!keyframes || keyframes.length === 0) {
    return fallbackValue;
  }

  // Sort keyframes by time just in case they are out of order
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  if (localTime <= sorted[0].time) {
    return sorted[0].value;
  }

  if (localTime >= sorted[sorted.length - 1].time) {
    return sorted[sorted.length - 1].value;
  }

  // Find the keyframe interval containing the current localTime
  for (let i = 0; i < sorted.length - 1; i++) {
    const k1 = sorted[i];
    const k2 = sorted[i + 1];
    if (localTime >= k1.time && localTime <= k2.time) {
      if (typeof k1.value === "number" && typeof k2.value === "number") {
        const ratio = (localTime - k1.time) / (k2.time - k1.time);
        return interpolateLinear(k1.value, k2.value, ratio) as any;
      }
      return k1.value; // Step interpolation for strings/booleans
    }
  }

  return fallbackValue;
}
