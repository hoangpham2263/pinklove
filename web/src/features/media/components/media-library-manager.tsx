"use client";

import { useState } from"react";
import { useDropzone } from"react-dropzone";
import { X, Copy, Trash2, Eye, ChevronLeft, ChevronRight } from"lucide-react";

import { Button } from"@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import type { MediaAsset } from"../types";

type UploadState ="idle" |"uploading";

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
 const [previewUrl, setPreviewUrl] = useState<string | null>(null);

 const totalPages = Math.ceil(total / limit);

 const fetchItems = async (targetPage: number, targetLimit: number) => {
 try {
  const response = await fetch(`/api/media?page=${targetPage}&limit=${targetLimit}`);
  if (response.ok) {
  const data = await response.json();
  setItems(data.items);
  setTotal(data.total);
  setPage(data.page);
  setLimit(data.limit);
  }
 } catch (error) {
  console.error("Failed to fetch media items:", error);
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

 async function uploadFiles(files: File[]) {
 if (files.length === 0) return;

 setUploadState("uploading");
 setErrorMessage(null);
 try {
  for (const file of files) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/media", {
   method:"POST",
   body: formData,
  });

  if (!response.ok) {
   const data = (await response.json()) as { message?: string };
   throw new Error(data.message ?? `Tải lên thất bại cho ${file.name}`);
  }
  }
  void fetchItems(1, limit);
 } catch (error) {
  const message = error instanceof Error ? error.message :"Tải lên thất bại.";
  setErrorMessage(message);
 } finally {
  setUploadState("idle");
 }
 }

 const { getRootProps, getInputProps, isDragActive } = useDropzone({
 accept: {
"image/jpeg": [],
"image/png": [],
"image/webp": [],
"image/gif": [],
 },
 multiple: true,
 disabled: uploadState ==="uploading",
 onDrop: (acceptedFiles) => {
  void uploadFiles(acceptedFiles);
 },
 });

 async function handleXóa(id: string) {
 if (!confirm("Bạn có chắc chắn muốn xóa ảnh này không?")) return;
 const response = await fetch(`/api/media?id=${id}`, { method:"DELETE" });
 if (!response.ok) return;
 void fetchItems(page, limit);
 }

 return (
 <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
  <Card>
  <CardHeader>
   <CardTitle>Tải Ảnh lên</CardTitle>
  </CardHeader>
  <CardContent className="flex flex-col gap-3">
   <div
   {...getRootProps()}
   className={`rounded-lg border border-dashed p-10 text-center transition-colors cursor-pointer ${
    isDragActive ?"border-primary bg-primary/5" :"border-border bg-muted/20"
   } ${uploadState ==="uploading" ?"opacity-50 cursor-not-allowed" :""}`}
   >
   <input {...getInputProps()} />
   <div className="flex flex-col items-center gap-2">
    {uploadState ==="uploading" ? (
    <>
     <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
     <p>Uploading images...</p>
    </>
    ) : (
    <>
     <p>
     {isDragActive
      ?"Drop images here..."
      :"Drag images here, or click to select files"}
     </p>
     <p className="opacity-70">
     Support JPEG, PNG, WEBP, GIF
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
   <CardTitle>Library ({total})</CardTitle>
   <div className="flex items-center gap-4">
   <div className="flex items-center gap-2">
    <span>Show:</span>
    <select 
    value={limit} 
    onChange={(e) => handleLimitChange(Number(e.target.value))}
    className="rounded border bg-background px-2 py-1 outline-none"
    >
    <option value={100}>100</option>
    <option value={200}>200</option>
    <option value={500}>500</option>
    <option value={1000}>1000</option>
    </select>
   </div>
   </div>
  </CardHeader>
  <CardContent>
   {items.length === 0 ? (
   <p>No media uploaded yet.</p>
   ) : (
   <>
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
    {items.map((item) => (
     <article key={item.id} className="group relative overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md">
     <div className="relative aspect-square overflow-hidden bg-muted">
      <div
      className="h-full w-full cursor-pointer bg-cover bg-center transition-transform group-hover:scale-105"
      style={{ backgroundImage: `url(${item.url})` }}
      onClick={() => setPreviewUrl(item.url)}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer pointer-events-none">
      <Eye className="h-6 w-6 text-white drop-shadow-md" />
      </div>
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
       alert("URL copied!");
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

    {/* Pagination Controls */}
    {totalPages > 1 && (
    <div className="mt-8 flex items-center justify-center gap-4 border-t pt-6">
     <Button
     variant="outline"
     onClick={() => handlePageChange(page - 1)}
     disabled={page === 1}
     className="flex items-center gap-1"
     >
     <ChevronLeft className="h-4 w-4" /> Prev
     </Button>
     
     <div>
     Page {page} of {totalPages}
     </div>

     <Button
     variant="outline"
     onClick={() => handlePageChange(page + 1)}
     disabled={page === totalPages}
     className="flex items-center gap-1"
     >
     Next <ChevronRight className="h-4 w-4" />
     </Button>
    </div>
    )}
   </>
   )}
  </CardContent>
  </Card>

  {/* Preview Modal */}
  {previewUrl && (
  <div 
   className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
   onClick={() => setPreviewUrl(null)}
  >
   <button 
   className="absolute top-6 right-6 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
   onClick={() => setPreviewUrl(null)}
   >
   <X className="h-6 w-6" />
   </button>
   <div 
   className="relative max-h-full max-w-full overflow-hidden rounded-lg shadow-2xl"
   onClick={(e) => e.stopPropagation()}
   >
   <img 
    src={previewUrl} 
    alt="Preview" 
    className="max-h-[90vh] max-w-full object-contain"
   />
   </div>
  </div>
  )}
 </section>
 );
}