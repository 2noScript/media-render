import type { TransitionDefinition } from "../types";

/**
 * Helper: draws a canvas multiple times with slight offsets to simulate Gaussian blur.
 * This is a box-blur approximation using N passes.
 */
function drawBlurred(
  output: any,
  canvas: any,
  x: number,
  y: number,
  w: number,
  h: number,
  sigma: number,
  alpha: number,
  horizontal = true
): void {
  const steps = Math.min(12, Math.max(1, Math.round(sigma)));
  const stepAlpha = alpha / steps;
  output.globalAlpha = stepAlpha;
  for (let i = 0; i < steps; i++) {
    const offset = (i - steps / 2) * (sigma / steps) * 2;
    if (horizontal) {
      output.drawImage(canvas, x + offset, y, w, h);
    } else {
      output.drawImage(canvas, x, y + offset, w, h);
    }
  }
}

/** Blur Dissolve: Both clips blur and cross-fade through peak blur at midpoint */
export const blurFadeDefinition: TransitionDefinition = {
  type: "blur_fade",
  name: "Blur Dissolve",
  group: "Blur",
  keywords: ["blur", "dissolve", "fade", "soft"],
  defaultDuration: 0.6,
  params: [
    { key: "intensity", label: "Blur Strength", type: "number", default: 0.6, min: 0.1, max: 1.0, step: 0.1 },
  ],
  renderer: {
    render({ fromCanvas, toCanvas, progress, params, width, height, output }) {
      const intensity = (params.intensity as number) ?? 0.6;
      // Blur peaks at mid-transition
      const t = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
      const sigma = t * 25 * intensity;

      output.clearRect(0, 0, width, height);

      if (fromCanvas) {
        if (sigma < 1) {
          output.globalAlpha = 1 - progress;
          output.drawImage(fromCanvas, 0, 0, width, height);
        } else {
          drawBlurred(output, fromCanvas, 0, 0, width, height, sigma, 1 - progress);
        }
      }

      if (toCanvas) {
        if (sigma < 1) {
          output.globalAlpha = progress;
          output.drawImage(toCanvas, 0, 0, width, height);
        } else {
          drawBlurred(output, toCanvas, 0, 0, width, height, sigma, progress);
        }
      }

      output.globalAlpha = 1;
    },
  },
};

/** Vertical Blur: Blur in vertical direction, Clip A blurs out, Clip B blurs in */
export const verticalBlurDefinition: TransitionDefinition = {
  type: "vertical_blur",
  name: "Vertical Blur",
  group: "Blur",
  keywords: ["blur", "vertical", "motion", "speed"],
  defaultDuration: 0.6,
  params: [
    { key: "intensity", label: "Blur Strength", type: "number", default: 0.6, min: 0.1, max: 1.0, step: 0.1 },
  ],
  renderer: {
    render({ fromCanvas, toCanvas, progress, params, width, height, output }) {
      const intensity = (params.intensity as number) ?? 0.6;
      const t = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
      const sigma = t * 30 * intensity;

      output.clearRect(0, 0, width, height);

      if (fromCanvas) {
        if (sigma < 1) {
          output.globalAlpha = 1 - progress;
          output.drawImage(fromCanvas, 0, 0, width, height);
        } else {
          drawBlurred(output, fromCanvas, 0, 0, width, height, sigma, 1 - progress, false);
        }
      }

      if (toCanvas) {
        if (sigma < 1) {
          output.globalAlpha = progress;
          output.drawImage(toCanvas, 0, 0, width, height);
        } else {
          drawBlurred(output, toCanvas, 0, 0, width, height, sigma, progress, false);
        }
      }

      output.globalAlpha = 1;
    },
  },
};

/** Horizontal Blur: Blur in horizontal direction (motion blur look) */
export const horizontalBlurDefinition: TransitionDefinition = {
  type: "horizontal_blur",
  name: "Horizontal Blur",
  group: "Blur",
  keywords: ["blur", "horizontal", "motion", "speed"],
  defaultDuration: 0.6,
  params: [
    { key: "intensity", label: "Blur Strength", type: "number", default: 0.6, min: 0.1, max: 1.0, step: 0.1 },
  ],
  renderer: {
    render({ fromCanvas, toCanvas, progress, params, width, height, output }) {
      const intensity = (params.intensity as number) ?? 0.6;
      const t = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
      const sigma = t * 30 * intensity;

      output.clearRect(0, 0, width, height);

      if (fromCanvas) {
        if (sigma < 1) {
          output.globalAlpha = 1 - progress;
          output.drawImage(fromCanvas, 0, 0, width, height);
        } else {
          drawBlurred(output, fromCanvas, 0, 0, width, height, sigma, 1 - progress, true);
        }
      }

      if (toCanvas) {
        if (sigma < 1) {
          output.globalAlpha = progress;
          output.drawImage(toCanvas, 0, 0, width, height);
        } else {
          drawBlurred(output, toCanvas, 0, 0, width, height, sigma, progress, true);
        }
      }

      output.globalAlpha = 1;
    },
  },
};

/**
 * Zoom Blur: Clip A zooms in with motion blur while Clip B fades in.
 * Radial blur approximated with concentric scale draws.
 */
export const zoomBlurDefinition: TransitionDefinition = {
  type: "zoom_blur",
  name: "Zoom Blur",
  group: "Blur",
  keywords: ["zoom", "blur", "radial", "motion", "speed"],
  defaultDuration: 0.6,
  params: [
    { key: "intensity", label: "Blur Strength", type: "number", default: 0.5, min: 0.1, max: 1.0, step: 0.1 },
    { key: "scale", label: "Zoom Factor", type: "number", default: 1.5, min: 1.1, max: 3.0, step: 0.1 },
  ],
  renderer: {
    render({ fromCanvas, toCanvas, progress, params, width, height, output }) {
      const intensity = (params.intensity as number) ?? 0.5;
      const maxScale = (params.scale as number) ?? 1.5;
      const steps = Math.round(6 * intensity) + 1;
      const baseScale = 1 + progress * (maxScale - 1);

      output.clearRect(0, 0, width, height);

      // Clip B fades in cleanly
      if (toCanvas) {
        output.globalAlpha = progress;
        output.drawImage(toCanvas, 0, 0, width, height);
        output.globalAlpha = 1;
      }

      // Clip A: radial zoom blur (multiple zoom levels blended)
      if (fromCanvas) {
        const alpha = (1 - progress) / steps;
        for (let i = 0; i < steps; i++) {
          const s = baseScale + (i / steps) * 0.3 * intensity;
          output.globalAlpha = alpha;
          output.save();
          output.translate(width / 2, height / 2);
          output.scale(s, s);
          output.drawImage(fromCanvas, -width / 2, -height / 2, width, height);
          output.restore();
        }
        output.globalAlpha = 1;
      }
    },
  },
};
