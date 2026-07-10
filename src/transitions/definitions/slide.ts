import type { TransitionDefinition } from "../types";

/** Slide Left: Clip A slides out to left, Clip B slides in from right */
export const slideLeftDefinition: TransitionDefinition = {
  type: "slide_left",
  name: "Slide Left",
  group: "Slide",
  keywords: ["slide", "left", "pan", "push"],
  defaultDuration: 0.5,
  easing: "ease-out",
  params: [],
  renderer: {
    render({ fromCanvas, toCanvas, progress, width, height, output }) {
      output.clearRect(0, 0, width, height);
      const offset = progress * width;
      if (fromCanvas) output.drawImage(fromCanvas, -offset, 0, width, height);
      if (toCanvas) output.drawImage(toCanvas, width - offset, 0, width, height);
    },
  },
};

/** Slide Right: Clip A slides out to right, Clip B slides in from left */
export const slideRightDefinition: TransitionDefinition = {
  type: "slide_right",
  name: "Slide Right",
  group: "Slide",
  keywords: ["slide", "right", "pan", "push"],
  defaultDuration: 0.5,
  easing: "ease-out",
  params: [],
  renderer: {
    render({ fromCanvas, toCanvas, progress, width, height, output }) {
      output.clearRect(0, 0, width, height);
      const offset = progress * width;
      if (fromCanvas) output.drawImage(fromCanvas, offset, 0, width, height);
      if (toCanvas) output.drawImage(toCanvas, offset - width, 0, width, height);
    },
  },
};

/** Slide Up: Clip A slides out to top, Clip B slides in from bottom */
export const slideUpDefinition: TransitionDefinition = {
  type: "slide_up",
  name: "Slide Up",
  group: "Slide",
  keywords: ["slide", "up", "pan"],
  defaultDuration: 0.5,
  easing: "ease-out",
  params: [],
  renderer: {
    render({ fromCanvas, toCanvas, progress, width, height, output }) {
      output.clearRect(0, 0, width, height);
      const offset = progress * height;
      if (fromCanvas) output.drawImage(fromCanvas, 0, -offset, width, height);
      if (toCanvas) output.drawImage(toCanvas, 0, height - offset, width, height);
    },
  },
};

/** Slide Down: Clip A slides out to bottom, Clip B slides in from top */
export const slideDownDefinition: TransitionDefinition = {
  type: "slide_down",
  name: "Slide Down",
  group: "Slide",
  keywords: ["slide", "down", "pan"],
  defaultDuration: 0.5,
  easing: "ease-out",
  params: [],
  renderer: {
    render({ fromCanvas, toCanvas, progress, width, height, output }) {
      output.clearRect(0, 0, width, height);
      const offset = progress * height;
      if (fromCanvas) output.drawImage(fromCanvas, 0, offset, width, height);
      if (toCanvas) output.drawImage(toCanvas, 0, offset - height, width, height);
    },
  },
};

/**
 * Slide Blur Fade (CapCut): Clip A blurs and fades while sliding left,
 * Clip B slides in from right and sharpens.
 * Blur approximated by multiple offset draws.
 */
export const slideBlurFadeDefinition: TransitionDefinition = {
  type: "slide_blur_fade",
  name: "Blur Slide",
  group: "Slide",
  keywords: ["slide", "blur", "fade", "capcut"],
  defaultDuration: 0.6,
  params: [
    { key: "intensity", label: "Blur Intensity", type: "number", default: 0.6, min: 0, max: 1, step: 0.1 },
  ],
  renderer: {
    render({ fromCanvas, toCanvas, progress, params, width, height, output }) {
      const intensity = (params.intensity as number) ?? 0.6;
      const slideOffset = progress * width;
      const blurSteps = 6;
      const maxBlurOffset = progress * 30 * intensity;

      output.clearRect(0, 0, width, height);

      // Outgoing clip: slide left + blur approximation
      if (fromCanvas) {
        const alpha = (1 - progress) / blurSteps;
        for (let i = 0; i < blurSteps; i++) {
          const blurX = ((i - blurSteps / 2) / blurSteps) * maxBlurOffset;
          output.globalAlpha = alpha;
          output.drawImage(fromCanvas, -slideOffset + blurX, 0, width, height);
        }
      }

      // Incoming clip: slide in from right + fade in
      if (toCanvas) {
        const alpha = progress / blurSteps;
        const incomingBlur = (1 - progress) * 30 * intensity;
        for (let i = 0; i < blurSteps; i++) {
          const blurX = ((i - blurSteps / 2) / blurSteps) * incomingBlur;
          output.globalAlpha = alpha;
          output.drawImage(toCanvas, width - slideOffset + blurX, 0, width, height);
        }
      }

      output.globalAlpha = 1;
    },
  },
};
