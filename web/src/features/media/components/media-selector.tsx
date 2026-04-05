"use client";

import { useState, useEffect } from"react";
import { useDropzone } from"react-dropzone";
import { Image as ImageIcon, Upload, X, Search, CheckCircle2 } from"lucide-react";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import {
 Sheet,
 SheetContent,
 SheetHeader,
 SheetTitle,
 SheetTrigger,
} from"@/components/ui/sheet";
import type { MediaAsset } from"../types";

type MediaSelectorProps = {
 value: string;
 onChange: (url: string) => void;
 label?: string;
};

export function MediaSelector({ value, onChange, label ="Featured Image" }: MediaSelectorProps) {
 const [isOpen, setIsOpen] = useState(false);
 const [items, setItems] = useState<MediaAsset[]>([]);
 const [loading, setLoading] = useState(false);
 const [uploading, setUploading] = useState(false);
 const [search, setSearch] = useState("");

 const fetchMedia = async () => {
 setLoading(true);
 try {
  const response = await fetch("/api/media?limit=50");
  if (response.ok) {
  const data = await response.json();
  setItems(data.items);
  }
 } catch (error) {
  console.error("Failed to fetch media:", error);
 } finally {
  setLoading(false);
 }
 };

 useEffect(() => {
 if (isOpen) {
  void fetchMedia();
 }
 }, [isOpen]);

 const onDrop = async (acceptedFiles: File[]) => {
 if (acceptedFiles.length === 0) return;
 setUploading(true);
 try {
  for (const file of acceptedFiles) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/media", {
   method:"POST",
   body: formData,
  });
  if (!response.ok) throw new Error("Upload failed");
  }
  await fetchMedia();
 } catch (error) {
  console.error("Upload error:", error);
 } finally {
  setUploading(false);
 }
 };

 const { getRootProps, getInputProps, isDragActive } = useDropzone({
 onDrop,
 accept: {"image/*": [] },
 multiple: false
 });

 const filteredItems = items.filter(item => 
 item.originalName.toLowerCase().includes(search.toLowerCase())
 );

 return (
 <div className="space-y-2">
  <Sheet open={isOpen} onOpenChange={setIsOpen}>
  <div className="flex flex-col gap-2">
   {value ? (
   <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
    <img src={value} alt="Selected" className="h-full w-full object-cover" />
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
    <div className="flex gap-2">
     <SheetTrigger render={<Button variant="secondary" size="sm">Change</Button>} />
     <Button variant="destructive" size="sm" onClick={() => onChange("")}>
     Remove
     </Button>
    </div>
    </div>
   </div>
   ) : (
   <SheetTrigger render={
    <button className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary/50 hover:bg-muted/50">
    <ImageIcon className="h-8 w-8 text-muted-foreground" />
    <span className="font-medium text-muted-foreground">Select or Upload Image</span>
    </button>
   } />
   )}
   <input type="hidden" name="ogImage" value={value} />
  </div>

  <SheetContent side="right" className="sm:max-w-2xl flex flex-col h-full">
   <SheetHeader className="pb-4 border-b">
   <SheetTitle>Media Library</SheetTitle>
   </SheetHeader>
   
   <div className="flex-1 overflow-y-auto py-6 space-y-6">
   {/* Upload Area */}
   <div
    {...getRootProps()}
    className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
    isDragActive ?"border-primary bg-primary/5" :"border-muted-foreground/25 hover:bg-muted/50"
    } ${uploading ?"opacity-50 cursor-not-allowed" :""}`}
   >
    <input {...getInputProps()} />
    <div className="flex flex-col items-center gap-2">
    {uploading ? (
     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    ) : (
     <Upload className="h-8 w-8 text-muted-foreground" />
    )}
    <p className="font-medium">
     {uploading ?"Uploading..." :"Click or drag to upload new image"}
    </p>
    </div>
   </div>

   {/* Search & Library */}
   <div className="space-y-4">
    <div className="relative">
    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
    <Input
     placeholder="Search images..."
     className="pl-9"
     value={search}
     onChange={(e) => setSearch(e.target.value)}
    />
    </div>

    {loading ? (
    <div className="flex h-40 items-center justify-center">
     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
    ) : (
    <div className="grid grid-cols-3 gap-4">
     {filteredItems.map((item) => (
     <div
      key={item.id}
      className={`group relative aspect-square cursor-pointer overflow-hidden rounded-md border transition-all hover:ring-2 hover:ring-primary ${
      value === item.url ?"ring-2 ring-primary" :""
      }`}
      onClick={() => {
      onChange(item.url);
      setIsOpen(false);
      }}
     >
      <img
      src={item.url}
      alt={item.originalName}
      className="h-full w-full object-cover transition-transform group-hover:scale-110"
      />
      {value === item.url && (
      <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
       <CheckCircle2 className="h-8 w-8 text-primary fill-white" />
      </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 px-2 opacity-0 transition-opacity group-hover:opacity-100">
      <p className="truncate text-[10px] text-white">{item.originalName}</p>
      </div>
     </div>
     ))}
    </div>
    )}
   </div>
   </div>
  </SheetContent>
  </Sheet>
 </div>
 );
}
