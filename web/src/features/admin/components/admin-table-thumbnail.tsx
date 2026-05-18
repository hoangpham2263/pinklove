import { cn } from "@/lib/utils";

type AdminTableThumbnailProps = {
  src?: string | null;
  alt: string;
  className?: string;
};

export function AdminTableThumbnail({ src, alt, className }: AdminTableThumbnailProps) {
  return (
    <div className={cn("h-10 w-10 overflow-hidden rounded-md border bg-muted/40", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">—</div>
      )}
    </div>
  );
}
