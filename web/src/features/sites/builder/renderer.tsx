import type { ReactNode } from "react";
import type { WeddingSite } from "../types";
import type { BuilderNode } from "./types";
import { ensureBuilderDocument } from "./utils";

function renderNode(node: BuilderNode, offsetX = 0, offsetY = 0): ReactNode {
  const x = offsetX + node.x;
  const y = offsetY + node.y;

  if (node.type === "group") {
    return node.nodes.map((child) => renderNode(child, x, y));
  }

  if (node.type === "text") {
    return (
      <text
        key={node.id}
        x={x}
        y={y}
        fill={node.fill}
        fontSize={node.fontSize}
        fontFamily={node.fontFamily}
        fontWeight={node.fontStyle === "bold" ? 700 : 400}
        textAnchor={node.align === "left" ? "start" : node.align === "right" ? "end" : "middle"}
        opacity={node.opacity}
        transform={`rotate(${node.rotation} ${x + node.width / 2} ${y})`}
      >
        {node.text.split("\n").map((line, index) => (
          <tspan
            key={`${node.id}-${index}`}
            x={node.align === "left" ? x : node.align === "right" ? x + node.width : x + node.width / 2}
            dy={index === 0 ? 0 : node.fontSize * 1.35}
          >
            {line}
          </tspan>
        ))}
      </text>
    );
  }

  if (node.type === "shape") {
    return (
      <rect
        key={node.id}
        x={x}
        y={y}
        width={node.width}
        height={node.height}
        rx={node.cornerRadius}
        ry={node.cornerRadius}
        fill={node.fill}
        opacity={node.opacity}
        transform={`rotate(${node.rotation} ${x + node.width / 2} ${y + node.height / 2})`}
      />
    );
  }

  if (!node.src) {
    return null;
  }

  return (
    <image
      key={node.id}
      href={node.src}
      x={x}
      y={y}
      width={node.width}
      height={node.height}
      opacity={node.opacity}
      preserveAspectRatio="xMidYMid slice"
      transform={`rotate(${node.rotation} ${x + node.width / 2} ${y + node.height / 2})`}
    />
  );
}

export function BuilderWeddingSiteTemplate({ site }: { site: WeddingSite }) {
  const data = site.customData;
  const document = ensureBuilderDocument(data.builderDocument ?? data.builderCanvas);

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-10">
      <div
        className="mx-auto w-full max-w-5xl overflow-hidden rounded-[32px] border bg-white"
        style={{ aspectRatio: `${document.width} / ${document.height}` }}
      >
        <svg
          viewBox={`0 0 ${document.width} ${document.height}`}
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="0" y="0" width={document.width} height={document.height} fill={document.background} />
          {document.nodes.map((node) => renderNode(node))}
        </svg>
      </div>
    </div>
  );
}
