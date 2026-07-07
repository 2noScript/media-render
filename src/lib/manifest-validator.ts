import { TrackType } from "../types/manifest";

/**
 * Validates a parsed project manifest against the OpenCut engine schema rules.
 * @param manifest The raw or parsed manifest object
 * @returns Array of validation error strings. If empty, the manifest is valid.
 */
export function validateManifest(manifest: any): string[] {
  const errors: string[] = [];

  if (!manifest || typeof manifest !== "object") {
    return ["Manifest is null or not a valid object"];
  }

  // 1. Root Level Validation
  if (!manifest.id || typeof manifest.id !== "string") {
    errors.push("Root: 'id' is required and must be a string");
  }

  if (!manifest.settings || typeof manifest.settings !== "object") {
    errors.push("Root: 'settings' object is required");
  } else {
    const settings = manifest.settings;
    if (typeof settings.width !== "number" || settings.width <= 0) {
      errors.push("Settings: 'width' must be a positive number");
    }
    if (typeof settings.height !== "number" || settings.height <= 0) {
      errors.push("Settings: 'height' must be a positive number");
    }
    if (typeof settings.fps !== "number" || settings.fps <= 0) {
      errors.push("Settings: 'fps' must be a positive number");
    }
    if (settings.format !== "mp4" && settings.format !== "webm") {
      errors.push("Settings: 'format' must be either 'mp4' or 'webm'");
    }
    if (settings.quality && !["low", "medium", "high", "very_high"].includes(settings.quality)) {
      errors.push("Settings: 'quality' must be 'low', 'medium', 'high', or 'very_high'");
    }
  }

  if (!Array.isArray(manifest.tracks)) {
    errors.push("Root: 'tracks' is required and must be an array");
    return errors; // Cannot validate tracks if not an array
  }

  // 2. Track Level Validation
  const validTrackTypes: TrackType[] = ["video", "text", "audio", "graphic", "effect"];
  let mainVideoTrackCount = 0;

  manifest.tracks.forEach((track: any, trackIdx: number) => {
    const trackLabel = `Track[${trackIdx}] (ID: ${track.id || "unknown"})`;

    if (!track.id || typeof track.id !== "string") {
      errors.push(`${trackLabel}: 'id' is required and must be a string`);
    }

    if (!validTrackTypes.includes(track.type)) {
      errors.push(`${trackLabel}: 'type' must be one of: ${validTrackTypes.join(", ")}`);
    }

    if (track.type === "video" && track.isMain === true) {
      mainVideoTrackCount++;
    }

    if (!Array.isArray(track.elements)) {
      errors.push(`${trackLabel}: 'elements' must be an array`);
      return;
    }

    // 3. Element Level Validation
    track.elements.forEach((el: any, elIdx: number) => {
      const elLabel = `${trackLabel} Element[${elIdx}] (ID: ${el.id || "unknown"})`;

      if (!el.id || typeof el.id !== "string") {
        errors.push(`${elLabel}: 'id' is required and must be a string`);
      }

      if (typeof el.duration !== "number" || el.duration < 0) {
        errors.push(`${elLabel}: 'duration' must be a non-negative number`);
      }

      if (typeof el.startTime !== "number" || el.startTime < 0) {
        errors.push(`${elLabel}: 'startTime' must be a non-negative number`);
      }

      if (el.trimStart !== undefined && (typeof el.trimStart !== "number" || el.trimStart < 0)) {
        errors.push(`${elLabel}: 'trimStart' must be a non-negative number`);
      }

      if (el.trimEnd !== undefined && (typeof el.trimEnd !== "number" || el.trimEnd < 0)) {
        errors.push(`${elLabel}: 'trimEnd' must be a non-negative number`);
      }

      // Element-specific Type Validation
      switch (el.type) {
        case "video":
          if (!el.sourceUrl && !el.mediaId) {
            errors.push(`${elLabel}: Video element must define 'sourceUrl' or 'mediaId'`);
          }
          break;
        case "image":
          if (!el.sourceUrl && !el.mediaId) {
            errors.push(`${elLabel}: Image element must define 'sourceUrl' or 'mediaId'`);
          }
          break;
        case "audio":
          if (!el.sourceUrl && !el.mediaId) {
            errors.push(`${elLabel}: Audio element must define 'sourceUrl' or 'mediaId'`);
          }
          break;
        case "text":
          const content = el.text ?? el.params?.content;
          if (content === undefined || content === null) {
            errors.push(`${elLabel}: Text element must define root 'text' or 'params.content'`);
          }
          if (el.params?.fontUrl !== undefined) {
            errors.push(`${elLabel}: 'fontUrl' must be placed at the root level of the element, not inside 'params'`);
          }
          break;
        case "sticker":
          if (!el.stickerId) {
            errors.push(`${elLabel}: Sticker element must define 'stickerId'`);
          }
          break;
        case "graphic":
          if (!el.definitionId) {
            errors.push(`${elLabel}: Graphic element must define 'definitionId'`);
          }
          break;
        case "effect":
          if (!el.effectType) {
            errors.push(`${elLabel}: Effect element must define 'effectType'`);
          }
          break;
        default:
          errors.push(`${elLabel}: Unknown element type '${el.type}'`);
          break;
      }
    });
  });

  if (manifest.tracks.length > 0 && mainVideoTrackCount === 0) {
    // Note: Technically allowed in some compositions, but usually recommended
    // errors.push("Tracks: No main video track (isMain: true) found");
  }

  return errors;
}
