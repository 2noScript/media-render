import type { TransitionDefinition } from "../types";

/** White Flash: Scene flashes to white between clips */
export const flashWhiteDefinition: TransitionDefinition = {
  type: "flash_white",
  name: "White Flash",
  group: "Flash",
  keywords: ["flash", "white", "bright", "light"],
  defaultDuration: 0.4,
  params: [
    { key: "intensity", label: "Flash Brightness", type: "number", default: 1.0, min: 0.3, max: 1.0, step: 0.1 },
  ],
  renderer: {
    render({ fromCanvas, toCanvas, progress, params, width, height, output }) {
      const intensity = (params.intensity as number) ?? 1.0;
      // Flash peaks at mid-transition: 0→1→0
      const flash = progress < 0.5 ? progress * 2 : (1 - progress) * 2;

      output.clearRect(0, 0, width, height);

      if (progress < 0.5) {
        // Phase 1: Clip A fades toward flash
        if (fromCanvas) {
          output.globalAlpha = 1 - flash;
          output.drawImage(fromCanvas, 0, 0, width, height);
          output.globalAlpha = 1;
        }
      } else {
        // Phase 2: Clip B fades in from flash
        if (toCanvas) {
          output.globalAlpha = 1 - flash;
          output.drawImage(toCanvas, 0, 0, width, height);
          output.globalAlpha = 1;
        }
      }

      // White overlay
      output.fillStyle = `rgba(255,255,255,${flash * intensity})`;
      output.fillRect(0, 0, width, height);
    },
  },
};

/** Black Flash: Scene flashes to black between clips */
export const flashBlackDefinition: TransitionDefinition = {
  type: "flash_black",
  name: "Black Flash",
  group: "Flash",
  keywords: ["flash", "black", "dark", "strobe"],
  defaultDuration: 0.4,
  params: [
    { key: "intensity", label: "Flash Darkness", type: "number", default: 1.0, min: 0.3, max: 1.0, step: 0.1 },
  ],
  renderer: {
    render({ fromCanvas, toCanvas, progress, params, width, height, output }) {
      const intensity = (params.intensity as number) ?? 1.0;
      const flash = progress < 0.5 ? progress * 2 : (1 - progress) * 2;

      output.clearRect(0, 0, width, height);

      if (progress < 0.5) {
        if (fromCanvas) {
          output.globalAlpha = 1 - flash;
          output.drawImage(fromCanvas, 0, 0, width, height);
          output.globalAlpha = 1;
        }
      } else {
        if (toCanvas) {
          output.globalAlpha = 1 - flash;
          output.drawImage(toCanvas, 0, 0, width, height);
          output.globalAlpha = 1;
        }
      }

      output.fillStyle = `rgba(0,0,0,${flash * intensity})`;
      output.fillRect(0, 0, width, height);
    },
  },
};

/**
 * Glow Fade (CapCut): Clip A blooms/glows out (bright overexposed look)
 * while Clip B fades in. Approximated with white vignette + fade.
 */
export const glowFadeDefinition: TransitionDefinition = {
  type: "glow_fade",
  name: "Glow Fade",
  group: "Flash",
  keywords: ["glow", "fade", "bloom", "overexpose", "capcut", "light"],
  defaultDuration: 0.6,
  params: [
    { key: "intensity", label: "Glow Radius", type: "number", default: 0.7, min: 0.2, max: 1.0, step: 0.1 },
  ],
  renderer: {
    render({ fromCanvas, toCanvas, progress, params, width, height, output }) {
      const intensity = (params.intensity as number) ?? 0.7;
      const glow = progress * intensity;
      const cx = width / 2;
      const cy = height / 2;
      const r = Math.sqrt(cx * cx + cy * cy) * (1 + glow * 0.5);

      output.clearRect(0, 0, width, height);

      // Clip A fades out with glow bloom
      if (fromCanvas) {
        output.globalAlpha = 1 - progress;
        output.drawImage(fromCanvas, 0, 0, width, height);

        // Radial glow overlay (white center bloom)
        const grad = output.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, `rgba(255,255,255,${glow * 0.8})`);
        grad.addColorStop(0.4, `rgba(255,255,255,${glow * 0.3})`);
        grad.addColorStop(1, `rgba(255,255,255,0)`);
        output.globalAlpha = 1;
        output.fillStyle = grad;
        output.fillRect(0, 0, width, height);
      }

      // Clip B fades in
      if (toCanvas) {
        output.globalAlpha = progress;
        output.drawImage(toCanvas, 0, 0, width, height);
      }

      output.globalAlpha = 1;
    },
  },
};
