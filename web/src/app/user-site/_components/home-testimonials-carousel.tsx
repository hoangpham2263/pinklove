"use client";

import Image from "next/image";
import { useState } from "react";
import { Quote, Star } from "lucide-react";
import { PagedCarousel } from "@/components/common/paged-carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type HomeTestimonialItem = {
  quote: string;
  name: string;
  role: string;
  avatar?: string;
  rating: number;
};

function TestimonialAvatar({
  item,
  size = "md",
}: {
  item: HomeTestimonialItem;
  size?: "md" | "lg";
}) {
  const sizeClassName = size === "lg" ? "size-16" : "size-12";

  if (item.avatar) {
    return (
      <Image
        src={item.avatar}
        alt={item.name}
        width={size === "lg" ? 64 : 48}
        height={size === "lg" ? 64 : 48}
        className={`${sizeClassName} rounded-full object-cover`}
      />
    );
  }

  return (
    <span className={`flex ${sizeClassName} items-center justify-center rounded-full bg-[#fff5fd] text-base font-semibold text-[#b529aa]`}>
      {item.name.slice(0, 1)}
    </span>
  );
}

function RatingStars({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <div className={`flex gap-1 text-[#ff6ff5] ${className}`} aria-label={`${rating} sao`}>
      {Array.from({ length: rating }).map((_, starIndex) => (
        <Star key={starIndex} className="size-4 fill-current" aria-hidden="true" />
      ))}
    </div>
  );
}

export function HomeTestimonialsCarousel({ testimonials }: { testimonials: HomeTestimonialItem[] }) {
  const [selectedTestimonial, setSelectedTestimonial] = useState<HomeTestimonialItem | null>(null);

  return (
    <>
      <PagedCarousel
        itemsPerPage={3}
        gridClassName="grid cursor-grab touch-pan-y select-none gap-5 active:cursor-grabbing md:grid-cols-3"
      >
        {testimonials.map((item, index) => (
          <button
            key={`${item.name}-${index}`}
            type="button"
            className="group relative flex min-h-72 w-full flex-col rounded-[24px] border border-[#f8d8f4] bg-white p-6 text-left shadow-[0_14px_34px_rgba(35,31,39,0.07)] outline-none transition hover:-translate-y-1 hover:border-[#ff6ff5] hover:shadow-[0_22px_48px_rgba(217,77,206,0.14)] focus-visible:border-[#ff6ff5] focus-visible:ring-2 focus-visible:ring-[#ff6ff5]/35"
            onClick={() => setSelectedTestimonial(item)}
          >
            <Quote className="size-9 text-[#ff6ff5]" aria-hidden="true" />
            <RatingStars rating={item.rating} className="mt-4" />
            <p className="mt-5 line-clamp-5 flex-1 text-sm leading-7 text-stone-600 md:text-base">{item.quote}</p>
            <div className="mt-6 flex items-center gap-3 border-t border-[#f8d8f4] pt-5">
              <TestimonialAvatar item={item} />
              <div className="min-w-0">
                <h3 className="font-semibold text-stone-950">{item.name}</h3>
                {item.role ? <p className="text-sm text-stone-500">{item.role}</p> : null}
              </div>
            </div>
          </button>
        ))}
      </PagedCarousel>

      <Dialog
        open={Boolean(selectedTestimonial)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTestimonial(null);
          }
        }}
      >
        {selectedTestimonial ? <TestimonialDetailDialog item={selectedTestimonial} /> : null}
      </Dialog>
    </>
  );
}

function TestimonialDetailDialog({ item }: { item: HomeTestimonialItem }) {
  return (
    <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[24px] border-[#f8d8f4] p-0 sm:max-w-2xl">
      <div className="bg-[#fff8fd] px-6 py-6 sm:px-8">
        <DialogHeader>
          <DialogTitle className="pr-8 text-2xl text-stone-950">Cảm nhận từ {item.name}</DialogTitle>
          <DialogDescription>{item.role || "Khách hàng PinkLove"}</DialogDescription>
        </DialogHeader>
      </div>
      <div className="space-y-6 px-6 pb-7 pt-2 sm:px-8">
        <div className="flex items-center gap-4">
          <TestimonialAvatar item={item} size="lg" />
          <div>
            <h3 className="text-lg font-semibold text-stone-950">{item.name}</h3>
            {item.role ? <p className="text-sm text-stone-500">{item.role}</p> : null}
            <RatingStars rating={item.rating} className="mt-2" />
          </div>
        </div>
        <div className="rounded-2xl border border-[#f8d8f4] bg-white p-5">
          <Quote className="mb-4 size-8 text-[#ff6ff5]" aria-hidden="true" />
          <p className="whitespace-pre-line text-base leading-8 text-stone-700">{item.quote}</p>
        </div>
      </div>
    </DialogContent>
  );
}
