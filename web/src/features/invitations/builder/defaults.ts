import type { BuilderDocument } from "./types";

export const BUILDER_PAGE_WIDTH = 720;
export const BUILDER_DEFAULT_HEIGHT = 1000;
export const BUILDER_MIN_HEIGHT = 720;
export const BUILDER_MAX_HEIGHT = 3000;

export function createDefaultBuilderDocument(): BuilderDocument {
  return {
    width: BUILDER_PAGE_WIDTH,
    height: BUILDER_DEFAULT_HEIGHT,
    background: "#ffffff",
    nodes: [
      {
        id: "title-1",
        type: "text",
        x: 72,
        y: 120,
        width: 576,
        rotation: 0,
        opacity: 1,
        text: "Minh & Lan",
        fontSize: 56,
        fontFamily: "Georgia",
        fontStyle: "bold",
        fill: "#6f1d3a",
        align: "center",
      },
      {
        id: "subtitle-1",
        type: "text",
        x: 100,
        y: 220,
        width: 520,
        rotation: 0,
        opacity: 1,
        text: "Kính mời chung vui",
        fontSize: 24,
        fontFamily: "Georgia",
        fontStyle: "normal",
        fill: "#8a4560",
        align: "center",
      },
      {
        id: "shape-1",
        type: "shape",
        x: 100,
        y: 660,
        width: 520,
        height: 160,
        rotation: 0,
        opacity: 1,
        fill: "#fff0f5",
        cornerRadius: 36,
        stroke: "transparent",
        strokeWidth: 0,
      },
      {
        id: "event-1",
        type: "text",
        x: 140,
        y: 720,
        width: 440,
        rotation: 0,
        opacity: 1,
        text: "15.12.2026\nTP.HCM",
        fontSize: 26,
        fontFamily: "Georgia",
        fontStyle: "normal",
        fill: "#6f1d3a",
        align: "center",
      },
    ],
  };
}
