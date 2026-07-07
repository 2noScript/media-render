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

export type FrameItemDescriptor =
  | {
      type: "layer";
      textureId: string;
      transform: QuadTransformDescriptor;
      opacity: number;
      blendMode: string;
      mask: LayerMaskDescriptor | null;
    }
  | {
      type: "sceneEffect";
    };

export type FrameDescriptor = {
  width: number;
  height: number;
  clear: {
    color: [number, number, number, number];
  };
  items: FrameItemDescriptor[];
};

export type TextureCanvasDrawFn = (ctx: any) => void;

export type ExternalTextureDescriptor = {
  kind: "external";
  id: string;
  source: any;
  width: number;
  height: number;
};

export type RenderedTextureDescriptor = {
  kind: "rendered";
  id: string;
  contentHash: string;
  width: number;
  height: number;
  draw: TextureCanvasDrawFn;
};

export type TextureUploadDescriptor =
  | ExternalTextureDescriptor
  | RenderedTextureDescriptor;
