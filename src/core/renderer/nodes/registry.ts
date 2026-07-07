import { BaseNode } from "./base-node";

export type NodeFactory = (el: any, renderer: any) => BaseNode;

class NodeRegistry {
  private registry = new Map<string, NodeFactory>();

  /**
   * Registers a factory function for a specific manifest element type.
   */
  register(type: string, factory: NodeFactory) {
    this.registry.set(type, factory);
  }

  /**
   * Instantiates a Node from the registry.
   */
  create(type: string, el: any, renderer: any): BaseNode | null {
    const factory = this.registry.get(type);
    return factory ? factory(el, renderer) : null;
  }
}

export const nodeRegistry = new NodeRegistry();
