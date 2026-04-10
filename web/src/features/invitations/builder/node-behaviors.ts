import type Konva from "konva";
import type { BuilderGroupNode, BuilderNode, BuilderTextNode } from "./types";

type BuilderNodeBehavior = {
  enabledAnchors: string[];
  minWidth: number;
  minHeight: number;
  rotateEnabled: boolean;
};

const BUILDER_NODE_BEHAVIORS: Record<BuilderNode["type"], BuilderNodeBehavior> = {
  text: {
    enabledAnchors: ["middle-left", "middle-right", "top-left", "top-right", "bottom-left", "bottom-right", "top-center", "bottom-center"],
    minWidth: 120,
    minHeight: 24,
    rotateEnabled: true,
  },
  image: {
    enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right", "top-center", "bottom-center"],
    minWidth: 80,
    minHeight: 80,
    rotateEnabled: true,
  },
  shape: {
    enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right", "middle-left", "middle-right", "top-center", "bottom-center"],
    minWidth: 40,
    minHeight: 40,
    rotateEnabled: true,
  },
  group: {
    enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right", "middle-left", "middle-right", "top-center", "bottom-center"],
    minWidth: 40,
    minHeight: 40,
    rotateEnabled: false,
  },
};

export function getBuilderNodeBehavior(type: BuilderNode["type"]) {
  return BUILDER_NODE_BEHAVIORS[type];
}

export function isAppendSelectionKey(input: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean }) {
  return Boolean(input.shiftKey || input.metaKey || input.ctrlKey);
}

export function offsetNode(node: BuilderNode, dx: number, dy: number): BuilderNode {
  if (node.type === "group") {
    return {
      ...node,
      x: node.x + dx,
      y: node.y + dy,
    };
  }

  return {
    ...node,
    x: node.x + dx,
    y: node.y + dy,
  };
}

export function scaleNode(node: BuilderNode, scaleX: number, scaleY: number): BuilderNode {
  const behavior = getBuilderNodeBehavior(node.type);

  if (node.type === "group") {
    return {
      ...node,
      width: Math.max(behavior.minWidth, node.width * scaleX),
      height: Math.max(behavior.minHeight, node.height * scaleY),
      nodes: node.nodes.map((child) => scaleNode(child, scaleX, scaleY)),
    };
  }

  if (node.type === "text") {
    return {
      ...node,
      x: node.x * scaleX,
      y: node.y * scaleY,
      width: Math.max(behavior.minWidth, node.width * scaleX),
      fontSize: Math.max(12, node.fontSize * scaleY),
    };
  }

  return {
    ...node,
    x: node.x * scaleX,
    y: node.y * scaleY,
    width: Math.max(behavior.minWidth, node.width * scaleX),
    height: Math.max(behavior.minHeight, node.height * scaleY),
  };
}

export function getTransformPatchFromTarget(node: BuilderNode, target: Konva.Node): Partial<BuilderNode> {
  const behavior = getBuilderNodeBehavior(node.type);
  const scaleX = target.scaleX();
  const scaleY = target.scaleY();

  target.scaleX(1);
  target.scaleY(1);

  if (node.type === "group") {
    return {
      x: target.x(),
      y: target.y(),
      width: Math.max(behavior.minWidth, node.width * scaleX),
      height: Math.max(behavior.minHeight, node.height * scaleY),
      nodes: node.nodes.map((child) => scaleNode(child, scaleX, scaleY)),
    } satisfies Partial<BuilderGroupNode>;
  }

  if (node.type === "text") {
    return {
      x: target.x(),
      y: target.y(),
      width: Math.max(behavior.minWidth, node.width * scaleX),
      fontSize: Math.max(12, node.fontSize * scaleY),
      rotation: target.rotation(),
    } satisfies Partial<BuilderTextNode>;
  }

  return {
    x: target.x(),
    y: target.y(),
    width: Math.max(behavior.minWidth, node.width * scaleX),
    height: Math.max(behavior.minHeight, node.height * scaleY),
    rotation: target.rotation(),
  };
}
