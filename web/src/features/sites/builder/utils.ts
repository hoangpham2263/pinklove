import {
  BUILDER_DEFAULT_HEIGHT,
  BUILDER_MAX_HEIGHT,
  BUILDER_MIN_HEIGHT,
  BUILDER_PAGE_WIDTH,
  createDefaultBuilderDocument,
} from "./defaults";
import type { BuilderDocument, BuilderImageNode, BuilderNode, BuilderShapeNode, BuilderTextNode } from "./types";

function toFiniteNumber(value: unknown, fallback: number) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function toNonNegativeNumber(value: unknown, fallback: number) {
  return Math.max(0, toFiniteNumber(value, fallback));
}

function toOpacity(value: unknown, fallback: number) {
  const next = toFiniteNumber(value, fallback);
  return Math.min(1, Math.max(0, next));
}

function toStringValue(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function createNodeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeBuilderNode(node: unknown): BuilderNode | null {
  if (typeof node !== "object" || node === null) {
    return null;
  }

  const record = node as Record<string, unknown>;
  const id = toStringValue(record.id, createNodeId("node"));
  const type = record.type;

  if (type === "text") {
    return {
      id,
      type,
      x: toFiniteNumber(record.x, 180),
      y: toFiniteNumber(record.y, 180),
      width: toNonNegativeNumber(record.width, 840),
      rotation: toFiniteNumber(record.rotation, 0),
      opacity: toOpacity(record.opacity, 1),
      text: toStringValue(record.text, "Văn bản mới"),
      fontSize: toNonNegativeNumber(record.fontSize, 42),
      fontFamily: toStringValue(record.fontFamily, "Georgia"),
      fontStyle: record.fontStyle === "bold" ? "bold" : "normal",
      fill: toStringValue(record.fill, "#6f1d3a"),
      align: record.align === "left" || record.align === "right" ? record.align : "center",
    };
  }

  if (type === "image") {
    return {
      id,
      type,
      x: toFiniteNumber(record.x, 240),
      y: toFiniteNumber(record.y, 420),
      width: Math.max(80, toNonNegativeNumber(record.width, 720)),
      height: Math.max(80, toNonNegativeNumber(record.height, 420)),
      rotation: toFiniteNumber(record.rotation, 0),
      opacity: toOpacity(record.opacity, 1),
      src: toStringValue(record.src, ""),
      cornerRadius: toNonNegativeNumber(record.cornerRadius, 32),
    };
  }

  if (type === "shape") {
    return {
      id,
      type,
      x: toFiniteNumber(record.x, 220),
      y: toFiniteNumber(record.y, 220),
      width: Math.max(40, toNonNegativeNumber(record.width, 420)),
      height: Math.max(40, toNonNegativeNumber(record.height, 180)),
      rotation: toFiniteNumber(record.rotation, 0),
      opacity: toOpacity(record.opacity, 1),
      fill: toStringValue(record.fill, "#ffe4ec"),
      cornerRadius: toNonNegativeNumber(record.cornerRadius, 24),
    };
  }

  return null;
}

export function isBuilderDocument(value: unknown): value is BuilderDocument {
  return typeof value === "object" && value !== null && Array.isArray((value as BuilderDocument).nodes);
}

export function ensureBuilderDocument(value: unknown): BuilderDocument {
  if (isBuilderDocument(value)) {
    const record = value as Record<string, unknown>;
    return {
      width: BUILDER_PAGE_WIDTH,
      height: Math.min(
        BUILDER_MAX_HEIGHT,
        Math.max(BUILDER_MIN_HEIGHT, toNonNegativeNumber(record.height, BUILDER_DEFAULT_HEIGHT))
      ),
      background: toStringValue(record.background, "#fff8fb"),
      nodes: (record.nodes as unknown[])
        .map(normalizeBuilderNode)
        .filter((node): node is BuilderNode => Boolean(node)),
    };
  }

  return createDefaultBuilderDocument();
}

export function createTextNode(partial?: Partial<BuilderTextNode>): BuilderTextNode {
  return {
    id: createNodeId("text"),
    type: "text",
    x: 180,
    y: 180,
    width: 840,
    rotation: 0,
    opacity: 1,
    text: "Văn bản mới",
    fontSize: 42,
    fontFamily: "Georgia",
    fontStyle: "normal",
    fill: "#6f1d3a",
    align: "center",
    ...partial,
  };
}

export function createShapeNode(partial?: Partial<BuilderShapeNode>): BuilderShapeNode {
  return {
    id: createNodeId("shape"),
    type: "shape",
    x: 220,
    y: 220,
    width: 420,
    height: 180,
    rotation: 0,
    opacity: 1,
    fill: "#ffe4ec",
    cornerRadius: 24,
    ...partial,
  };
}

export function createImageNode(partial?: Partial<BuilderImageNode>): BuilderImageNode {
  return {
    id: createNodeId("image"),
    type: "image",
    x: 240,
    y: 420,
    width: 720,
    height: 420,
    rotation: 0,
    opacity: 1,
    src: "",
    cornerRadius: 32,
    ...partial,
  };
}

export function updateNode(nodes: BuilderNode[], nodeId: string, patch: Partial<BuilderNode>) {
  return nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } as BuilderNode : node));
}
