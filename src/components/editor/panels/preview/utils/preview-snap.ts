export const snapPosition = (args: any) => ({ snappedPosition: args.proposedPosition, activeLines: [] });
export const snapRotation = (args: any) => ({ snappedRotation: args.proposedRotation });
export const snapScale = (args: any) => ({ snappedScale: args.proposedScale, activeLines: [] });
export const snapScaleAxes = (args: any) => ({ snappedScale: args.proposedScale });
export const ScaleEdgePreference = {
	Min: "Min",
	Max: "Max",
	Center: "Center",
} as any;
export type ScaleEdgePreference = any;
export type SnapLine = any;
