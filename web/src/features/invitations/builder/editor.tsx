"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Konva from "konva";
import { Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text, Transformer } from "react-konva";
import { Copy, Grip, ImageIcon, Layers3, MousePointer2, Square, Type, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function BuilderEditor({ initialValue }: BuilderEditorProps) {
  const [document, setDocument] = useState<BuilderDocument>(() => ensureBuilderDocument(initialValue));
  const [selectedIds, setSelectedIds] = useState<string[]>(document.nodes[0]?.id ? [document.nodes[0].id] : []);
  const stageWrapperRef = useRef<HTMLDivElement>(null);
  const textEditorRef = useRef<HTMLTextAreaElement>(null);
  const [zoom, setZoom] = useState(0.56);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [stageViewport, setStageViewport] = useState({ left: 0, top: 0 });
  const resizeSessionRef = useRef<{ startY: number; startHeight: number } | null>(null);

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
  const notebookGridSize = 40;
  const rowSpacing = notebookGridSize;
  const canGroup = selectedNodes.length > 1 && selectedNodes.every((node) => node.type !== "group");
  const nodeCount = document.nodes.length;
  const selectionLabel = selectedIds.length === 0
    ? "Chưa chọn item"
    : selectedIds.length === 1
      ? selectedNode?.type === "group"
        ? "Đang chọn 1 nhóm"
        : `Đang chọn 1 ${selectedNode?.type ?? "item"}`
      : `Đang chọn ${selectedIds.length} item`;
  const assetLibraryCount = BUILDER_ASSET_PRESETS.length;

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
    [document.height, document.width]
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

  const toggleSelection = (nodeId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(nodeId)) {
        return prev.filter((id) => id !== nodeId);
      }

      return [...prev, nodeId];
    });
  };

  const handleNodeSelect = (nodeId: string, append: boolean) => {
    if (append) {
      toggleSelection(nodeId);
      return;
    }

    setSingleSelection(nodeId);
  };

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

  const ungroupSelectedNode = () => {
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
    <div className="space-y-5">
      <input type="hidden" name="builderDocument" value={JSON.stringify(document)} />

      <div className="overflow-hidden rounded-[28px] border border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,244,246,0.9))] shadow-sm">
        <div className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1.4fr)_280px] lg:px-6">
          <div className="space-y-3">
            <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              Khu vực builder
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold tracking-tight">Luồng dựng canvas chuyên nghiệp cho quá trình thiết kế thiệp.</h3>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Làm việc theo một thứ tự rõ ràng hơn: thêm block, chỉnh item đang chọn, rồi hoàn thiện bố cục cuối cùng trên canvas. Có thể kéo preset từ thư viện hoặc dùng các thao tác nhanh bên dưới.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-full border border-border/70 bg-white/80 px-3 py-1.5 text-sm">
                {nodeCount} layer
              </div>
              <div className="rounded-full border border-border/70 bg-white/80 px-3 py-1.5 text-sm">
                {assetLibraryCount} preset
              </div>
              <div className="rounded-full border border-border/70 bg-white/80 px-3 py-1.5 text-sm">
                Canvas {document.width} x {document.height}
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Lựa chọn</p>
              <p className="mt-2 text-lg font-semibold">{selectionLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Phím tắt</p>
              <p className="mt-2 text-sm text-muted-foreground">Delete để xóa, Ctrl/Cmd + D để nhân bản, Ctrl/Cmd + G để nhóm nhiều item.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-5">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">Thao tác nhanh</h3>
                <p className="mt-1 text-sm text-muted-foreground">Tạo các block cơ bản trước, sau đó mới tinh chỉnh layer đang chọn.</p>
              </div>
              <div className="rounded-xl bg-primary/8 p-2 text-primary">
                <MousePointer2 className="size-4" />
              </div>
            </div>
            <div className="grid gap-2">
              <Button type="button" variant="outline" className="justify-start" onClick={() => addNode(createTextNode())}>
                <Type className="size-4" />
                Thêm block chữ
              </Button>
              <Button type="button" variant="outline" className="justify-start" onClick={() => addNode(createShapeNode())}>
                <Square className="size-4" />
                Thêm shape
              </Button>
              <Button type="button" variant="outline" className="justify-start" onClick={() => addNode(createImageNode())}>
                <ImageIcon className="size-4" />
                Thêm khung ảnh
              </Button>
            </div>
            <div className="mt-4 grid gap-2">
              {canGroup ? (
                <Button type="button" variant="outline" className="justify-start" onClick={groupSelectedNodes}>
                  <Layers3 className="size-4" />
                  Nhóm {selectedNodes.length} item đã chọn
                </Button>
              ) : null}
              {selectedNode?.type === "group" ? (
                <Button type="button" variant="outline" className="justify-start" onClick={ungroupSelectedNode}>
                  <Layers3 className="size-4" />
                  Bỏ nhóm đang chọn
                </Button>
              ) : null}
              {selectedNode ? (
                <>
                  <Button type="button" variant="outline" className="justify-start" onClick={() => duplicateNodeById(selectedNode.id)}>
                    <Copy className="size-4" />
                    Nhân bản item đang chọn
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" onClick={() => moveNodeById(selectedNode.id, "backward")}>
                      Lùi xuống
                    </Button>
                    <Button type="button" variant="outline" onClick={() => moveNodeById(selectedNode.id, "forward")}>
                      Đưa lên
                    </Button>
                  </div>
                </>
              ) : null}
              {selectedIds.length > 0 ? (
                <Button type="button" variant="destructive" className="justify-start" onClick={removeSelectedNodes}>
                  Xóa item
                </Button>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">Thư viện asset</h3>
                <p className="mt-1 text-sm text-muted-foreground">Kéo preset vào stage hoặc double click để chèn nhanh.</p>
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
                  onDoubleClick={() => addNode(preset.createNode())}
                  className="flex cursor-grab items-center justify-between rounded-2xl border border-border/70 bg-background px-3 py-3 transition hover:border-primary/35 hover:bg-primary/5"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{preset.label}</p>
                    <p className="truncate text-xs uppercase tracking-[3px] text-muted-foreground">
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
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">Thiết lập canvas và vùng chỉnh sửa</h3>
                <p className="mt-1 text-sm text-muted-foreground">Thiết lập cấp trang nằm phía trên, còn thuộc tính của item đang chọn nằm bên dưới.</p>
              </div>
              <div className="rounded-xl bg-primary/8 p-2 text-primary">
                <Layers3 className="size-4" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[160px_160px_120px]">
              <div className="space-y-2">
                <label className="font-medium">Chiều rộng canvas</label>
                <Input value={`${BUILDER_PAGE_WIDTH}px`} disabled />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Chiều cao canvas</label>
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
                <label className="font-medium">Nền</label>
                <Input
                  type="color"
                  value={document.background}
                  onChange={(e) => setDocument((prev) => ({ ...prev, background: e.target.value }))}
                  className="h-12"
                />
              </div>
            </div>

            <div className="mt-5 border-t pt-5">
              {selectedIds.length > 1 ? (
                <div className="rounded-2xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
                  Đang chọn {selectedIds.length} item.
                  {canGroup ? " Dùng Ctrl/Cmd + G hoặc nút group để gom các item này." : " Group lồng nhau hiện chưa hỗ trợ trong editor."}
                </div>
              ) : selectedNode ? (
                <div className="grid gap-4 md:grid-cols-6">
                  <div className="space-y-2">
                    <label className="font-medium">X</label>
                    <Input type="number" value={String(Math.round(selectedNode.x))} onChange={(e) => patchSelectedNode({ x: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium">Y</label>
                    <Input type="number" value={String(Math.round(selectedNode.y))} onChange={(e) => patchSelectedNode({ y: Number(e.target.value) })} />
                  </div>

                  {selectedNode.type === "group" ? (
                    <div className="rounded-2xl border border-dashed px-4 py-5 text-sm text-muted-foreground md:col-span-4">
                      Group có thể kéo và resize trực tiếp trên canvas, bao gồm kéo chiều cao.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="font-medium">Opacity</label>
                      <Input type="number" min="0" max="1" step="0.1" value={String(selectedNode.opacity)} onChange={(e) => patchSelectedNode({ opacity: Number(e.target.value) })} />
                    </div>
                  )}

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
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
                  Chọn một item trong canvas để chỉnh thuộc tính. Nếu đang bắt đầu từ đầu, hãy thêm text, shape hoặc khung ảnh từ cột bên trái.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold">Khu vực canvas</h3>
                <p className="mt-1 text-sm text-muted-foreground">Canvas luôn được canh giữa, hỗ trợ zoom và bám lưới để quá trình dàn trang gọn gàng hơn.</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border bg-background px-2 py-1">
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setZoom((prev) => Math.max(0.3, Number((prev - 0.1).toFixed(2))))}>
                  <ZoomOut className="size-4" />
                </Button>
                <div className="min-w-14 text-center text-sm font-medium">{Math.round(stageScale * 100)}%</div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setZoom((prev) => Math.min(1.5, Number((prev + 0.1).toFixed(2))))}>
                  <ZoomIn className="size-4" />
                </Button>
              </div>
            </div>

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
              <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2 rounded-2xl border bg-background/92 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
                <span className="font-medium text-foreground">Lưới {notebookGridSize}px</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>{selectionLabel}</span>
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
                  setSelectedIds([]);
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
              className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 cursor-row-resize items-center gap-2 rounded-full border bg-background/95 px-3 py-1 text-xs text-muted-foreground shadow-sm"
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
          </div>
        </div>
      </div>
    </div>
  );
}
