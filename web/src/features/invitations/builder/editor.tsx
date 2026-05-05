"use client";

import type { CSSProperties, Dispatch, RefObject, SetStateAction } from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Konva from "konva";
import { Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text, Transformer } from "react-konva";
import { Copy, Grip, ImageIcon, Layers3, MousePointer2, Square, Type, ZoomIn, ZoomOut } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaSelector } from "@/features/media/components/media-selector";
import {
  BUILDER_DEFAULT_HEIGHT,
  BUILDER_MAX_HEIGHT,
  BUILDER_MIN_HEIGHT,
  BUILDER_PAGE_WIDTH,
} from "@/features/invitations/builder/defaults";
import { BUILDER_ASSET_PRESETS } from "@/features/invitations/builder/presets";
import {
  getBuilderNodeBehavior,
  getTransformPatchFromTarget,
  isAppendSelectionKey,
  offsetNode,
} from "@/features/invitations/builder/node-behaviors";
import {
  cloneNode,
  createGroupNode,
  createImageNode,
  createShapeNode,
  createTextNode,
  ensureBuilderDocument,
  getNodeBounds,
  updateNode,
} from "@/features/invitations/builder/utils";
import type { BuilderDocument, BuilderGroupNode, BuilderImageNode, BuilderNode, BuilderTextNode } from "@/features/invitations/builder/types";
import { cn } from "@/lib/utils";

type BuilderEditorProps = {
  initialValue: unknown;
};

type CanvasStageProps = {
  document: BuilderDocument;
  stageScale: number;
  stageWidth: number;
  stageHeight: number;
  stageWrapperRef: RefObject<HTMLDivElement | null>;
  textEditorRef: RefObject<HTMLTextAreaElement | null>;
  resizeSessionRef: RefObject<{ startY: number; startHeight: number } | null>;
  selectedIds: string[];
  editingTextNode: BuilderTextNode | null;
  verticalGridLines: Array<{ key: string; points: number[] }>;
  horizontalGridLines: Array<{ key: string; points: number[] }>;
  snapPosition: (x: number, y: number) => { x: number; y: number };
  addNode: (node: BuilderNode) => void;
  setSelectedIds: Dispatch<SetStateAction<string[]>>;
  setEditingTextId: Dispatch<SetStateAction<string | null>>;
  setSingleSelection: (nodeId: string | null) => void;
  handleNodeSelect: (nodeId: string, append: boolean) => void;
  patchNodeById: (nodeId: string, patch: Partial<BuilderNode>) => void;
};

type SelectedNodeInspectorProps = {
  selectedIds: string[];
  selectedNode: BuilderNode | null;
  editableNode: BuilderNode | null;
  editableBounds: ReturnType<typeof getNodeBounds> | null;
  editableTextNode: BuilderTextNode | null;
  editableShapeNode: (BuilderNode & { type: "shape" }) | null;
  editableImageNode: BuilderImageNode | null;
  canEditNodeFields: boolean;
  canGroup: boolean;
  groupSelectedNodes: () => void;
  ungroupSelectedNode: () => void;
  duplicateNodeById: (nodeId: string) => void;
  moveNodeById: (nodeId: string, direction: "forward" | "backward") => void;
  removeSelectedNodes: () => void;
  patchSelectedNode: (patch: Partial<BuilderNode>) => void;
};

type CanvasControlsProps = {
  notebookGridSize: number;
  stageScale: number;
  document: BuilderDocument;
  setGridSize: Dispatch<SetStateAction<number>>;
  setZoom: Dispatch<SetStateAction<number>>;
  setZoomPercent: (value: number) => void;
  setDocument: Dispatch<SetStateAction<BuilderDocument>>;
};

function useImageElement(src: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      return;
    }

    let cancelled = false;
    const nextImage = new window.Image();
    nextImage.crossOrigin = "anonymous";
    nextImage.src = src;
    nextImage.onload = () => {
      if (!cancelled) {
        setImage(nextImage);
      }
    };
    nextImage.onerror = () => {
      if (!cancelled) {
        setImage(null);
      }
    };

    return () => {
      cancelled = true;
    };
  }, [src]);

  return src ? image : null;
}

function BuilderImageNodeInGroup({ node }: { node: BuilderImageNode }) {
  const image = useImageElement(node.src);

  return (
    <KonvaImage
      image={image ?? undefined}
      x={node.x}
      y={node.y}
      width={node.width}
      height={node.height}
      rotation={node.rotation}
      opacity={node.opacity}
      cornerRadius={node.cornerRadius}
      listening={false}
    />
  );
}

function BuilderImageNodeView({
  node,
  selected,
  onSelect,
  onChange,
}: {
  node: BuilderImageNode;
  selected: boolean;
  onSelect: (append: boolean) => void;
  onChange: (patch: Partial<BuilderNode>) => void;
}) {
  const image = useImageElement(node.src);
  const shapeRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const behavior = getBuilderNodeBehavior(node.type);

  useEffect(() => {
    if (selected && shapeRef.current && transformerRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selected]);

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={image ?? undefined}
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        rotation={node.rotation}
        opacity={node.opacity}
        cornerRadius={node.cornerRadius}
        draggable
        onClick={(event) => onSelect(isAppendSelectionKey(event.evt))}
        onTap={() => onSelect(false)}
        onDragStart={() => onSelect(false)}
        onDragEnd={(event) => onChange({ x: event.target.x(), y: event.target.y() })}
        onTransformEnd={() => {
          const target = shapeRef.current;
          if (!target) {
            return;
          }

          onChange(getTransformPatchFromTarget(node, target));
        }}
      />
      {selected ? (
        <Transformer
          ref={transformerRef}
          rotateEnabled={behavior.rotateEnabled}
          enabledAnchors={behavior.enabledAnchors}
        />
      ) : null}
    </>
  );
}

function BuilderTextNodeView({
  node,
  selected,
  onSelect,
  onChange,
  onEdit,
}: {
  node: BuilderTextNode;
  selected: boolean;
  onSelect: (append: boolean) => void;
  onChange: (patch: Partial<BuilderNode>) => void;
  onEdit: () => void;
}) {
  const textRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const behavior = getBuilderNodeBehavior(node.type);

  useEffect(() => {
    if (selected && textRef.current && transformerRef.current) {
      transformerRef.current.nodes([textRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selected]);

  return (
    <>
      <Text
        ref={textRef}
        x={node.x}
        y={node.y}
        width={node.width}
        text={node.text}
        fontSize={node.fontSize}
        fontFamily={node.fontFamily}
        fontStyle={node.fontStyle}
        fill={node.fill}
        align={node.align}
        opacity={node.opacity}
        rotation={node.rotation}
        draggable
        onClick={(event) => onSelect(isAppendSelectionKey(event.evt))}
        onTap={() => onSelect(false)}
        onDblClick={onEdit}
        onDragStart={() => onSelect(false)}
        onDragEnd={(event) => onChange({ x: event.target.x(), y: event.target.y() })}
        onTransformEnd={() => {
          const target = textRef.current;
          if (!target) {
            return;
          }

          onChange(getTransformPatchFromTarget(node, target));
        }}
      />
      {selected ? (
        <Transformer
          ref={transformerRef}
          rotateEnabled={behavior.rotateEnabled}
          enabledAnchors={behavior.enabledAnchors}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < behavior.minWidth || newBox.height < behavior.minHeight) {
              return oldBox;
            }

            return newBox;
          }}
        />
      ) : null}
    </>
  );
}

function BuilderShapeNodeView({
  node,
  selected,
  onSelect,
  onChange,
}: {
  node: BuilderNode & { type: "shape" };
  selected: boolean;
  onSelect: (append: boolean) => void;
  onChange: (patch: Partial<BuilderNode>) => void;
}) {
  const shapeRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const behavior = getBuilderNodeBehavior(node.type);

  useEffect(() => {
    if (selected && shapeRef.current && transformerRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selected]);

  return (
    <>
      <Rect
        ref={shapeRef}
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        fill={node.fill}
        cornerRadius={node.cornerRadius}
        opacity={node.opacity}
        rotation={node.rotation}
        draggable
        onClick={(event) => onSelect(isAppendSelectionKey(event.evt))}
        onTap={() => onSelect(false)}
        onDragStart={() => onSelect(false)}
        onDragEnd={(event) => onChange({ x: event.target.x(), y: event.target.y() })}
        onTransformEnd={() => {
          const target = shapeRef.current;
          if (!target) {
            return;
          }

          onChange(getTransformPatchFromTarget(node, target));
        }}
      />
      {selected ? (
        <Transformer
          ref={transformerRef}
          rotateEnabled={behavior.rotateEnabled}
          enabledAnchors={behavior.enabledAnchors}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < behavior.minWidth || newBox.height < behavior.minHeight) {
              return oldBox;
            }

            return newBox;
          }}
        />
      ) : null}
    </>
  );
}

function BuilderGroupNodeView({
  node,
  selected,
  onSelect,
  onChange,
}: {
  node: BuilderGroupNode;
  selected: boolean;
  onSelect: (append: boolean) => void;
  onChange: (patch: Partial<BuilderGroupNode>) => void;
}) {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const behavior = getBuilderNodeBehavior(node.type);

  useEffect(() => {
    if (selected && groupRef.current && transformerRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selected]);

  return (
    <>
      <Group
        ref={groupRef}
        x={node.x}
        y={node.y}
        draggable
        onClick={(event) => onSelect(isAppendSelectionKey(event.evt))}
        onTap={() => onSelect(false)}
        onDragStart={() => onSelect(false)}
        onDragEnd={(event) => onChange({ x: event.target.x(), y: event.target.y() })}
        onTransformEnd={() => {
          const target = groupRef.current;
          if (!target) {
            return;
          }

          onChange(getTransformPatchFromTarget(node, target) as Partial<BuilderGroupNode>);
        }}
      >
        <Rect
          x={0}
          y={0}
          width={node.width}
          height={node.height}
          fill="transparent"
          stroke={selected ? "#2563eb" : "transparent"}
          dash={selected ? [10, 6] : undefined}
          listening={false}
        />
        {node.nodes.map((child) => {
          if (child.type === "text") {
            return (
              <Text
                key={child.id}
                x={child.x}
                y={child.y}
                width={child.width}
                text={child.text}
                fontSize={child.fontSize}
                fontFamily={child.fontFamily}
                fontStyle={child.fontStyle}
                fill={child.fill}
                align={child.align}
                opacity={child.opacity}
                rotation={child.rotation}
                listening={false}
              />
            );
          }

          if (child.type === "shape") {
            return (
              <Rect
                key={child.id}
                x={child.x}
                y={child.y}
                width={child.width}
                height={child.height}
                fill={child.fill}
                cornerRadius={child.cornerRadius}
                opacity={child.opacity}
                rotation={child.rotation}
                listening={false}
              />
            );
          }

          if (child.type === "group") {
            return null;
          }

          return <BuilderImageNodeInGroup key={child.id} node={child} />;
        })}
      </Group>
      {selected ? (
        <Transformer
          ref={transformerRef}
          rotateEnabled={behavior.rotateEnabled}
          enabledAnchors={behavior.enabledAnchors}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < behavior.minWidth || newBox.height < behavior.minHeight) {
              return oldBox;
            }

            return newBox;
          }}
        />
      ) : null}
    </>
  );
}

const BuilderHeader = memo(function BuilderHeader() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,244,246,0.9))]">
      <div className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1.4fr)_280px] lg:px-6">
        <div className="space-y-3">
          <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            Trình builder
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight">Thiết kế thiệp trên canvas.</h3>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Hãy tạo mẫu thiệp yêu thích của bạn với trình builder của Pink Love.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Dialog>
            <DialogTrigger className={cn(buttonVariants({ variant: "outline" }), "border-white/70 bg-white/85 backdrop-blur")}>
              Phím tắt
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Phím tắt</DialogTitle>
                <DialogDescription>Các thao tác nhanh trong builder để dàn trang thuận tiện hơn.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="rounded-xl border bg-muted/20 p-3">
                  <p className="font-medium">Delete</p>
                  <p className="mt-1 text-muted-foreground">Xóa item đang chọn.</p>
                </div>
                <div className="rounded-xl border bg-muted/20 p-3">
                  <p className="font-medium">Ctrl/Cmd + D</p>
                  <p className="mt-1 text-muted-foreground">Nhân bản item đang chọn.</p>
                </div>
                <div className="rounded-xl border bg-muted/20 p-3">
                  <p className="font-medium">Ctrl/Cmd + G</p>
                  <p className="mt-1 text-muted-foreground">Nhóm nhiều item đang chọn.</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
});

const BuilderSidebarPanel = memo(function BuilderSidebarPanel({
  onAddText,
  onAddShape,
  onAddImage,
  onAddPreset,
}: {
  onAddText: () => void;
  onAddShape: () => void;
  onAddImage: () => void;
  onAddPreset: (node: BuilderNode) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">Nội dung canvas</h3>
            <p className="mt-1 text-sm text-muted-foreground">Thêm block mới hoặc chèn preset có sẵn vào thiết kế.</p>
          </div>
          <div className="rounded-xl bg-primary/8 p-2 text-primary">
            <MousePointer2 className="size-4" />
          </div>
        </div>
        <div className="grid gap-2">
          <Button type="button" variant="outline" className="justify-start" onClick={onAddText}>
            <Type className="size-4" />
            Thêm block chữ
          </Button>
          <Button type="button" variant="outline" className="justify-start" onClick={onAddShape}>
            <Square className="size-4" />
            Thêm shape
          </Button>
          <Button type="button" variant="outline" className="justify-start" onClick={onAddImage}>
            <ImageIcon className="size-4" />
            Thêm khung ảnh
          </Button>
        </div>
        <div className="mt-5 border-t pt-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h4 className="font-medium">Preset có sẵn</h4>
              <p className="mt-1 text-sm text-muted-foreground">Kéo preset vào canvas hoặc double click để chèn nhanh.</p>
            </div>
            <div className="rounded-xl bg-muted p-2 text-foreground">
              <Grip className="size-4" />
            </div>
          </div>
          <div className="grid gap-3">
            {BUILDER_ASSET_PRESETS.map((preset) => (
              <div
                key={preset.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/pinklove-builder-asset", preset.id);
                  event.dataTransfer.effectAllowed = "copy";
                }}
                onDoubleClick={() => onAddPreset(preset.createNode())}
                className="flex cursor-grab items-center justify-between rounded-2xl border border-border/70 bg-background px-3 py-3 transition hover:border-primary/35 hover:bg-primary/5"
              >
                <div className="min-w-0">
                  <p className="font-medium">{preset.label}</p>
                  <p className="truncate text-xs uppercase tracking-[3px] text-muted-foreground">
                    {preset.preview}
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={() => onAddPreset(preset.createNode())}>
                  Thêm
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

const SelectedNodeInspector = memo(function SelectedNodeInspector({
  selectedIds,
  selectedNode,
  editableNode,
  editableBounds,
  editableTextNode,
  editableShapeNode,
  editableImageNode,
  canEditNodeFields,
  canGroup,
  groupSelectedNodes,
  ungroupSelectedNode,
  duplicateNodeById,
  moveNodeById,
  removeSelectedNodes,
  patchSelectedNode,
}: SelectedNodeInspectorProps) {
  return (
    <div className="mb-4 rounded-2xl border bg-muted/20 p-4">
      <div className="mb-4 flex min-h-6 items-center text-sm text-muted-foreground">
        {selectedIds.length > 1
          ? `Đang chọn ${selectedIds.length} item. ${canGroup ? "Có thể group các item này." : "Group lồng nhau hiện chưa hỗ trợ."}`
          : editableNode
            ? `Đang chỉnh ${editableNode.type}.`
            : "Chưa chọn item nào."}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {canGroup ? (
          <Button type="button" variant="outline" size="sm" onClick={groupSelectedNodes}>
            <Layers3 className="size-4" />
            Nhóm
          </Button>
        ) : null}
        {selectedNode?.type === "group" ? (
          <Button type="button" variant="outline" size="sm" onClick={ungroupSelectedNode}>
            <Layers3 className="size-4" />
            Bỏ nhóm
          </Button>
        ) : null}
        {selectedNode ? (
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => duplicateNodeById(selectedNode.id)}>
              <Copy className="size-4" />
              Nhân bản
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => moveNodeById(selectedNode.id, "backward")}>
              Lùi xuống
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => moveNodeById(selectedNode.id, "forward")}>
              Đưa lên
            </Button>
          </>
        ) : null}
        {selectedIds.length > 0 ? (
          <Button type="button" variant="destructive" size="sm" onClick={removeSelectedNodes}>
            Xóa
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-6 xl:grid-cols-6">
        <div className="space-y-2">
          <label className="font-medium">X</label>
          <Input
            type="number"
            value={String(Math.round(editableNode?.x ?? 0))}
            disabled={!canEditNodeFields}
            onChange={(e) => patchSelectedNode({ x: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <label className="font-medium">Y</label>
          <Input
            type="number"
            value={String(Math.round(editableNode?.y ?? 0))}
            disabled={!canEditNodeFields}
            onChange={(e) => patchSelectedNode({ y: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <label className="font-medium">Opacity</label>
          <Input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={editableNode?.type === "group" ? "0" : String(editableNode?.opacity ?? 0)}
            disabled={!editableNode || editableNode.type === "group"}
            onChange={(e) => patchSelectedNode({ opacity: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <label className="font-medium">Width</label>
          <Input
            type="number"
            value={String(Math.round(editableBounds?.width ?? 0))}
            disabled={!editableShapeNode && !editableImageNode}
            onChange={(e) => patchSelectedNode({ width: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <label className="font-medium">Height</label>
          <Input
            type="number"
            value={String(Math.round(editableBounds?.height ?? 0))}
            disabled={!editableShapeNode && !editableImageNode}
            onChange={(e) => patchSelectedNode({ height: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <label className="font-medium">Cỡ chữ</label>
          <Input
            type="number"
            value={String(editableTextNode?.fontSize ?? 0)}
            disabled={!editableTextNode}
            onChange={(e) => patchSelectedNode({ fontSize: Number(e.target.value) } as Partial<BuilderTextNode>)}
          />
        </div>

        <div className="md:col-span-6 grid gap-2.5 md:grid-cols-2 lg:gap-4">
          <textarea
            value={editableTextNode?.text ?? ""}
            disabled={!editableTextNode}
            onChange={(e) => patchSelectedNode({ text: e.target.value } as Partial<BuilderTextNode>)}
            className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
          />
          <div className="grid gap-2.5 lg:gap-4">
            {editableImageNode ? (
              <MediaSelector
                value={editableImageNode.src}
                onChange={(src) => patchSelectedNode({ src })}
                compact
              />
            ) : (
              <Input value="" disabled placeholder="Chọn image layer để đổi ảnh" />
            )}
            <Input
              type="color"
              value={editableTextNode?.fill ?? editableShapeNode?.fill ?? "#000000"}
              disabled={!editableTextNode && !editableShapeNode}
              onChange={(e) => patchSelectedNode({ fill: e.target.value } as Partial<BuilderTextNode>)}
              className="h-10 w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

const CanvasControls = memo(function CanvasControls({
  notebookGridSize,
  stageScale,
  document,
  setGridSize,
  setZoom,
  setZoomPercent,
  setDocument,
}: CanvasControlsProps) {
  return (
    <div className="mt-4 flex justify-center">
      <div className="flex flex-wrap items-end justify-center gap-3">
        <div className="min-w-20">
          <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground" htmlFor="builder-canvas-grid">
            Lưới
          </label>
          <Input
            id="builder-canvas-grid"
            type="number"
            min="10"
            max="200"
            step="5"
            value={String(notebookGridSize)}
            onChange={(event) => {
              const next = Number(event.target.value) || 40;
              setGridSize(Math.min(200, Math.max(10, next)));
            }}
            className="mt-1 h-9 w-20"
          />
        </div>
        <div className="min-w-24">
          <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground" htmlFor="builder-canvas-width">
            Dài
          </label>
          <Input
            id="builder-canvas-width"
            value={String(BUILDER_PAGE_WIDTH)}
            disabled
            className="mt-1 h-9 w-24"
          />
        </div>
        x
        <div className="min-w-24">
          <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground" htmlFor="builder-canvas-height">
            Cao
          </label>
          <Input
            id="builder-canvas-height"
            type="number"
            min={String(BUILDER_MIN_HEIGHT)}
            max={String(BUILDER_MAX_HEIGHT)}
            step="10"
            value={String(document.height || BUILDER_DEFAULT_HEIGHT)}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                height: Math.min(
                  BUILDER_MAX_HEIGHT,
                  Math.max(BUILDER_MIN_HEIGHT, Number(e.target.value) || BUILDER_DEFAULT_HEIGHT)
                ),
              }))
            }
            className="mt-1 h-9 w-24"
          />
        </div>
        <div className="min-w-16">
          <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground" htmlFor="builder-canvas-background">
            Nền
          </label>
          <Input
            id="builder-canvas-background"
            type="color"
            value={document.background}
            onChange={(e) => setDocument((prev) => ({ ...prev, background: e.target.value }))}
            className="mt-1 h-9 w-14 cursor-pointer rounded-md p-1"
          />
        </div>
        <div className="min-w-32">
          <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground" htmlFor="builder-canvas-zoom">
            Zoom
          </label>
          <div className="mt-1 flex items-center gap-1 rounded-md border bg-background px-1">
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setZoom((prev) => Math.max(0.3, Number((prev - 0.1).toFixed(2))))}>
              <ZoomOut className="size-4" />
            </Button>
            <Input
              id="builder-canvas-zoom"
              type="number"
              min="30"
              max="150"
              step="10"
              value={String(Math.round(stageScale * 100))}
              onChange={(event) => setZoomPercent(Number(event.target.value))}
              className="h-8 w-14 appearance-none border-0 bg-transparent px-1 text-center text-sm font-medium shadow-none focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-sm font-medium">%</span>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setZoom((prev) => Math.min(1.5, Number((prev + 0.1).toFixed(2))))}>
              <ZoomIn className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

const CanvasStage = memo(function CanvasStage({
  document,
  stageScale,
  stageWidth,
  stageHeight,
  stageWrapperRef,
  textEditorRef,
  resizeSessionRef,
  selectedIds,
  editingTextNode,
  verticalGridLines,
  horizontalGridLines,
  snapPosition,
  addNode,
  setSelectedIds,
  setEditingTextId,
  setSingleSelection,
  handleNodeSelect,
  patchNodeById,
}: CanvasStageProps) {
  const [stageViewport, setStageViewport] = useState({ left: 0, top: 0 });
  const stageViewportRef = useRef(stageViewport);
  const stageViewportRafRef = useRef<number | null>(null);

  useEffect(() => {
    const updateViewport = () => {
      const wrapper = stageWrapperRef.current;
      if (!wrapper) {
        return;
      }

      const nextViewport = {
        left: Math.max((wrapper.clientWidth - stageWidth) / 2, 0) + wrapper.scrollLeft,
        top: Math.max((wrapper.clientHeight - stageHeight) / 2, 0) + wrapper.scrollTop,
      };

      if (
        stageViewportRef.current.left === nextViewport.left &&
        stageViewportRef.current.top === nextViewport.top
      ) {
        return;
      }

      stageViewportRef.current = nextViewport;
      if (stageViewportRafRef.current !== null) {
        cancelAnimationFrame(stageViewportRafRef.current);
      }

      stageViewportRafRef.current = requestAnimationFrame(() => {
        setStageViewport(nextViewport);
        stageViewportRafRef.current = null;
      });
    };

    updateViewport();
    const wrapper = stageWrapperRef.current;
    wrapper?.addEventListener("scroll", updateViewport);
    window.addEventListener("resize", updateViewport);

    return () => {
      wrapper?.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
      if (stageViewportRafRef.current !== null) {
        cancelAnimationFrame(stageViewportRafRef.current);
      }
    };
  }, [stageHeight, stageWidth, stageWrapperRef]);

  const editorOverlayStyle = editingTextNode ? {
    left: stageViewport.left + editingTextNode.x * stageScale,
    top: stageViewport.top + editingTextNode.y * stageScale,
    width: editingTextNode.width * stageScale,
    fontSize: editingTextNode.fontSize * stageScale,
    lineHeight: `${editingTextNode.fontSize * stageScale * 1.35}px`,
    color: editingTextNode.fill,
    fontFamily: editingTextNode.fontFamily,
    fontWeight: editingTextNode.fontStyle === "bold" ? 700 : 400,
    textAlign: editingTextNode.align,
    transform: `rotate(${editingTextNode.rotation}deg)`,
    transformOrigin: "top left",
  } as const satisfies CSSProperties : null;

  return (
    <div
      ref={stageWrapperRef}
      className="relative flex items-center justify-center overflow-auto rounded-[24px] border bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(244,244,245,0.96))] p-4 pb-14"
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("application/pinklove-builder-asset")) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }
      }}
      onDrop={(event) => {
        const presetId = event.dataTransfer.getData("application/pinklove-builder-asset");
        if (!presetId || !stageWrapperRef.current) {
          return;
        }

        event.preventDefault();
        const preset = BUILDER_ASSET_PRESETS.find((item) => item.id === presetId);
        if (!preset) {
          return;
        }

        const rect = stageWrapperRef.current.getBoundingClientRect();
        const nextNode = preset.createNode();
        const dropX = (event.clientX - rect.left - 16) / stageScale;
        const dropY = (event.clientY - rect.top - 16) / stageScale;
        const snapped = snapPosition(dropX, dropY);
        addNode({ ...nextNode, x: snapped.x, y: snapped.y });
      }}
    >
      {editingTextNode && editorOverlayStyle ? (
        <textarea
          ref={textEditorRef}
          value={editingTextNode.text}
          onChange={(event) => patchNodeById(editingTextNode.id, { text: event.target.value } as Partial<BuilderTextNode>)}
          onBlur={() => setEditingTextId(null)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setEditingTextId(null);
            }
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              setEditingTextId(null);
            }
          }}
          className="absolute z-20 resize-none overflow-hidden border border-primary bg-white/95 px-2 py-1 outline-none"
          style={editorOverlayStyle}
        />
      ) : null}

      <Stage
        width={stageWidth}
        height={stageHeight}
        scaleX={stageScale}
        scaleY={stageScale}
        onMouseDown={(event) => {
          if (event.target === event.target.getStage()) {
            setSelectedIds([]);
          }
        }}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={document.width}
            height={document.height}
            fill={document.background}
            onMouseDown={() => {
              setSelectedIds([]);
              setEditingTextId(null);
            }}
            onTap={() => {
              setSelectedIds([]);
              setEditingTextId(null);
            }}
          />
          {verticalGridLines.map((line) => (
            <Line key={line.key} points={line.points} stroke="#dbeafe" strokeWidth={0.7} listening={false} />
          ))}
          {horizontalGridLines.map((line) => (
            <Line key={line.key} points={line.points} stroke="#dbeafe" strokeWidth={0.7} listening={false} />
          ))}

          {document.nodes.map((node) => {
            if (node.type === "text") {
              return (
                <BuilderTextNodeView
                  key={node.id}
                  node={node}
                  selected={selectedIds.includes(node.id)}
                  onSelect={(append) => handleNodeSelect(node.id, append)}
                  onEdit={() => {
                    setSingleSelection(node.id);
                    setEditingTextId(node.id);
                  }}
                  onChange={(patch) =>
                    patchNodeById(node.id, {
                      ...patch,
                      ...(typeof patch.x === "number" || typeof patch.y === "number"
                        ? snapPosition(
                          typeof patch.x === "number" ? patch.x : node.x,
                          typeof patch.y === "number" ? patch.y : node.y
                        )
                        : {}),
                    })
                  }
                />
              );
            }

            if (node.type === "shape") {
              return (
                <BuilderShapeNodeView
                  key={node.id}
                  node={node}
                  selected={selectedIds.includes(node.id)}
                  onSelect={(append) => handleNodeSelect(node.id, append)}
                  onChange={(patch) =>
                    patchNodeById(node.id, {
                      ...patch,
                      ...(typeof patch.x === "number" || typeof patch.y === "number"
                        ? snapPosition(
                          typeof patch.x === "number" ? patch.x : node.x,
                          typeof patch.y === "number" ? patch.y : node.y
                        )
                        : {}),
                    })
                  }
                />
              );
            }

            if (node.type === "image") {
              return (
                <BuilderImageNodeView
                  key={node.id}
                  node={node}
                  selected={selectedIds.includes(node.id)}
                  onSelect={(append) => handleNodeSelect(node.id, append)}
                  onChange={(patch) =>
                    patchNodeById(node.id, {
                      ...patch,
                      ...(typeof patch.x === "number" || typeof patch.y === "number"
                        ? snapPosition(
                          typeof patch.x === "number" ? patch.x : node.x,
                          typeof patch.y === "number" ? patch.y : node.y
                        )
                        : {}),
                    })
                  }
                />
              );
            }

            return (
              <BuilderGroupNodeView
                key={node.id}
                node={node}
                selected={selectedIds.includes(node.id)}
                onSelect={(append) => handleNodeSelect(node.id, append)}
                onChange={(patch) => patchNodeById(node.id, patch)}
              />
            );
          })}
        </Layer>
      </Stage>

      <div
        className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 cursor-row-resize items-center gap-2 rounded-full border bg-background/95 px-3 py-1 text-xs text-muted-foreground"
        onMouseDown={(event) => {
          event.preventDefault();
          resizeSessionRef.current = {
            startY: event.clientY,
            startHeight: document.height,
          };
        }}
      >
        Kéo để đổi chiều cao
      </div>
    </div>
  );
});

export function BuilderEditor({ initialValue }: BuilderEditorProps) {
  const [document, setDocument] = useState<BuilderDocument>(() => ensureBuilderDocument(initialValue));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const stageWrapperRef = useRef<HTMLDivElement>(null);
  const textEditorRef = useRef<HTMLTextAreaElement>(null);
  const hiddenDocumentInputRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState(0.56);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const resizeSessionRef = useRef<{ startY: number; startHeight: number } | null>(null);
  const initialSerializedDocument = useMemo(() => JSON.stringify(ensureBuilderDocument(initialValue)), [initialValue]);

  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const selectedNodes = useMemo(
    () => document.nodes.filter((node) => selectedIds.includes(node.id)),
    [document.nodes, selectedIds]
  );
  const selectedNode = useMemo(
    () => document.nodes.find((node) => node.id === selectedId) ?? null,
    [document.nodes, selectedId]
  );
  const editingTextNode = useMemo(
    () => document.nodes.find((node) => node.id === editingTextId && node.type === "text") ?? null,
    [document.nodes, editingTextId]
  ) as BuilderTextNode | null;

  const stageScale = zoom;
  const stageWidth = Math.round(document.width * stageScale);
  const stageHeight = Math.round(document.height * stageScale);
  const [gridSize, setGridSize] = useState(40);
  const notebookGridSize = gridSize;
  const rowSpacing = notebookGridSize;
  const canGroup = selectedNodes.length > 1 && selectedNodes.every((node) => node.type !== "group");

  const snapValue = (value: number) => Math.round(value / notebookGridSize) * notebookGridSize;
  const snapPosition = (x: number, y: number) => ({
    x: Math.max(0, snapValue(x)),
    y: Math.max(0, snapValue(y)),
  });
  const setZoomPercent = useCallback((value: number) => {
    const normalized = Number.isFinite(value) ? value / 100 : 1;
    setZoom(Math.min(1.5, Math.max(0.3, Number(normalized.toFixed(2)))));
  }, []);

  const syncDocumentInputValue = useCallback((nextDocument: BuilderDocument) => {
    if (hiddenDocumentInputRef.current) {
      hiddenDocumentInputRef.current.value = JSON.stringify(nextDocument);
    }
  }, []);

  const verticalGridLines = useMemo(
    () =>
      Array.from({ length: Math.floor(document.width / notebookGridSize) + 1 }, (_, index) => {
        const position = index * notebookGridSize;
        return {
          key: `v-${position}`,
          points: [position, 0, position, document.height],
        };
      }),
    [document.height, document.width, notebookGridSize]
  );

  const horizontalGridLines = useMemo(
    () =>
      Array.from({ length: Math.floor(document.height / rowSpacing) + 1 }, (_, index) => {
        const position = index * rowSpacing;
        return {
          key: `h-${position}`,
          points: [0, position, document.width, position],
        };
      }),
    [document.height, document.width, rowSpacing]
  );

  const setSingleSelection = useCallback((nodeId: string | null) => {
    setSelectedIds(nodeId ? [nodeId] : []);
  }, []);

  const toggleSelection = useCallback((nodeId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(nodeId)) {
        return prev.filter((id) => id !== nodeId);
      }

      return [...prev, nodeId];
    });
  }, []);

  const handleNodeSelect = useCallback((nodeId: string, append: boolean) => {
    if (append) {
      toggleSelection(nodeId);
      return;
    }

    setSingleSelection(nodeId);
  }, [setSingleSelection, toggleSelection]);

  const patchNodeById = useCallback((nodeId: string, patch: Partial<BuilderNode>) => {
    setDocument((prev) => ({
      ...prev,
      nodes: updateNode(prev.nodes, nodeId, patch),
    }));
  }, []);

  const patchSelectedNode = useCallback((patch: Partial<BuilderNode>) => {
    if (!selectedId) {
      return;
    }

    patchNodeById(selectedId, patch);
  }, [patchNodeById, selectedId]);

  const addNode = useCallback((node: BuilderNode) => {
    setDocument((prev) => ({ ...prev, nodes: [...prev.nodes, node] }));
    setSingleSelection(node.id);
  }, [setSingleSelection]);

  const removeSelectedNodes = useCallback(() => {
    if (selectedIds.length === 0) {
      return;
    }

    setDocument((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((node) => !selectedIds.includes(node.id)),
    }));
    setSelectedIds([]);
    setEditingTextId(null);
  }, [selectedIds]);

  const duplicateNodeById = useCallback((nodeId: string) => {
    const sourceNode = document.nodes.find((node) => node.id === nodeId);
    if (!sourceNode) {
      return;
    }

    const duplicate = offsetNode(cloneNode(sourceNode), notebookGridSize, notebookGridSize);
    addNode(duplicate);
  }, [addNode, document.nodes, notebookGridSize]);

  const moveNodeById = useCallback((nodeId: string, direction: "forward" | "backward") => {
    setDocument((prev) => {
      const index = prev.nodes.findIndex((node) => node.id === nodeId);
      if (index === -1) {
        return prev;
      }

      const nextIndex = direction === "forward"
        ? Math.min(prev.nodes.length - 1, index + 1)
        : Math.max(0, index - 1);

      if (nextIndex === index) {
        return prev;
      }

      const nodes = [...prev.nodes];
      const [item] = nodes.splice(index, 1);
      nodes.splice(nextIndex, 0, item);
      return { ...prev, nodes };
    });
  }, []);

  const groupSelectedNodes = useCallback(() => {
    if (!canGroup) {
      return;
    }

    const bounds = selectedNodes.map(getNodeBounds);
    const minX = Math.min(...bounds.map((item) => item.x));
    const minY = Math.min(...bounds.map((item) => item.y));
    const maxX = Math.max(...bounds.map((item) => item.x + item.width));
    const maxY = Math.max(...bounds.map((item) => item.y + item.height));
    const selectedIdSet = new Set(selectedIds);

    const groupNode = createGroupNode({
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      nodes: selectedNodes.map((node) => offsetNode(cloneNode(node), -minX, -minY)),
    });

    setDocument((prev) => {
      const insertIndex = prev.nodes.findIndex((node) => selectedIdSet.has(node.id));
      const remainingNodes = prev.nodes.filter((node) => !selectedIdSet.has(node.id));
      const nextNodes = [...remainingNodes];
      nextNodes.splice(insertIndex === -1 ? remainingNodes.length : insertIndex, 0, groupNode);
      return { ...prev, nodes: nextNodes };
    });
    setSingleSelection(groupNode.id);
  }, [canGroup, selectedIds, selectedNodes, setSingleSelection]);

  const ungroupSelectedNode = useCallback(() => {
    if (!selectedNode || selectedNode.type !== "group") {
      return;
    }

    const ungroupedNodes = selectedNode.nodes.map((child) => offsetNode(cloneNode(child), selectedNode.x, selectedNode.y));
    setDocument((prev) => {
      const index = prev.nodes.findIndex((node) => node.id === selectedNode.id);
      if (index === -1) {
        return prev;
      }

      const nextNodes = [...prev.nodes];
      nextNodes.splice(index, 1, ...ungroupedNodes);
      return { ...prev, nodes: nextNodes };
    });
    setSelectedIds(ungroupedNodes.map((node) => node.id));
  }, [selectedNode]);

  useEffect(() => {
    if (!editingTextId || !textEditorRef.current) {
      return;
    }

    textEditorRef.current.focus();
    textEditorRef.current.select();
  }, [editingTextId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      syncDocumentInputValue(document);
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [document, syncDocumentInputValue]);

  useEffect(() => {
    const form = hiddenDocumentInputRef.current?.form;
    if (!form) {
      return;
    }

    const handleFormSubmit = () => {
      syncDocumentInputValue(document);
    };

    form.addEventListener("submit", handleFormSubmit);
    return () => form.removeEventListener("submit", handleFormSubmit);
  }, [document, syncDocumentInputValue]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isTypingTarget =
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT" ||
        target?.isContentEditable;

      if ((event.key === "Delete" || event.key === "Backspace") && selectedIds.length > 0 && !isTypingTarget) {
        event.preventDefault();
        removeSelectedNodes();
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d" && selectedId && !isTypingTarget) {
        event.preventDefault();
        duplicateNodeById(selectedId);
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "g" && selectedNodes.length > 1 && !isTypingTarget) {
        event.preventDefault();
        groupSelectedNodes();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canGroup, duplicateNodeById, groupSelectedNodes, removeSelectedNodes, selectedId, selectedIds, selectedNodes]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const session = resizeSessionRef.current;
      if (!session) {
        return;
      }

      const delta = event.clientY - session.startY;
      const rawHeight = session.startHeight + delta / stageScale;
      const snappedHeight = Math.round(rawHeight / 10) * 10;
      setDocument((prev) => ({
        ...prev,
        height: Math.min(BUILDER_MAX_HEIGHT, Math.max(BUILDER_MIN_HEIGHT, snappedHeight)),
      }));
    };

    const onMouseUp = () => {
      resizeSessionRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [stageScale]);
  const editableNode = selectedIds.length === 1 ? selectedNode : null;
  const editableBounds = editableNode ? getNodeBounds(editableNode) : null;
  const editableTextNode = editableNode?.type === "text" ? editableNode : null;
  const editableShapeNode = editableNode?.type === "shape" ? editableNode : null;
  const editableImageNode = editableNode?.type === "image" ? editableNode : null;
  const canEditNodeFields = Boolean(editableNode);
  const addTextNode = useCallback(() => addNode(createTextNode()), [addNode]);
  const addShapeNode = useCallback(() => addNode(createShapeNode()), [addNode]);
  const addImageNode = useCallback(() => addNode(createImageNode()), [addNode]);
  const addPresetNode = useCallback((node: BuilderNode) => addNode(node), [addNode]);

  return (
    <div className="space-y-5">
      <input
        ref={hiddenDocumentInputRef}
        type="hidden"
        name="builderDocument"
        defaultValue={initialSerializedDocument}
      />

      <BuilderHeader />

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <BuilderSidebarPanel
          onAddText={addTextNode}
          onAddShape={addShapeNode}
          onAddImage={addImageNode}
          onAddPreset={addPresetNode}
        />

        <div className="space-y-5">
          <div className="rounded-2xl border bg-card p-4">
            <div className="mb-4">
              <h3 className="font-semibold">Khu vực canvas</h3>
            </div>

            <SelectedNodeInspector
              selectedIds={selectedIds}
              selectedNode={selectedNode}
              editableNode={editableNode}
              editableBounds={editableBounds}
              editableTextNode={editableTextNode}
              editableShapeNode={editableShapeNode}
              editableImageNode={editableImageNode}
              canEditNodeFields={canEditNodeFields}
              canGroup={canGroup}
              groupSelectedNodes={groupSelectedNodes}
              ungroupSelectedNode={ungroupSelectedNode}
              duplicateNodeById={duplicateNodeById}
              moveNodeById={moveNodeById}
              removeSelectedNodes={removeSelectedNodes}
              patchSelectedNode={patchSelectedNode}
            />

            <CanvasStage
              document={document}
              stageScale={stageScale}
              stageWidth={stageWidth}
              stageHeight={stageHeight}
              stageWrapperRef={stageWrapperRef}
              textEditorRef={textEditorRef}
              resizeSessionRef={resizeSessionRef}
              selectedIds={selectedIds}
              editingTextNode={editingTextNode}
              verticalGridLines={verticalGridLines}
              horizontalGridLines={horizontalGridLines}
              snapPosition={snapPosition}
              addNode={addNode}
              setSelectedIds={setSelectedIds}
              setEditingTextId={setEditingTextId}
              setSingleSelection={setSingleSelection}
              handleNodeSelect={handleNodeSelect}
              patchNodeById={patchNodeById}
            />

            <CanvasControls
              notebookGridSize={notebookGridSize}
              stageScale={stageScale}
              document={document}
              setGridSize={setGridSize}
              setZoom={setZoom}
              setZoomPercent={setZoomPercent}
              setDocument={setDocument}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
