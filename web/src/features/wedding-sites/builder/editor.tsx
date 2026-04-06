"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Konva from "konva";
import { Layer, Line, Rect, Stage, Text, Image as KonvaImage, Transformer } from "react-konva";
import { Copy, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BUILDER_DEFAULT_HEIGHT,
  BUILDER_MAX_HEIGHT,
  BUILDER_MIN_HEIGHT,
  BUILDER_PAGE_WIDTH,
} from "@/features/wedding-sites/builder/defaults";
import { BUILDER_ASSET_PRESETS } from "@/features/wedding-sites/builder/presets";
import {
  createImageNode,
  createShapeNode,
  createTextNode,
  ensureBuilderDocument,
  updateNode,
} from "@/features/wedding-sites/builder/utils";
import type { BuilderDocument, BuilderImageNode, BuilderNode, BuilderTextNode } from "@/features/wedding-sites/builder/types";

type BuilderEditorProps = {
  initialValue: unknown;
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

function BuilderImageNodeView({
  node,
  selected,
  onSelect,
  onChange,
}: {
  node: BuilderImageNode;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<BuilderNode>) => void;
}) {
  const image = useImageElement(node.src);
  const shapeRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

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
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(event) => onChange({ x: event.target.x(), y: event.target.y() })}
        onTransformEnd={() => {
          const target = shapeRef.current;
          if (!target) {
            return;
          }

          const scaleX = target.scaleX();
          const scaleY = target.scaleY();
          target.scaleX(1);
          target.scaleY(1);

          onChange({
            x: target.x(),
            y: target.y(),
            width: Math.max(80, target.width() * scaleX),
            height: Math.max(80, target.height() * scaleY),
            rotation: target.rotation(),
          });
        }}
      />
      {selected ? <Transformer ref={transformerRef} rotateEnabled enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]} /> : null}
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
  onSelect: () => void;
  onChange: (patch: Partial<BuilderNode>) => void;
  onEdit: () => void;
}) {
  const textRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

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
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={onEdit}
        onDragStart={onSelect}
        onDragEnd={(event) => onChange({ x: event.target.x(), y: event.target.y() })}
        onTransformEnd={() => {
          const target = textRef.current;
          if (!target) {
            return;
          }

          const scaleX = target.scaleX();
          const scaleY = target.scaleY();
          target.scaleX(1);
          target.scaleY(1);

          onChange({
            x: target.x(),
            y: target.y(),
            width: Math.max(120, target.width() * scaleX),
            fontSize: Math.max(12, node.fontSize * scaleY),
            rotation: target.rotation(),
          } as Partial<BuilderTextNode>);
        }}
      />
      {selected ? (
        <Transformer
          ref={transformerRef}
          rotateEnabled
          enabledAnchors={["middle-left", "middle-right", "top-left", "top-right", "bottom-left", "bottom-right"]}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 120 || newBox.height < 24) {
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
  onSelect: () => void;
  onChange: (patch: Partial<BuilderNode>) => void;
}) {
  const shapeRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

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
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={onSelect}
        onDragEnd={(event) => onChange({ x: event.target.x(), y: event.target.y() })}
        onTransformEnd={() => {
          const target = shapeRef.current;
          if (!target) {
            return;
          }

          const scaleX = target.scaleX();
          const scaleY = target.scaleY();
          target.scaleX(1);
          target.scaleY(1);

          onChange({
            x: target.x(),
            y: target.y(),
            width: Math.max(40, target.width() * scaleX),
            height: Math.max(40, target.height() * scaleY),
            rotation: target.rotation(),
          });
        }}
      />
      {selected ? (
        <Transformer
          ref={transformerRef}
          rotateEnabled
          enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right", "middle-left", "middle-right"]}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 40 || newBox.height < 40) {
              return oldBox;
            }

            return newBox;
          }}
        />
      ) : null}
    </>
  );
}

export function BuilderEditor({ initialValue }: BuilderEditorProps) {
  const [document, setDocument] = useState<BuilderDocument>(() => ensureBuilderDocument(initialValue));
  const [selectedId, setSelectedId] = useState<string | null>(document.nodes[0]?.id ?? null);
  const stageWrapperRef = useRef<HTMLDivElement>(null);
  const textEditorRef = useRef<HTMLTextAreaElement>(null);
  const [zoom, setZoom] = useState(0.56);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [stageViewport, setStageViewport] = useState({ left: 0, top: 0 });

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
  const notebookGridSize = 40;
  const rowSpacing = notebookGridSize;

  const snapValue = (value: number) => Math.round(value / notebookGridSize) * notebookGridSize;
  const snapPosition = (x: number, y: number) => ({
    x: Math.max(0, snapValue(x)),
    y: Math.max(0, snapValue(y)),
  });

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

  const patchNodeById = (nodeId: string, patch: Partial<BuilderNode>) => {
    setDocument((prev) => ({
      ...prev,
      nodes: updateNode(prev.nodes, nodeId, patch),
    }));
  };

  const patchSelectedNode = (patch: Partial<BuilderNode>) => {
    if (!selectedId) {
      return;
    }

    patchNodeById(selectedId, patch);
  };

  const addNode = (node: BuilderNode) => {
    setDocument((prev) => ({ ...prev, nodes: [...prev.nodes, node] }));
    setSelectedId(node.id);
  };

  const removeNodeById = (nodeId: string) => {
    setDocument((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((node) => node.id !== nodeId),
    }));
    setSelectedId(null);
    setEditingTextId(null);
  };

  const duplicateNodeById = (nodeId: string) => {
    const sourceNode = document.nodes.find((node) => node.id === nodeId);
    if (!sourceNode) {
      return;
    }

    const duplicate =
      sourceNode.type === "text"
        ? createTextNode({ ...sourceNode, x: sourceNode.x + notebookGridSize, y: sourceNode.y + notebookGridSize })
        : sourceNode.type === "shape"
          ? createShapeNode({ ...sourceNode, x: sourceNode.x + notebookGridSize, y: sourceNode.y + notebookGridSize })
          : createImageNode({ ...sourceNode, x: sourceNode.x + notebookGridSize, y: sourceNode.y + notebookGridSize });

    addNode(duplicate);
  };

  const moveNodeById = (nodeId: string, direction: "forward" | "backward") => {
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
  };

  useEffect(() => {
    if (!editingTextId || !textEditorRef.current) {
      return;
    }

    textEditorRef.current.focus();
    textEditorRef.current.select();
  }, [editingTextId]);

  useEffect(() => {
    const updateViewport = () => {
      const wrapper = stageWrapperRef.current;
      if (!wrapper) {
        return;
      }

      setStageViewport({
        left: Math.max((wrapper.clientWidth - stageWidth) / 2, 0) + wrapper.scrollLeft,
        top: Math.max((wrapper.clientHeight - stageHeight) / 2, 0) + wrapper.scrollTop,
      });
    };

    updateViewport();
    const wrapper = stageWrapperRef.current;
    wrapper?.addEventListener("scroll", updateViewport);
    window.addEventListener("resize", updateViewport);

    return () => {
      wrapper?.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
    };
  }, [stageHeight, stageWidth]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isTypingTarget =
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT" ||
        target?.isContentEditable;

      if ((event.key === "Delete" || event.key === "Backspace") && selectedId && !isTypingTarget) {
        event.preventDefault();
        removeNodeById(selectedId);
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d" && selectedId && !isTypingTarget) {
        event.preventDefault();
        const sourceNode = document.nodes.find((node) => node.id === selectedId);
        if (!sourceNode) {
          return;
        }

        const duplicate =
          sourceNode.type === "text"
            ? createTextNode({ ...sourceNode, x: sourceNode.x + notebookGridSize, y: sourceNode.y + notebookGridSize })
            : sourceNode.type === "shape"
              ? createShapeNode({ ...sourceNode, x: sourceNode.x + notebookGridSize, y: sourceNode.y + notebookGridSize })
              : createImageNode({ ...sourceNode, x: sourceNode.x + notebookGridSize, y: sourceNode.y + notebookGridSize });

        setDocument((prev) => ({ ...prev, nodes: [...prev.nodes, duplicate] }));
        setSelectedId(duplicate.id);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [document.nodes, selectedId]);

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
  } as const : null;

  return (
    <div className="space-y-4">
      <input type="hidden" name="builderDocument" value={JSON.stringify(document)} />

      <div className="rounded-2xl border bg-card p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-[160px_160px_120px]">
          <div className="space-y-2">
            <label className="font-medium">Khổ ngang cố định</label>
            <Input value={`${BUILDER_PAGE_WIDTH}px`} disabled />
          </div>
          <div className="space-y-2">
            <label className="font-medium">Chiều cao trang</label>
            <Input
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
            />
          </div>
          <div className="space-y-2">
            <label className="font-medium">Nền thiệp</label>
            <Input
              type="color"
              value={document.background}
              onChange={(e) => setDocument((prev) => ({ ...prev, background: e.target.value }))}
              className="h-12"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => addNode(createTextNode())}>
            Thêm text
          </Button>
          <Button type="button" variant="outline" onClick={() => addNode(createShapeNode())}>
            Thêm shape
          </Button>
          <Button type="button" variant="outline" onClick={() => addNode(createImageNode())}>
            Thêm ảnh
          </Button>
          {selectedNode ? (
            <>
              <Button type="button" variant="outline" size="icon" onClick={() => moveNodeById(selectedNode.id, "backward")}>
                ↓
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={() => moveNodeById(selectedNode.id, "forward")}>
                ↑
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={() => duplicateNodeById(selectedNode.id)}>
                <Copy className="size-4" />
              </Button>
              <Button type="button" variant="destructive" onClick={() => removeNodeById(selectedNode.id)}>
                Xóa item
              </Button>
            </>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-6">
          {selectedNode ? (
            <>
              <div className="space-y-2">
                <label className="font-medium">X</label>
                <Input type="number" value={String(Math.round(selectedNode.x))} onChange={(e) => patchSelectedNode({ x: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Y</label>
                <Input type="number" value={String(Math.round(selectedNode.y))} onChange={(e) => patchSelectedNode({ y: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Opacity</label>
                <Input type="number" min="0" max="1" step="0.1" value={String(selectedNode.opacity)} onChange={(e) => patchSelectedNode({ opacity: Number(e.target.value) })} />
              </div>

              {selectedNode.type === "text" ? (
                <>
                  <div className="space-y-2 md:col-span-3">
                    <label className="font-medium">Nội dung</label>
                    <textarea
                      value={selectedNode.text}
                      onChange={(e) => patchSelectedNode({ text: e.target.value } as Partial<BuilderTextNode>)}
                      className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium">Cỡ chữ</label>
                    <Input type="number" value={String(selectedNode.fontSize)} onChange={(e) => patchSelectedNode({ fontSize: Number(e.target.value) } as Partial<BuilderTextNode>)} />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium">Màu chữ</label>
                    <Input type="color" value={selectedNode.fill} onChange={(e) => patchSelectedNode({ fill: e.target.value } as Partial<BuilderTextNode>)} className="h-12" />
                  </div>
                </>
              ) : null}

              {selectedNode.type === "shape" ? (
                <>
                  <div className="space-y-2">
                    <label className="font-medium">Width</label>
                    <Input type="number" value={String(selectedNode.width)} onChange={(e) => patchSelectedNode({ width: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium">Height</label>
                    <Input type="number" value={String(selectedNode.height)} onChange={(e) => patchSelectedNode({ height: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium">Màu shape</label>
                    <Input type="color" value={selectedNode.fill} onChange={(e) => patchSelectedNode({ fill: e.target.value })} className="h-12" />
                  </div>
                </>
              ) : null}

              {selectedNode.type === "image" ? (
                <>
                  <div className="space-y-2 md:col-span-3">
                    <label className="font-medium">URL ảnh</label>
                    <Input value={selectedNode.src} onChange={(e) => patchSelectedNode({ src: e.target.value })} placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium">Width</label>
                    <Input type="number" value={String(selectedNode.width)} onChange={(e) => patchSelectedNode({ width: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium">Height</label>
                    <Input type="number" value={String(selectedNode.height)} onChange={(e) => patchSelectedNode({ height: Number(e.target.value) })} />
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <div className="rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground md:col-span-6">
              Chọn một item trong thiệp để chỉnh thuộc tính.
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-2xl border bg-card p-4 space-y-4">
          <h3 className="font-semibold">Thư viện kéo thả</h3>
          <p className="text-sm text-muted-foreground">
            Kéo `text`, `svg`, hoặc `image preset` vào trình dựng để tạo bố cục thiệp.
          </p>
          <div className="grid gap-3">
            {BUILDER_ASSET_PRESETS.map((preset) => (
              <div
                key={preset.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/pinklove-builder-asset", preset.id);
                  event.dataTransfer.effectAllowed = "copy";
                }}
                onDoubleClick={() => addNode(preset.createNode())}
                className="flex cursor-grab items-center justify-between rounded-xl border bg-background px-3 py-3"
              >
                <div>
                  <p className="font-medium">{preset.label}</p>
                  <p className="text-xs uppercase tracking-[3px] text-muted-foreground">
                    {preset.preview}
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={() => addNode(preset.createNode())}>
                  Thêm
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div
            ref={stageWrapperRef}
            className="relative flex items-center justify-center overflow-auto rounded-2xl border bg-[#f5f5f5] p-4"
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
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full border bg-background/95 px-2 py-1 backdrop-blur">
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setZoom((prev) => Math.max(0.3, Number((prev - 0.1).toFixed(2))))}>
                <ZoomOut className="size-4" />
              </Button>
              <div className="min-w-12 text-center text-sm">{Math.round(stageScale * 100)}%</div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setZoom((prev) => Math.min(1.5, Number((prev + 0.1).toFixed(2))))}>
                <ZoomIn className="size-4" />
              </Button>
            </div>

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
                  setSelectedId(null);
                }
              }}
            >
              <Layer>
                <Rect x={0} y={0} width={document.width} height={document.height} fill={document.background} />
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
                        selected={selectedId === node.id}
                        onSelect={() => setSelectedId(node.id)}
                        onEdit={() => {
                          setSelectedId(node.id);
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
                        selected={selectedId === node.id}
                        onSelect={() => setSelectedId(node.id)}
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
                    <BuilderImageNodeView
                      key={node.id}
                      node={node}
                      selected={selectedId === node.id}
                      onSelect={() => setSelectedId(node.id)}
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
                })}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </div>
  );
}
