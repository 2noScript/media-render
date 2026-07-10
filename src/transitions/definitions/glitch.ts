import { createCanvas } from "@napi-rs/canvas";
import type { TransitionDefinition } from "../types";

/**
 * RGB Glitch: Chromatic aberration — R/G/B channels shift in different directions.
 * Implemented by rendering the clip three times with different color channel masks and offsets.
 */
export const rgbGlitchDefinition: TransitionDefinition = {
  type: "rgb_glitch",
  name: "Glitch Split",
  group: "Glitch",
  keywords: ["glitch", "rgb", "chromatic", "aberration", "distort"],
  defaultDuration: 0.5,
  params: [
    { key: "intensity", label: "Shift Strength", type: "number", default: 0.4, min: 0.1, max: 1.0, step: 0.1 },
  ],
  renderer: {
    render({ fromCanvas, toCanvas, progress, params, width, height, output }) {
      const intensity = (params.intensity as number) ?? 0.4;
      const shift = progress * width * 0.06 * intensity;

      output.clearRect(0, 0, width, height);

      // Clip B fades in cleanly underneath
      if (toCanvas) {
        output.globalAlpha = progress;
        output.drawImage(toCanvas, 0, 0, width, height);
        output.globalAlpha = 1;
      }

      if (fromCanvas) {
        const fromAlpha = 1 - progress;

        // Red channel: shift right
        output.save();
        output.globalAlpha = fromAlpha * 0.85;
        output.globalCompositeOperation = "source-over";
        // Draw clip, then mask to red only using multiply
        output.drawImage(fromCanvas, shift, 0, width, height);
        // Red tint overlay
        output.globalCompositeOperation = "multiply";
        output.globalAlpha = fromAlpha * 0.4;
        output.fillStyle = "rgba(255, 0, 0, 1)";
        output.fillRect(0, 0, width, height);
        output.restore();

        // Blue channel: shift left
        output.save();
        output.globalAlpha = fromAlpha * 0.5;
        output.globalCompositeOperation = "screen";
        output.drawImage(fromCanvas, -shift * 0.7, shift * 0.3, width, height);
        output.globalAlpha = fromAlpha * 0.3;
        output.fillStyle = "rgba(0, 0, 255, 1)";
        output.fillRect(0, 0, width, height);
        output.restore();

        // Green channel: slight vertical shift
        output.save();
        output.globalAlpha = fromAlpha * 0.35;
        output.globalCompositeOperation = "screen";
        output.drawImage(fromCanvas, 0, -shift * 0.5, width, height);
        output.restore();
      }

      output.globalCompositeOperation = "source-over";
      output.globalAlpha = 1;
    },
  },
};

/**
 * Pixelate: Clip A pixelates into blocks while Clip B fades in.
 * Uses off-screen canvas drawn at low resolution then scaled up.
 */
export const pixelateDefinition: TransitionDefinition = {
  type: "pixelate",
  name: "Pixelate",
  group: "Glitch",
  keywords: ["pixelate", "pixel", "8bit", "retro", "mosaic"],
  defaultDuration: 0.6,
  params: [
    { key: "intensity", label: "Max Pixel Size", type: "number", default: 0.8, min: 0.2, max: 1.0, step: 0.1 },
  ],
  renderer: {
    render({ fromCanvas, toCanvas, progress, params, width, height, output }) {
      const intensity = (params.intensity as number) ?? 0.8;
      // Pixel size peaks at mid-transition then shrinks (block → fade)
      const t = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
      const pixelSize = Math.max(1, Math.round(t * 60 * intensity));

      output.clearRect(0, 0, width, height);

      // Clip B fades in
      if (toCanvas) {
        output.globalAlpha = progress;
        output.drawImage(toCanvas, 0, 0, width, height);
        output.globalAlpha = 1;
      }

      // Clip A pixelates out
      if (fromCanvas) {
        output.globalAlpha = 1 - progress;
        if (pixelSize <= 1) {
          output.drawImage(fromCanvas, 0, 0, width, height);
        } else {
          // Draw at reduced size then scale up without interpolation
          const sw = Math.max(1, Math.ceil(width / pixelSize));
          const sh = Math.max(1, Math.ceil(height / pixelSize));
          const tmpCanvas = createCanvas(sw, sh);
          const tmpCtx = tmpCanvas.getContext("2d");
          tmpCtx.drawImage(fromCanvas as any, 0, 0, sw, sh);
          (output as any).imageSmoothingEnabled = false;
          output.drawImage(tmpCanvas as any, 0, 0, width, height);
          (output as any).imageSmoothingEnabled = true;
        }
        output.globalAlpha = 1;
      }
    },
  },
};

/**
 * Shake: Clip A shakes (random rapid offset) while Clip B fades in.
 * Deterministic shake using sin-based pseudo-random offsets.
 */
export const shakeDefinition: TransitionDefinition = {
  type: "shake",
  name: "Shake",
  group: "Glitch",
  keywords: ["shake", "vibrate", "jitter", "camera"],
  defaultDuration: 0.5,
  params: [
    { key: "intensity", label: "Amplitude", type: "number", default: 0.5, min: 0.1, max: 1.0, step: 0.1 },
    { key: "frequency", label: "Frequency", type: "number", default: 20, min: 5, max: 60, step: 5 },
  ],
  renderer: {
    render({ fromCanvas, toCanvas, progress, params, width, height, output }) {
      const amplitude = ((params.intensity as number) ?? 0.5) * 30 * (1 - progress);
      const freq = (params.frequency as number) ?? 20;

      const shakeX = Math.sin(progress * Math.PI * 2 * freq) * amplitude;
      const shakeY = Math.cos(progress * Math.PI * 2 * freq * 0.7) * amplitude * 0.6;

      output.clearRect(0, 0, width, height);

      // Clip B fades in cleanly
      if (toCanvas) {
        output.globalAlpha = progress;
        output.drawImage(toCanvas, 0, 0, width, height);
        output.globalAlpha = 1;
      }

      // Clip A shakes
      if (fromCanvas) {
        output.globalAlpha = 1 - progress;
        output.drawImage(fromCanvas, shakeX, shakeY, width, height);
        output.globalAlpha = 1;
      }
    },
  },
};
