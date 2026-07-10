import type { TransitionDefinition } from "./types";

class TransitionRegistry {
  private registry = new Map<string, TransitionDefinition>();

  /**
   * Registers a transition definition.
   * Call this once per transition at app startup.
   *
   * @example
   * transitionsRegistry.register(fadeDefinition);
   */
  register(definition: TransitionDefinition): void {
    this.registry.set(definition.type, definition);
  }

  /**
   * Retrieves a registered transition definition by its type key.
   * Returns undefined if not found (unimplemented transition).
   */
  get(type: string): TransitionDefinition | undefined {
    return this.registry.get(type);
  }

  /**
   * Returns all registered transition definitions.
   */
  all(): TransitionDefinition[] {
    return Array.from(this.registry.values());
  }

  /**
   * Returns all definitions belonging to a given group.
   */
  byGroup(group: string): TransitionDefinition[] {
    return this.all().filter((d) => d.group === group);
  }

  /**
   * Returns whether a type is registered (i.e. has a renderer).
   */
  has(type: string): boolean {
    return this.registry.has(type);
  }

  /**
   * Builds the default params object for a given transition type.
   * Combines { effect, duration, easing } with per-definition param defaults.
   */
  buildDefaultParams(
    type: string,
    duration = 0.5,
    easing: "linear" | "ease-in" | "ease-out" | "ease-in-out" = "ease-in-out"
  ): Record<string, any> {
    const def = this.registry.get(type);
    const customDefaults: Record<string, any> = {};
    if (def) {
      for (const p of def.params) {
        customDefaults[p.key] = p.default;
      }
    }
    return { effect: type, duration, easing, ...customDefaults };
  }
}

export const transitionsRegistry = new TransitionRegistry();

/**
 * Convenience helper — register one or more transition definitions.
 */
export function registerTransitions(...defs: TransitionDefinition[]): void {
  for (const def of defs) {
    transitionsRegistry.register(def);
  }
}

/**
 * Applies the easing function to a raw linear progress value.
 */
export function applyEasing(
  progress: number,
  easing: string = "ease-in-out"
): number {
  const t = Math.max(0, Math.min(1, progress));
  switch (easing) {
    case "linear":
      return t;
    case "ease-in":
      return t * t;
    case "ease-out":
      return t * (2 - t);
    case "ease-in-out":
    default:
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
}
