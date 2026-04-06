import { createImageNode, createTextNode } from "./utils";
import type { BuilderNode } from "./types";

type BuilderAssetPreset = {
  id: string;
  label: string;
  preview: string;
  createNode: () => BuilderNode;
};

function svgDataUri(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const floralCornerSvg = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
  <g fill="none" stroke="#d56b8b" stroke-width="8" stroke-linecap="round">
    <path d="M85 410c35-20 62-52 78-92"/>
    <path d="M90 390c55-5 101-31 132-74"/>
    <path d="M115 430c12-48 36-86 74-122"/>
  </g>
  <g fill="#f4a8bf">
    <circle cx="130" cy="362" r="24"/>
    <circle cx="176" cy="312" r="18"/>
    <circle cx="232" cy="278" r="15"/>
    <circle cx="154" cy="406" r="20"/>
  </g>
</svg>
`);

const wreathSvg = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
  <circle cx="300" cy="300" r="180" fill="none" stroke="#d88ea6" stroke-width="10" stroke-dasharray="4 18"/>
  <g fill="#f4b4c7">
    <circle cx="300" cy="118" r="26"/>
    <circle cx="458" cy="200" r="22"/>
    <circle cx="476" cy="376" r="18"/>
    <circle cx="308" cy="486" r="24"/>
    <circle cx="150" cy="388" r="20"/>
    <circle cx="138" cy="214" r="18"/>
  </g>
</svg>
`);

const photoPlaceholderSvg = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
  <rect width="1200" height="800" rx="48" fill="#fde8ef"/>
  <rect x="80" y="80" width="1040" height="640" rx="36" fill="#fff7fa" stroke="#f2bfd0" stroke-width="12"/>
  <path d="M170 610l210-220 140 150 170-190 250 260" fill="none" stroke="#d88ea6" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="405" cy="255" r="62" fill="#f4b4c7"/>
</svg>
`);

export const BUILDER_ASSET_PRESETS: BuilderAssetPreset[] = [
  {
    id: "text-title",
    label: "Text tiêu đề",
    preview: "T",
    createNode: () =>
      createTextNode({
        text: "Tiêu đề thiệp",
        fontSize: 68,
        fontStyle: "bold",
        y: 160,
      }),
  },
  {
    id: "svg-corner",
    label: "SVG hoa góc",
    preview: "SVG",
    createNode: () =>
      createImageNode({
        src: floralCornerSvg,
        width: 360,
        height: 360,
        x: 60,
        y: 980,
      }),
  },
  {
    id: "svg-wreath",
    label: "SVG vòng hoa",
    preview: "SVG",
    createNode: () =>
      createImageNode({
        src: wreathSvg,
        width: 420,
        height: 420,
        x: 390,
        y: 500,
      }),
  },
  {
    id: "image-frame",
    label: "Image preset",
    preview: "IMG",
    createNode: () =>
      createImageNode({
        src: photoPlaceholderSvg,
        width: 760,
        height: 500,
        x: 220,
        y: 420,
      }),
  },
];
