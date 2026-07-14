import type { TransitionDefinition } from "../types";

/** Zoom In: Clip A zooms in (enlarges) while fading out, Clip B fades in at normal size */
export const zoomInDefinition: TransitionDefinition = {
  type: "zoom_in",
  name: "Zoom In",
  group: "Zoom",
  keywords: ["zoom", "in", "scale", "enlarge"],
  defaultDuration: 0.5,
  params: [
    { key: "scale", label: "Scale", type: "number", default: 1.3, min: 1.1, max: 2.0, step: 0.1 },
  ],
  renderer: {
    render({ fromCanvas, toCanvas, progress, params, width, height, output }) {
      const scale = 1 + progress * ((params.scale as number ?? 1.3) - 1);
      output.clearRect(0, 0, width, height);
      if (fromCanvas) {
        output.globalAlpha = 1 - progress;
        output.save();
        output.translate(width / 2, height / 2);
        output.scale(scale, scale);
        output.drawImage(fromCanvas, -width / 2, -height / 2, width, height);
        output.restore();
      }
      if (toCanvas) {
        output.globalAlpha = progress;
        output.drawImage(toCanvas, 0, 0, width, height);
      }
      output.globalAlpha = 1;
    },
  },
};

/** Zoom Out: Clip B starts zoomed in and scales down to normal while Clip A fades out */
export const zoomOutDefinition: TransitionDefinition = {
  type: "zoom_out",
  name: "Zoom Out",
  group: "Zoom",
  keywords: ["zoom", "out", "scale", "shrink"],
  defaultDuration: 0.5,
  params: [
    { key: "scale", label: "Scale", type: "number", default: 1.3, min: 1.1, max: 2.0, step: 0.1 },
  ],
  renderer: {
    render({ fromCanvas, toCanvas, progress, params, width, height, output }) {
      const maxScale = (params.scale as number) ?? 1.3;
      const scale = maxScale - progress * (maxScale - 1);
      output.clearRect(0, 0, width, height);
      if (toCanvas) {
        output.globalAlpha = 1;
        output.save();
        output.translate(width / 2, height / 2);
        output.scale(scale, scale);
        output.drawImage(toCanvas, -width / 2, -height / 2, width, height);
        output.restore();
      }
      if (fromCanvas) {
        output.globalAlpha = 1 - progress;
        output.drawImage(fromCanvas, 0, 0, width, height);
      }
      output.globalAlpha = 1;
    },
  },
};

/** Pull In: Clip B pulls in from far (small) growing to full size, Clip A stays and fades */
export const pullInDefinition: TransitionDefinition = {
  type: "pull_in",
  name: "Pull In",
  group: "Zoom",
  keywords: ["pull", "in", "zoom", "grow"],
  defaultDuration: 0.5,
  params: [
    { key: "scale", label: "Start Scale", type: "number", default: 0.1, min: 0.01, max: 0.5, step: 0.05 },
  ],
  renderer: {
    render({ fromCanvas, toCanvas, progress, params, width, height, output }) {
      const startScale = (params.scale as number) ?? 0.1;
      const scale = startScale + progress * (1 - startScale);
      output.clearRect(0, 0, width, height);
      if (fromCanvas) {
        output.globalAlpha = 1 - progress;
        output.drawImage(fromCanvas, 0, 0, width, height);
      }
      if (toCanvas) {
        output.globalAlpha = progress;
        output.save();
        output.translate(width / 2, height / 2);
        output.scale(scale, scale);
        output.drawImage(toCanvas, -width / 2, -height / 2, width, height);
        output.restore();
      }
      output.globalAlpha = 1;
    },
  },
};

/** Spin Zoom: Clip A spins and zooms out while Clip B fades in */
export const zoomSpinDefinition: TransitionDefinition = {
  type: "zoom_spin",
  name: "Spin Zoom",
  group: "Zoom",
  keywords: ["spin", "zoom", "rotate", "twist"],
  defaultDuration: 0.6,
  params: [
    { key: "angle", label: "Spin Angle (°)", type: "number", default: 360, min: 90, max: 720, step: 90 },
    { key: "scale", label: "End Scale", type: "number", default: 1.5, min: 1.1, max: 3.0, step: 0.1 },
  ],
  renderer: {
    render({ fromCanvas, toCanvas, progress, params, width, height, output }) {
      const angle = ((params.angle as number) ?? 360) * progress * (Math.PI / 180);
      const scale = 1 + progress * (((params.scale as number) ?? 1.5) - 1);
      output.clearRect(0, 0, width, height);
      if (fromCanvas) {
        output.globalAlpha = 1 - progress;
        output.save();
        output.translate(width / 2, height / 2);
        output.rotate(angle);
        output.scale(scale, scale);
        output.drawImage(fromCanvas, -width / 2, -height / 2, width, height);
        output.restore();
      }
      if (toCanvas) {
        output.globalAlpha = progress;
        output.drawImage(toCanvas, 0, 0, width, height);
      }
      output.globalAlpha = 1;
    },
  },
};

/** Zoom Fade (CapCut): Clip A zooms in while Clip B fades in — both blended together */
export const zoomFadeDefinition: TransitionDefinition = {
  type: "zoom_fade",
  name: "Zoom Fade",
  group: "Zoom",
  keywords: ["zoom", "fade", "capcut", "blend"],
  defaultDuration: 0.5,
  params: [
    { key: "scale", label: "Scale", type: "number", default: 1.2, min: 1.05, max: 2.0, step: 0.05 },
  ],
  renderer: {
    render({ fromCanvas, toCanvas, progress, params, width, height, output }) {
      const maxScale = (params.scale as number) ?? 1.2;
      const fromScale = 1 + progress * (maxScale - 1);
      const toScale = maxScale - progress * (maxScale - 1);
      output.clearRect(0, 0, width, height);
      if (fromCanvas) {
        output.globalAlpha = 1 - progress;
        output.save();
        output.translate(width / 2, height / 2);
        output.scale(fromScale, fromScale);
        output.drawImage(fromCanvas, -width / 2, -height / 2, width, height);
        output.restore();
      }
      if (toCanvas) {
        output.globalAlpha = progress;
        output.save();
        output.translate(width / 2, height / 2);
        output.scale(toScale, toScale);
        output.drawImage(toCanvas, -width / 2, -height / 2, width, height);
        output.restore();
      }
      output.globalAlpha = 1;
    },
  },
};
