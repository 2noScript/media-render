import { EditorManifest } from "./editor-manifest";

export type ExportFormat = "mp4" | "webm";
export type ExportQuality = "low" | "medium" | "high" | "very_high";
export type ExportParams = EditorManifest["settings"];
