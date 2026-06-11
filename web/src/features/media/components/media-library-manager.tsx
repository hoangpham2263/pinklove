"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { X, Copy, Trash2, Eye, ChevronLeft, ChevronRight, FileText, Grid2X2, List, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi } from "@/lib/api-client.admin";
import type { MediaAsset } from "../types";

type UploadState = "idle" | "uploading";
type LayoutMode = "grid" | "list";
type BulkAction = "" | "delete";

type MediaLibraryManagerProps = {
  initialData: {
    items: MediaAsset[];
    total: number;
    page: number;
    limit: number;
  };
};

export function MediaLibraryManager({ initialData }: MediaLibraryManagerProps) {
  const [items, setItems] = useState<MediaAsset[]>(initialData.items);
  const [total, setTotal] = useState(initialData.total);
  const [page, setPage] = useState(initialData.page);
  const [limit, setLimit] = useState(initialData.limit);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaAsset | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("grid");
  const [bulkAction, setBulkAction] = useState<BulkAction>("");

  function isImageFile(item: MediaAsset) {
    return item.mimeType.startsWith("image/");
  }

  const totalPages = Math.ceil(total / limit);
  const allVisibleSelected = layoutMode === "list" && items.length > 0 && items.every((item) => selectedIds.includes(item.id));
  const selectedCount = selectedIds.length;

  const fetchItems = async (targetPage: number, targetLimit: number) => {
    try {
      const data = await adminApi.listMedia({ page: targetPage, limit: targetLimit });
      setItems(data.items);
      setTotal(data.total);
      setPage(data.page);
      setLimit(data.limit);
      setSelectedIds((current) => current.filter((id) => data.items.some((item) => item.id === id)));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải lại thư viện media.";
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      void fetchItems(newPage, limit);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    void fetchItems(1, newLimit);
  };

  const handleLayoutChange = (nextLayout: LayoutMode) => {
    setLayoutMode(nextLayout);
    if (nextLayout === "grid") {
      setSelectedIds([]);
      setBulkAction("");
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedIds((current) => (
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    ));
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !items.some((item) => item.id === id));
      }

      const next = new Set(current);
      for (const item of items) {
        next.add(item.id);
      }
      return Array.from(next);
    });
  };

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;

    setUploadState("uploading");
    setErrorMessage(null);

    try {
      for (const file of files) {
        await adminApi.uploadMedia(file);
      }
      await fetchItems(1, limit);
      toast.success(files.length === 1 ? "Đã tải media lên." : `Đã tải lên ${files.length} file.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tải lên thất bại.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setUploadState("idle");
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: true,
    disabled: uploadState === "uploading",
    onDrop: (acceptedFiles) => {
      void uploadFiles(acceptedFiles);
    },
  });

  async function handleXóa(id: string) {
    try {
      await adminApi.deleteMedia(id);
      const nextTotal = Math.max(0, total - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / limit));
      const targetPage = Math.min(page, nextTotalPages);
      await fetchItems(targetPage, limit);
      toast.success("Đã xóa media.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể xóa media.";
      setErrorMessage(message);
      toast.error(message);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;

    try {
      for (const id of selectedIds) {
        await adminApi.deleteMedia(id);
      }

      const nextTotal = Math.max(0, total - selectedIds.length);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / limit));
      const targetPage = Math.min(page, nextTotalPages);
      setSelectedIds([]);
      setBulkAction("");
      await fetchItems(targetPage, limit);
      toast.success(`Đã xóa ${selectedIds.length} media.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể xóa media.";
      setErrorMessage(message);
      toast.error(message);
    }
  }

  async function handleApplyBulkAction() {
    if (bulkAction !== "delete" || selectedIds.length === 0) {
      return;
    }

    await handleBulkDelete();
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Tải Ảnh lên</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div
            {...getRootProps()}
            className={`rounded-lg border border-dashed p-10 text-center transition-colors cursor-pointer ${isDragActive ? "border-primary bg-primary/5" : "border-border bg-muted/20"
              } ${uploadState === "uploading" ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
              {uploadState === "uploading" ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p>Đang tải ảnh lên...</p>
                </>
              ) : (
                <>
                  <p>
                    {isDragActive
                      ? "Thả file vào đây..."
                      : "Kéo thả file vào đây, hoặc click để chọn file"}
                  </p>
                  <p className="opacity-70">
                    Hỗ trợ mọi loại file, gồm cả SVG
                  </p>
                </>
              )}
            </div>
          </div>
          {errorMessage ? (
            <p className="text-destructive">{errorMessage}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-md border">
  <Button
  type="button"
  variant={layoutMode === "grid" ? "secondary" : "ghost"}
  size="sm"
  className="rounded-r-none"
  onClick={() => handleLayoutChange("grid")}
              >
                <Grid2X2 className="h-4 w-4" />
                Grid
              </Button>
  <Button
  type="button"
  variant={layoutMode === "list" ? "secondary" : "ghost"}
  size="sm"
  className="rounded-l-none border-l"
  onClick={() => handleLayoutChange("list")}
              >
                <List className="h-4 w-4" />
                List
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span>Đổi hiển thị:</span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className=""
              >
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
              </select>
            </div>
            <span>Số lượng: {total}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {layoutMode === "list" ? (
              <div className="flex items-center gap-2">
                <input
                  id="select-visible-media"
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAllVisible}
                  aria-label="Chọn tất cả media đang hiển thị"
                />
                <label htmlFor="select-visible-media" className="cursor-pointer">
                  Chọn trang này
                </label>
              </div>
            ) : null}
            {layoutMode === "list" ? (
              <div className="flex items-center gap-2">
                <select
                  value={bulkAction}
                  onChange={(event) => setBulkAction(event.target.value as BulkAction)}
                  className="h-9 min-w-44 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Bulk actions</option>
                  <option value="delete">Delete</option>
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleApplyBulkAction()}
                  disabled={!bulkAction || selectedCount === 0}
                >
                  Apply
                </Button>
                <span className="text-sm text-muted-foreground">
                  Đã chọn {selectedCount}
                </span>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p>Chưa có ảnh nào được tải lên.</p>
          ) : (
            <>
              {layoutMode === "grid" ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {items.map((item) => (
                    <article key={item.id} className="group relative overflow-hidden rounded-lg border bg-card transition-all">
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        {isImageFile(item) ? (
                          <>
                            <div
                              className="h-full w-full cursor-pointer bg-cover bg-center transition-transform group-hover:scale-105"
                              style={{ backgroundImage: `url(${item.url})` }}
                              onClick={() => setPreviewItem(item)}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer pointer-events-none">
                              <Eye className="h-6 w-6 text-white" />   </div>
                          </>
                        ) : (
                          <a href={item.url} target="_blank" rel="noreferrer" className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
                            <FileText className="h-10 w-10 text-muted-foreground" />
                            <p className="line-clamp-2 text-xs text-muted-foreground">{item.originalName}</p>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-3 gap-2">
                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                          <p className="truncate leading-tight">{item.originalName}</p>
                          <p className="opacity-50 leading-tight">
                            {(item.sizeBytes / 1024).toFixed(0)} KB
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            className="hover:text-primary transition-colors p-1"
                            title="Sao chép URL"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await navigator.clipboard.writeText(item.url);
                              toast.success("Đã sao chép URL.");
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            className="text-destructive/70 hover:text-destructive transition-colors p-1"
                            title="Xóa"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleXóa(item.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className={`flex items-center gap-4 rounded-lg border bg-card p-3 transition-all ${selectedIds.includes(item.id) ? "ring-1 ring-primary" : ""}`}
                      onClick={() => toggleItemSelection(item.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`Chọn media ${item.originalName}`}
                        className="shrink-0"
                      />
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                        {isImageFile(item) ? (
                          <div
                            className="h-full w-full cursor-pointer bg-cover bg-center"
                            style={{ backgroundImage: `url(${item.url})` }}
                            onClick={(event) => {
                              event.stopPropagation();
                              setPreviewItem(item);
                            }}
                          />
                        ) : (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-full w-full items-center justify-center"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </a>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{item.originalName}</p>
                        <p className="truncate text-sm text-muted-foreground">{item.url}</p>
                        <p className="text-sm text-muted-foreground">
                          {(item.sizeBytes / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          className="hover:text-primary transition-colors p-1"
                          title="Xem"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPreviewItem(item);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="hover:text-primary transition-colors p-1"
                          title="Sao chép URL"
                          onClick={async (event) => {
                            event.stopPropagation();
                            await navigator.clipboard.writeText(item.url);
                            toast.success("Đã sao chép URL.");
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          className="text-destructive/70 hover:text-destructive transition-colors p-1"
                          title="Xóa"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleXóa(item.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4 border-t pt-6">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" /> Trước
                  </Button>

                  <div>
                    Trang {page} / {totalPages}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="flex items-center gap-1"
                  >
                    Tiếp <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewItem(null)}
        >
          <button
            className="absolute top-6 right-6 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            onClick={() => setPreviewItem(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="relative flex max-h-[calc(100vh-32px)] max-w-5xl flex-col overflow-hidden rounded-lg border bg-background" onClick={(e) => e.stopPropagation()}
          >
            <div className="flex min-h-0 items-center justify-center bg-black/5 p-4">
              <img
                src={previewItem.url}
                alt="Preview"
                className="max-h-[48vh] max-w-full object-contain"
              />
            </div>
            <div className="flex max-h-[calc(100vh-32px-48vh)] flex-col gap-4 overflow-y-auto border-t p-5">
              <div>
                <p className="text-xs text-muted-foreground">Tên file</p>
                <p className="break-words">{previewItem.originalName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">URL</p>
                <p className="break-all text-xs">{previewItem.url}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Loại file</p>
                  <p className="text-xs">{previewItem.mimeType || "unknown"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dung lượng</p>
                  <p className="text-xs">{(previewItem.sizeBytes / 1024).toFixed(0)} KB</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ngày tạo</p>
                  <p className="text-xs">{new Date(previewItem.createdAt).toLocaleString("vi-VN")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">File name</p>
                  <p className="break-all text-xs">{previewItem.fileName}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Mở trên trình duyệt"
                  onClick={() => {
                    window.open(previewItem.url, "_blank", "noopener,noreferrer");
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Copy URL"
                  onClick={async () => {
                    await navigator.clipboard.writeText(previewItem.url);
                    toast.success("Đã sao chép URL.");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  title="Xóa"
                  onClick={async () => {
                    const id = previewItem.id;
                    setPreviewItem(null);
                    await handleXóa(id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
