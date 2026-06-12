"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Images, Plus, Search, X } from "lucide-react";
import Image from "next/image";

import { NativeForm } from "@/components/common/native-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  AdminCancelButton,
  AdminIconButton,
  AdminSubmitButton,
} from "@/features/admin/components/admin-buttons";
import {
  AdminTableActionButton,
  AdminTableActions,
} from "@/features/admin/components/admin-table-actions";
import { MediaSelector } from "@/features/media/components/media-selector";
import type { MediaCollection } from "@/features/media/server/media-collections";
import type {
  MediaCollectionTarget,
  MediaCollectionTargetType,
} from "@/features/media/server/media-collections";
import { ROUTES } from "@/lib/routes";

export function MediaCollectionsManager({
  collections,
  targets,
  targetType: fixedTargetType,
  targetId: fixedTargetId,
  action = ROUTES.API.MEDIA_COLLECTIONS,
  title = "Media Collections",
  summary = "Gom ảnh thành album hoặc gallery có thứ tự để wedding site, provider, offering và landing page sử dụng lại.",
  plain = false,
}: {
  collections: Array<MediaCollection & { item_count: number }>;
  targets: MediaCollectionTarget[];
  targetType?: MediaCollectionTargetType;
  targetId?: string;
  action?: string;
  title?: string;
  summary?: string;
  plain?: boolean;
}) {
  const contextual = Boolean(fixedTargetType && fixedTargetId);
  const defaultTargetType = fixedTargetType ?? targets[0]?.type ?? "wedding_site";
  const defaultTargetId = fixedTargetId ?? "";
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [editingId, setEditingId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetType, setTargetType] = useState<MediaCollectionTargetType>(defaultTargetType);
  const [targetId, setTargetId] = useState(defaultTargetId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTargetType, setFilterTargetType] = useState<MediaCollectionTargetType | "all">(fixedTargetType ?? "all");
  const availableTargets = useMemo(
    () => targets.filter((target) => target.type === targetType),
    [targetType, targets]
  );
  const targetTypeLabels: Record<MediaCollectionTargetType, string> = {
    wedding_site: "Album wedding site",
    provider: "Portfolio provider",
    offering: "Gallery sản phẩm / dịch vụ",
    landing: "Gallery landing page",
  };

  function resetForm() {
    setEditingId("");
    setName("");
    setDescription("");
    setTargetType(defaultTargetType);
    setTargetId(defaultTargetId);
    setMediaUrls([]);
  }

  function editCollection(collection: MediaCollection) {
    setEditingId(collection.id);
    setName(collection.name);
    setDescription(collection.description);
    setTargetType(collection.target_type as MediaCollectionTargetType);
    setTargetId(collection.target_id);
    setMediaUrls(collection.media_urls);
    setDialogOpen(true);
  }

  function moveMedia(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= mediaUrls.length) return;
    setMediaUrls((current) => {
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  const visibleCollections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return collections.filter((collection) => {
      if (fixedTargetType && collection.target_type !== fixedTargetType) return false;
      if (fixedTargetId && collection.target_id !== fixedTargetId) return false;
      if (!fixedTargetType && filterTargetType !== "all" && collection.target_type !== filterTargetType) return false;
      if (!query) return true;
      return [
        collection.name,
        collection.description,
        collection.target_label,
        collection.target_type,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [collections, filterTargetType, fixedTargetId, fixedTargetType, searchQuery]);

  function openCreateDialog() {
    resetForm();
    setDialogOpen(true);
  }

  return (
    <Card className={plain ? "border-0 bg-transparent py-0 shadow-none" : undefined}>
      <CardHeader className={plain ? "border-b px-0 pt-0" : "border-b"}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{summary}</CardDescription>
          </div>
          <Button type="button" onClick={openCreateDialog}>
            <Plus className="size-4" />
            Tạo collection
          </Button>
        </div>
      </CardHeader>
      <CardContent className={plain ? "space-y-5 px-0 pt-5 pb-0" : "space-y-5 pt-5"}>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-60 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9"
              placeholder="Tìm collection, target..."
            />
          </div>
          {!contextual ? (
            <select
              value={filterTargetType}
              onChange={(event) => setFilterTargetType(event.target.value as MediaCollectionTargetType | "all")}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">Tất cả target type</option>
              {Object.entries(targetTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium">Collections đã tạo</h3>
            <p className="text-xs text-muted-foreground">{visibleCollections.length} collection</p>
          </div>
          <div className="divide-y rounded-md border bg-background">
            {visibleCollections.map((collection) => (
              <div key={collection.id} className="space-y-3 p-4 text-sm">
                <div className="flex flex-wrap justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-medium">{collection.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {targetTypeLabels[collection.target_type as MediaCollectionTargetType] ?? collection.target_type}
                      {" · "}
                      {collection.target_label}
                    </p>
                  </div>
                  <span className="shrink-0 text-muted-foreground">{collection.item_count} media</span>
                </div>
                {collection.media_urls.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 xl:grid-cols-8">
                    {collection.media_urls.slice(0, 8).map((url) => (
                      <div key={url} className="aspect-square overflow-hidden rounded-md border bg-muted">
                        <div className="relative size-full">
                          <Image src={url} alt="" fill sizes="96px" className="object-cover" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                    <Images className="size-4" />
                    Collection chưa có media.
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <p className="line-clamp-2 text-xs text-muted-foreground">{collection.description || "Không có mô tả."}</p>
                  <AdminTableActions>
                    <AdminTableActionButton action="edit" label="Chỉnh sửa collection" onClick={() => editCollection(collection)} />
                    <NativeForm action={action} method="POST">
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="id" value={collection.id} />
                      <input type="hidden" name="targetType" value={collection.target_type} />
                      <input type="hidden" name="targetId" value={collection.target_id} />
                      <AdminTableActionButton action="delete" label="Xóa collection" type="submit" />
                    </NativeForm>
                  </AdminTableActions>
                </div>
              </div>
            ))}
            {visibleCollections.length === 0 ? <p className="p-5 text-sm text-muted-foreground">Chưa có collection.</p> : null}
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[calc(100vh-2rem)] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Chỉnh sửa collection" : "Tạo collection"}</DialogTitle>
              <DialogDescription>
                Chọn target và sắp xếp media theo đúng thứ tự hiển thị.
              </DialogDescription>
            </DialogHeader>
            <NativeForm action={action} method="POST" className="grid content-start gap-5">
              <input type="hidden" name="intent" value="save" />
              <input type="hidden" name="id" value={editingId} />
              <Input
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ví dụ: Album lễ cưới, Portfolio studio..."
                required
              />
              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  <span className="font-medium">Mục đích sử dụng</span>
                  {fixedTargetType ? (
                    <>
                      <input type="hidden" name="targetType" value={fixedTargetType} />
                      <Input value={targetTypeLabels[fixedTargetType]} disabled />
                    </>
                  ) : (
                    <select
                      name="targetType"
                      value={targetType}
                      onChange={(event) => {
                        setTargetType(event.target.value as MediaCollectionTargetType);
                        setTargetId("");
                      }}
                      className="h-9 rounded-md border bg-background px-3"
                    >
                      {Object.entries(targetTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  )}
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="font-medium">Áp dụng cho</span>
                  {fixedTargetId ? (
                    <>
                      <input type="hidden" name="targetId" value={fixedTargetId} />
                      <Input value={targets.find((target) => target.id === fixedTargetId)?.label ?? fixedTargetId} disabled />
                    </>
                  ) : (
                    <select
                      name="targetId"
                      value={targetId}
                      onChange={(event) => setTargetId(event.target.value)}
                      className="h-9 min-w-0 rounded-md border bg-background px-3"
                      required
                    >
                      <option value="">Chọn đối tượng</option>
                      {availableTargets.map((target) => (
                        <option key={target.id} value={target.id}>{target.label}</option>
                      ))}
                    </select>
                  )}
                </label>
              </div>
              <Input
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Mô tả ngắn về album hoặc gallery"
              />
              <input type="hidden" name="mediaUrls" value={JSON.stringify(mediaUrls)} />
              <MediaSelector value={mediaUrls} onChange={setMediaUrls} multiple compact />
              {mediaUrls.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Thứ tự hiển thị</p>
                  <div className="divide-y rounded-md border">
                    {mediaUrls.map((url, index) => (
                      <div key={url} className="flex items-center gap-3 p-2">
                        <span className="w-6 text-center text-xs text-muted-foreground">{index + 1}</span>
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-md border">
                          <Image src={url} alt="" fill sizes="40px" className="object-cover" />
                        </div>
                        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{url}</span>
                        <AdminIconButton type="button" onClick={() => moveMedia(index, -1)} disabled={index === 0} aria-label="Đưa media lên"><ArrowUp /></AdminIconButton>
                        <AdminIconButton type="button" onClick={() => moveMedia(index, 1)} disabled={index === mediaUrls.length - 1} aria-label="Đưa media xuống"><ArrowDown /></AdminIconButton>
                        <AdminIconButton type="button" onClick={() => setMediaUrls((current) => current.filter((item) => item !== url))} aria-label="Bỏ media"><X /></AdminIconButton>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2">
                <AdminCancelButton
                  type="button"
                  onClick={() => {
                    resetForm();
                    setDialogOpen(false);
                  }}
                >
                  Hủy
                </AdminCancelButton>
                <AdminSubmitButton>
                  {editingId ? "Lưu collection" : "Tạo collection"}
                </AdminSubmitButton>
              </div>
            </NativeForm>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
