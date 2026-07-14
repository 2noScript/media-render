import type { TransitionDefinition } from "../types";

/** Ghost: Both clips overlap — Clip A ghosts out while Clip B shows through */
export const ghostDefinition: TransitionDefinition = {
  type: "ghost",
  name: "Ghost",
  group: "Overlay",
  keywords: ["ghost", "spirit", "overlay", "cinematic"],
  defaultDuration: 0.6,
  params: [
    { key: "intensity", label: "Ghost Opacity", type: "number", default: 0.7, min: 0.1, max: 1.0, step: 0.05 },
  ],
  renderer: {
    render({ fromCanvas, toCanvas, progress, params, width, height, output }) {
      const intensity = (params.intensity as number) ?? 0.7;
      output.clearRect(0, 0, width, height);
      if (toCanvas) {
        output.globalAlpha = 1;
        output.drawImage(toCanvas, 0, 0, width, height);
      }
      if (fromCanvas) {
        output.globalAlpha = (1 - progress) * intensity;
        output.drawImage(fromCanvas, 0, 0, width, height);
      }
      output.globalAlpha = 1;
    },
  },
};

/**
 * Page Turn: Clip A curls away like a page revealing Clip B underneath.
 * Approximated with a skew+scale clipping mask and gradient shadow edge.
 */
export const pageTurnDefinition: TransitionDefinition = {
  type: "page_turn",
  name: "Page Turn",
  group: "Overlay",
  keywords: ["page", "turn", "flip", "book", "curl"],
  defaultDuration: 0.7,
  params: [
    { key: "intensity", label: "Shadow", type: "number", default: 0.5, min: 0, max: 1, step: 0.1 },
  ],
  renderer: {
    render({ fromCanvas, toCanvas, progress, params, width, height, output }) {
      const shadow = (params.intensity as number) ?? 0.5;
      const foldX = (1 - progress) * width; // fold line moves left → 0

      output.clearRect(0, 0, width, height);

      // Clip B underneath — fully visible
      if (toCanvas) {
        output.drawImage(toCanvas, 0, 0, width, height);
      }

      if (fromCanvas) {
        // Clip the revealed portion of Clip A (left of fold line)
        output.save();
        output.beginPath();
        output.rect(0, 0, foldX, height);
        output.clip();

        // Slight skew to simulate curl
        const skew = progress * 0.08;
        output.transform(1, 0, skew, 1 - progress * 0.05, 0, 0);
        output.drawImage(fromCanvas, 0, 0, width, height);
        output.restore();

        // Fold shadow gradient along the fold line
        const grad = output.createLinearGradient(foldX - 30, 0, foldX, 0);
        grad.addColorStop(0, `rgba(0,0,0,0)`);
        grad.addColorStop(1, `rgba(0,0,0,${shadow * progress})`);
        output.fillStyle = grad;
        output.fillRect(Math.max(0, foldX - 30), 0, 30, height);
      }
    },
  },
};

/** Split: Clip A splits in half (left goes left, right goes right) revealing Clip B */
export const splitDefinition: TransitionDefinition = {
  type: "split",
  name: "Split",
  group: "Warp",
  keywords: ["split", "divide", "cut", "apart"],
  defaultDuration: 0.5,
  params: [],
  renderer: {
    render({ fromCanvas, toCanvas, progress, width, height, output }) {
      output.clearRect(0, 0, width, height);
      // Clip B revealed underneath
      if (toCanvas) {
        output.globalAlpha = progress;
        output.drawImage(toCanvas, 0, 0, width, height);
        output.globalAlpha = 1;
      }
      if (fromCanvas) {
        const offset = progress * width * 0.6;
        // Left half slides left
        output.save();
        output.beginPath();
        output.rect(0, 0, width / 2, height);
        output.clip();
        output.drawImage(fromCanvas, -offset, 0, width, height);
        output.restore();
        // Right half slides right
        output.save();
        output.beginPath();
        output.rect(width / 2, 0, width / 2, height);
        output.clip();
        output.drawImage(fromCanvas, offset, 0, width, height);
        output.restore();
      }
    },
  },
};

/**
 * Wave Ripple: Clip A distorts with horizontal wave bands while Clip B fades in.
 * Rendered per-row using off-screen canvas for wave distortion.
 */
export const waveRippleDefinition: TransitionDefinition = {
  type: "wave_ripple",
  name: "Wave Ripple",
  group: "Warp",
  keywords: ["wave", "ripple", "distort", "water"],
  defaultDuration: 0.7,
  params: [
    { key: "frequency", label: "Frequency", type: "number", default: 6, min: 2, max: 20, step: 1 },
    { key: "intensity", label: "Amplitude", type: "number", default: 0.4, min: 0.1, max: 1.0, step: 0.1 },
  ],
  renderer: {
    render({ fromCanvas, toCanvas, progress, params, width, height, output }) {
      const freq = (params.frequency as number) ?? 6;
      const amplitude = ((params.intensity as number) ?? 0.4) * 30 * (1 - progress);
      output.clearRect(0, 0, width, height);

      // Clip B fades in
      if (toCanvas) {
        output.globalAlpha = progress;
        output.drawImage(toCanvas, 0, 0, width, height);
        output.globalAlpha = 1;
      }

      // Clip A distorted with wave using row slices
      if (fromCanvas && amplitude > 0.5) {
        output.globalAlpha = 1 - progress;
        const sliceH = 4;
        const rows = Math.ceil(height / sliceH);
        for (let r = 0; r < rows; r++) {
          const y = r * sliceH;
          const wave = Math.sin((y / height) * Math.PI * 2 * freq + progress * Math.PI * 4) * amplitude;
          output.drawImage(fromCanvas, 0, y, width, sliceH, wave, y, width, sliceH);
        }
        output.globalAlpha = 1;
      }
    },
  },
};

/**
 * Swirl Twist: Clip A spirals away (rotation + scale) while Clip B fades in.
 * Approximated with concentric rotation layers.
 */
export const swirlDefinition: TransitionDefinition = {
  type: "swirl",
  name: "Swirl Twist",
  group: "Warp",
  keywords: ["swirl", "twist", "spiral", "rotate", "warp"],
  defaultDuration: 0.7,
  params: [
    { key: "angle", label: "Max Twist (°)", type: "number", default: 270, min: 90, max: 720, step: 90 },
    { key: "intensity", label: "Intensity", type: "number", default: 0.8, min: 0.1, max: 1.0, step: 0.1 },
  ],
  renderer: {
    render({ fromCanvas, toCanvas, progress, params, width, height, output }) {
      const maxAngle = ((params.angle as number) ?? 270) * (Math.PI / 180);
      const angle = progress * maxAngle;
      const scale = 1 - progress * ((params.intensity as number) ?? 0.8) * 0.5;

      output.clearRect(0, 0, width, height);

      // Clip B fades in
      if (toCanvas) {
        output.globalAlpha = progress;
        output.drawImage(toCanvas, 0, 0, width, height);
        output.globalAlpha = 1;
      }

      // Clip A spirals away
      if (fromCanvas) {
        output.globalAlpha = 1 - progress;
        output.save();
        output.translate(width / 2, height / 2);
        output.rotate(angle);
        output.scale(scale, scale);
        output.drawImage(fromCanvas, -width / 2, -height / 2, width, height);
        output.restore();
        output.globalAlpha = 1;
      }
    },
  },
};
