import { Canvas } from "@napi-rs/canvas";
import type { BlendMode } from "../../../services/rendering";
import type { EffectPass } from "../../../services/effects/types";

export type FrameDescriptor = {
	width: number;
	height: number;
	clear: {
		color: [number, number, number, number];
	};
	items: FrameItemDescriptor[];
};

export type FrameItemDescriptor =
	| {
			type: "layer";
			textureId: string;
			transform: QuadTransformDescriptor;
			opacity: number;
			blendMode: BlendMode;
			effectPassGroups: EffectPass[][];
			mask: LayerMaskDescriptor | null;
	  }
	| {
			type: "sceneEffect";
			effectPassGroups: EffectPass[][];
	  };

export type QuadTransformDescriptor = {
	centerX: number;
	centerY: number;
	width: number;
	height: number;
	rotationDegrees: number;
	flipX: boolean;
	flipY: boolean;
};

export type LayerMaskDescriptor = {
	textureId: string;
	feather: number;
	inverted: boolean;
};

export type TextureUploadDescriptor = {
	id: string;
	source: Canvas; // On server, this is a Skia Canvas
	width: number;
	height: number;
};
