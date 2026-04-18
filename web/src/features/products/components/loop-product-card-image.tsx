"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type LoopProductCardImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export function LoopProductCardImage({ src, alt, className }: LoopProductCardImageProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [imageRatio, setImageRatio] = useState<number | null>(null);
  const [overflowY, setOverflowY] = useState(0);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !imageRatio) {
      return;
    }

    const updateOverflow = () => {
      const frameWidth = frame.clientWidth;
      const frameHeight = frame.clientHeight;
      if (!frameWidth || !frameHeight) {
        setOverflowY(0);
        return;
      }

      const renderedHeight = frameWidth / imageRatio;
      setOverflowY(Math.max(renderedHeight - frameHeight, 0));
    };

    updateOverflow();

    const observer = new ResizeObserver(updateOverflow);
    observer.observe(frame);

    return () => observer.disconnect();
  }, [imageRatio]);

  return (
    <div
      ref={frameRef}
      className="absolute inset-0 overflow-hidden"
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      <Image
        src={src}
        alt={alt}
        width={900}
        height={1800}
        sizes="240px"
        onLoad={(event) => {
          const image = event.currentTarget;
          if (image.naturalWidth && image.naturalHeight) {
            setImageRatio(image.naturalWidth / image.naturalHeight);
          }
        }}
        className={cn(
          "h-auto w-full max-w-none will-change-transform transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          className
        )}
        style={{
          transform: `translateY(-${isHovered ? overflowY : 0}px)`,
        }}
      />
    </div>
  );
}
