"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Video } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ReviewMediaItem = {
  type: "image" | "video";
  src: string;
};

export function ReviewMediaPreview({ items }: { items: ReviewMediaItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeItem = activeIndex === null ? null : items[activeIndex] ?? null;
  const canNavigate = items.length > 1;

  function goToPrevious() {
    setActiveIndex((current) => {
      if (current === null) {
        return current;
      }

      return (current - 1 + items.length) % items.length;
    });
  }

  function goToNext() {
    setActiveIndex((current) => {
      if (current === null) {
        return current;
      }

      return (current + 1) % items.length;
    });
  }

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrevious();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, items.length]);

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item, index) => (
          <button
            key={`${item.type}-${item.src}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="group relative aspect-square w-[60px] overflow-hidden rounded-sm border bg-muted"
            aria-label={item.type === "video" ? "Xem video đánh giá" : "Xem ảnh đánh giá"}
          >
            <Image
              src={item.src}
              alt={item.type === "video" ? "Video đánh giá" : "Ảnh đánh giá"}
              width={160}
              height={160}
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
            {item.type === "video" ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white">
                <Video className="h-5 w-5 fill-white" aria-hidden="true" />
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <Dialog open={activeItem !== null} onOpenChange={(open) => !open && setActiveIndex(null)}>
        <DialogContent className="max-w-3xl rounded-sm p-4">
          <DialogHeader>
            <DialogTitle className="text-base">{activeItem?.type === "video" ? "Video đánh giá" : "Ảnh đánh giá"}</DialogTitle>
          </DialogHeader>
          {activeItem ? (
            <div>
              <div className="relative overflow-hidden rounded-sm border bg-muted">
                {canNavigate ? (
                  <>
                    <button
                      type="button"
                      onClick={goToPrevious}
                      className="absolute left-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border bg-white/90 text-primary transition hover:bg-primary hover:text-primary-foreground"
                      aria-label="Xem media trước"
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={goToNext}
                      className="absolute right-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border bg-white/90 text-primary transition hover:bg-primary hover:text-primary-foreground"
                      aria-label="Xem media tiếp theo"
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </>
                ) : null}

                {activeItem.type === "video" ? (
                  <div className="relative aspect-video">
                    <Image
                      src={activeItem.src}
                      alt="Video đánh giá"
                      fill
                      sizes="(max-width: 768px) 100vw, 768px"
                      className="object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white">
                      <Video className="h-10 w-10 fill-white" aria-hidden="true" />
                    </span>
                  </div>
                ) : (
                  <Image
                    src={activeItem.src}
                    alt="Ảnh đánh giá"
                    width={1200}
                    height={900}
                    className="max-h-[72vh] w-full object-contain"
                  />
                )}
              </div>

              {canNavigate ? (
                <div className="mt-3 flex items-center justify-center gap-2">
                  {items.map((item, index) => (
                    <button
                      key={`${item.type}-${item.src}-dot-${index}`}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`h-1.5 rounded-full transition ${
                        index === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-primary/40"
                      }`}
                      aria-label={`Xem media ${index + 1}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
