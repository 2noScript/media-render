export function snapMaskInteraction(args: any): any {
	return {
		proposedParams: args.proposedParams,
		snappedPosition: args.proposedParams,
		snappedScale: args.proposedParams,
		activeLines: [],
	};
}

export const ScaleEdgePreference = {
	Min: "Min",
	Max: "Max",
	Center: "Center",
} as any;
