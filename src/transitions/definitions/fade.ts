import type { TransitionDefinition } from "../types";

/**
 * Fade transition — cross-dissolves Clip A out and Clip B in.
 * progress 0 → only Clip A visible
 * progress 1 → only Clip B visible
 */
export const fadeDefinition: TransitionDefinition = {
  type: "fade",
  name: "Fade",
  group: "Fade",
  keywords: ["fade", "cross", "dissolve", "smooth"],
  defaultDuration: 0.5,
  params: [
    {
      key: "intensity",
      label: "Intensity",
      type: "number",
      default: 1,
      min: 0,
      max: 1,
      step: 0.05,
    },
  ],
  renderer: {
    render({ fromCanvas, toCanvas, progress, params, width, height, output }) {
      const intensity = (params.intensity as number) ?? 1;
      const eased = progress; // easing already applied by caller

      output.clearRect(0, 0, width, height);

      // Draw outgoing clip fading out
      if (fromCanvas) {
        output.globalAlpha = (1 - eased) * intensity;
        output.drawImage(fromCanvas, 0, 0, width, height);
      }

      // Draw incoming clip fading in
      if (toCanvas) {
        output.globalAlpha = eased * intensity + (1 - intensity);
        output.drawImage(toCanvas, 0, 0, width, height);
      }

      output.globalAlpha = 1;
    },
  },
};

/**
 * Fade to Black — Clip A fades to black, then Clip B fades in from black.
 */
export const fadeBlackDefinition: TransitionDefinition = {
  type: "fade_black",
  name: "Fade to Black",
  group: "Fade",
  keywords: ["fade", "black", "capcut"],
  defaultDuration: 0.6,
  params: [],
  renderer: {
    render({ fromCanvas, toCanvas, progress, width, height, output }) {
      output.clearRect(0, 0, width, height);

      if (progress < 0.5) {
        // Phase 1: Clip A fades out to black
        const p = progress * 2; // 0 → 1
        if (fromCanvas) {
          output.globalAlpha = 1 - p;
          output.drawImage(fromCanvas, 0, 0, width, height);
          output.globalAlpha = 1;
        }
        output.fillStyle = `rgba(0,0,0,${p})`;
        output.fillRect(0, 0, width, height);
      } else {
        // Phase 2: Clip B fades in from black
        const p = (progress - 0.5) * 2; // 0 → 1
        if (toCanvas) {
          output.globalAlpha = p;
          output.drawImage(toCanvas, 0, 0, width, height);
          output.globalAlpha = 1;
        }
        output.fillStyle = `rgba(0,0,0,${1 - p})`;
        output.fillRect(0, 0, width, height);
      }
    },
  },
};

/**
 * Fade to White — same as fade_black but with white fill.
 */
export const fadeWhiteDefinition: TransitionDefinition = {
  type: "fade_white",
  name: "Fade to White",
  group: "Fade",
  keywords: ["fade", "white"],
  defaultDuration: 0.6,
  params: [],
  renderer: {
    render({ fromCanvas, toCanvas, progress, width, height, output }) {
      output.clearRect(0, 0, width, height);

      if (progress < 0.5) {
        const p = progress * 2;
        if (fromCanvas) {
          output.globalAlpha = 1 - p;
          output.drawImage(fromCanvas, 0, 0, width, height);
          output.globalAlpha = 1;
        }
        output.fillStyle = `rgba(255,255,255,${p})`;
        output.fillRect(0, 0, width, height);
      } else {
        const p = (progress - 0.5) * 2;
        if (toCanvas) {
          output.globalAlpha = p;
          output.drawImage(toCanvas, 0, 0, width, height);
          output.globalAlpha = 1;
        }
        output.fillStyle = `rgba(255,255,255,${1 - p})`;
        output.fillRect(0, 0, width, height);
      }
    },
  },
};
