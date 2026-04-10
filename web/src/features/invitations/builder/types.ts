export type BuilderNodeType = "text" | "image" | "shape";
export type BuilderLeafNodeType = BuilderNodeType;

export type BuilderTextNode = {
  id: string;
  type: "text";
  x: number;
  y: number;
  width: number;
  rotation: number;
  opacity: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: "normal" | "bold";
  fill: string;
  align: "left" | "center" | "right";
};

export type BuilderImageNode = {
  id: string;
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  src: string;
  cornerRadius: number;
};

export type BuilderShapeNode = {
  id: string;
  type: "shape";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  fill: string;
  cornerRadius: number;
};

export type BuilderLeafNode = BuilderTextNode | BuilderImageNode | BuilderShapeNode;

export type BuilderGroupNode = {
  id: string;
  type: "group";
  x: number;
  y: number;
  width: number;
  height: number;
  nodes: BuilderNode[];
};

export type BuilderNode = BuilderLeafNode | BuilderGroupNode;

export type BuilderDocument = {
  width: number;
  height: number;
  background: string;
  nodes: BuilderNode[];
};
