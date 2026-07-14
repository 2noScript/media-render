import type { CanvasRenderer } from "../canvas-renderer";
import { createOffscreenCanvas } from "../canvas-utils";
import { DEFAULT_GRAPHIC_SOURCE_SIZE } from "@/services/graphics";
import { masksRegistry } from "@/services/masks";
import type {
	FrameItemDescriptor,
	LayerMaskDescriptor,
	QuadTransformDescriptor,
	TextureUploadDescriptor,
} from "./types";
import type { ResolvedVisualSourceNodeState } from "../nodes/visual-node";
import type { ResolvedGraphicNodeState } from "../nodes/graphic-node";

export function computeVisualTransform({
	renderer,
	resolved,
	sourceWidth,
	sourceHeight,
}: {
	renderer: CanvasRenderer;
	resolved: ResolvedVisualSourceNodeState | ResolvedGraphicNodeState;
	sourceWidth: number;
	sourceHeight: number;
}): QuadTransformDescriptor {
	const containScale = Math.min(
		renderer.width / sourceWidth,
		renderer.height / sourceHeight,
	);
	const scaledWidth = sourceWidth * containScale * resolved.transform.scaleX;
	const scaledHeight = sourceHeight * containScale * resolved.transform.scaleY;
	const absWidth = Math.abs(scaledWidth);
	const absHeight = Math.abs(scaledHeight);

	return {
		centerX: renderer.width / 2 + resolved.transform.position.x,
		centerY: renderer.height / 2 + resolved.transform.position.y,
		width: absWidth,
		height: absHeight,
		rotationDegrees: resolved.transform.rotate,
		flipX: scaledWidth < 0,
		flipY: scaledHeight < 0,
	};
}

export function fullCanvasTransform(
	renderer: CanvasRenderer,
): QuadTransformDescriptor {
	return {
		centerX: renderer.width / 2,
		centerY: renderer.height / 2,
		width: renderer.width,
		height: renderer.height,
		rotationDegrees: 0,
		flipX: false,
		flipY: false,
	};
}

export function drawTransformedCanvas({
	ctx,
	source,
	transform,
}: {
	ctx: any;
	source: any;
	transform: QuadTransformDescriptor;
}) {
	const x = transform.centerX - transform.width / 2;
	const y = transform.centerY - transform.height / 2;
	const flipX = transform.flipX ? -1 : 1;
	const flipY = transform.flipY ? -1 : 1;
	const requiresTransform =
		transform.rotationDegrees !== 0 || flipX !== 1 || flipY !== 1;

	ctx.save();
	if (requiresTransform) {
		ctx.translate(transform.centerX, transform.centerY);
		ctx.rotate((transform.rotationDegrees * Math.PI) / 180);
		ctx.scale(flipX, flipY);
		ctx.translate(-transform.centerX, -transform.centerY);
	}
	ctx.drawImage(source, x, y, transform.width, transform.height);
	ctx.restore();
}

export function buildMaskArtifacts({
	node,
	renderer,
	path,
	transform,
	textures,
}: {
	node: any;
	renderer: CanvasRenderer;
	path: string;
	transform: QuadTransformDescriptor;
	textures: Map<string, TextureUploadDescriptor>;
}): {
	mask: LayerMaskDescriptor | null;
	strokeLayer: FrameItemDescriptor | null;
} {
	const mask = node.params.masks?.[0];
	if (!mask) {
		return { mask: null, strokeLayer: null };
	}

	const definition = masksRegistry.get(mask.type);

	if (definition.isActive?.(mask.params) === false) {
		return { mask: null, strokeLayer: null };
	}

	const elementMaskCanvas = createOffscreenCanvas({
		width: Math.round(transform.width),
		height: Math.round(transform.height),
	});
	const elementMaskCtx = elementMaskCanvas.getContext("2d") as any;
	if (!elementMaskCtx) {
		return { mask: null, strokeLayer: null };
	}
	elementMaskCtx.clearRect(0, 0, transform.width, transform.height);

	let strokePath: Path2D | null = null;
	let feather = mask.params.feather;
	const canRenderMaskDirectly = Boolean(definition.renderer.renderMask);
	const shouldRenderMaskDirectly =
		canRenderMaskDirectly &&
		(!definition.renderer.buildPath ||
			(mask.params.feather > 0 &&
				definition.renderer.renderMaskHandlesFeather));
	if (shouldRenderMaskDirectly && definition.renderer.renderMask) {
		definition.renderer.renderMask({
			resolvedParams: mask.params,
			ctx: elementMaskCtx,
			width: Math.round(transform.width),
			height: Math.round(transform.height),
			feather: mask.params.feather,
		});
		if (definition.renderer.renderMaskHandlesFeather) {
			feather = 0;
		}
		strokePath =
			definition.renderer.buildStrokePath?.({
				resolvedParams: mask.params,
				width: transform.width,
				height: transform.height,
			}) ?? null;
	} else {
		if (!definition.renderer.buildPath) {
			return { mask: null, strokeLayer: null };
		}
		const path2d = definition.renderer.buildPath({
			resolvedParams: mask.params,
			width: transform.width,
			height: transform.height,
		});
		elementMaskCtx.fillStyle = "white";
		elementMaskCtx.fill(path2d);
		strokePath =
			definition.renderer.buildStrokePath?.({
				resolvedParams: mask.params,
				width: transform.width,
				height: transform.height,
			}) ?? path2d;
	}

	const fullMaskCanvas = createOffscreenCanvas({
		width: renderer.width,
		height: renderer.height,
	});
	const fullMaskCtx = fullMaskCanvas.getContext("2d") as any;
	if (!fullMaskCtx) {
		return { mask: null, strokeLayer: null };
	}
	drawTransformedCanvas({
		ctx: fullMaskCtx,
		source: elementMaskCanvas,
		transform,
	});

	const maskTextureId = `${path}:mask`;
	textures.set(maskTextureId, {
		id: maskTextureId,
		source: fullMaskCanvas,
		width: renderer.width,
		height: renderer.height,
	});

	let strokeLayer: FrameItemDescriptor | null = null;
	if (
		mask.params.strokeWidth > 0 &&
		(strokePath || definition.renderer.renderStroke)
	) {
		const strokeCanvas = createOffscreenCanvas({
			width: Math.round(transform.width),
			height: Math.round(transform.height),
		});
		const strokeCtx = strokeCanvas.getContext("2d") as any;
		if (strokeCtx) {
			if (definition.renderer.renderStroke) {
				definition.renderer.renderStroke({
					resolvedParams: mask.params,
					ctx: strokeCtx,
					width: transform.width,
					height: transform.height,
				});
			} else if (strokePath) {
				strokeCtx.strokeStyle = mask.params.strokeColor;
				strokeCtx.lineWidth = mask.params.strokeWidth;
				strokeCtx.stroke(strokePath);
			}

			const fullStrokeCanvas = createOffscreenCanvas({
				width: renderer.width,
				height: renderer.height,
			});
			const fullStrokeCtx = fullStrokeCanvas.getContext("2d") as any;
			if (fullStrokeCtx) {
				drawTransformedCanvas({
					ctx: fullStrokeCtx,
					source: strokeCanvas,
					transform,
				});
				const strokeTextureId = `${path}:mask-stroke`;
				textures.set(strokeTextureId, {
					id: strokeTextureId,
					source: fullStrokeCanvas,
					width: renderer.width,
					height: renderer.height,
				});
				strokeLayer = {
					type: "layer",
					textureId: strokeTextureId,
					transform: fullCanvasTransform(renderer),
					opacity: 1,
					blendMode: "normal",
					effectPassGroups: [],
					mask: null,
				};
			}
		}
	}

	return {
		mask: {
			textureId: maskTextureId,
			feather,
			inverted: mask.params.inverted,
		},
		strokeLayer,
	};
}
