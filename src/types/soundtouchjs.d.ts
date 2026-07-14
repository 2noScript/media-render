declare module 'soundtouchjs' {
	export class PitchShifter {
		constructor(context: any, buffer: any, rate: number);
		tempo: number;
		pitch: number;
		connect(target: any): void;
	}
}
