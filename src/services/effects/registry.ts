import { DefinitionRegistry } from "@/core/params/registry";
import type { EffectDefinition } from "@/services/effects/types";

export class EffectsRegistry extends DefinitionRegistry<
	string,
	EffectDefinition
> {
	constructor() {
		super("effect");
	}
}

export const effectsRegistry = new EffectsRegistry();
