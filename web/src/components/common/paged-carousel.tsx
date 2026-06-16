"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";

type PagedCarouselProps<TItem> = {
  items: TItem[];
  itemsPerPage?: number;
  autoPlayMs?: number;
  className?: string;
  header?: ReactNode;
  actions?: ReactNode;
  renderItem: (item: TItem, index: number, absoluteIndex: number) => ReactNode;
};

function chunkItems<TItem>(items: TItem[], size: number) {
  const chunks: TItem[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function CarouselArrowButton({
  direction,
  onClick,
  disabled,
}: {
  direction: "previous" | "next";
  onClick: () => void;
  disabled: boolean;
}) {
  const isPrevious = direction === "previous";
  const shaftPath = isPrevious ? "M72 12H8" : "M8 12H72";
  const headPathTop = isPrevious ? "M8 12L16 4" : "M72 12L64 4";
  const headPathBottom = isPrevious ? "M8 12L16 20" : "M72 12L64 20";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex h-8 w-20 items-center justify-center disabled:cursor-not-allowed disabled:opacity-35"
      aria-label={isPrevious ? "Nhóm trước" : "Nhóm tiếp theo"}
      disabled={disabled}
    >
      <svg
        viewBox="0 0 80 24"
        aria-hidden="true"
        className="h-6 w-20"
      >
        <path d={shaftPath} fill="none" stroke="#f2bee9" strokeLinecap="round" strokeWidth="2" />
        <path d={headPathTop} fill="none" stroke="#f2bee9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d={headPathBottom} fill="none" stroke="#f2bee9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path
          d={shaftPath}
          fill="none"
          stroke="#b529aa"
          strokeLinecap="round"
          strokeWidth="2"
          className="transition-[stroke-dashoffset] duration-[440ms] ease-out [stroke-dasharray:64] [stroke-dashoffset:52] [transition-delay:120ms] group-hover:[stroke-dashoffset:0] group-hover:[transition-delay:0ms]"
        />
        {[headPathTop, headPathBottom].map((headPath) => (
          <path
            key={headPath}
            d={headPath}
            fill="none"
            stroke="#b529aa"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="transition-[stroke-dashoffset] duration-[240ms] ease-out [stroke-dasharray:12] [stroke-dashoffset:12] [transition-delay:0ms] group-hover:[stroke-dashoffset:0] group-hover:[transition-delay:300ms]"
          />
        ))}
      </svg>
    </button>
  );
}

export function PagedCarousel<TItem>({
  items,
  itemsPerPage = 6,
  autoPlayMs = 8000,
  className,
  header,
  actions,
  renderItem,
}: PagedCarouselProps<TItem>) {
  const pageSize = Math.max(1, itemsPerPage);
  const pages = useMemo(() => chunkItems(items, pageSize), [items, pageSize]);
  const [activePage, setActivePage] = useState(0);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const currentItems = pages[activePage] ?? [];
  const hasMultiplePages = pages.length > 1;

  function goToPreviousPage() {
    if (!hasMultiplePages) {
      return;
    }
    setActivePage((value) => (value - 1 + pages.length) % pages.length);
  }

  function goToNextPage() {
    if (!hasMultiplePages) {
      return;
    }
    setActivePage((value) => (value + 1) % pages.length);
  }

  function goToPage(pageIndex: number) {
    setActivePage(pageIndex);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!hasMultiplePages) {
      return;
    }
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const dragStart = dragStartRef.current;
    dragStartRef.current = null;

    if (!dragStart || !hasMultiplePages) {
      return;
    }

    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;
    const isHorizontalSwipe = Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25;

    if (!isHorizontalSwipe) {
      return;
    }

    if (deltaX < 0) {
      goToNextPage();
    } else {
      goToPreviousPage();
    }
  }

  function handlePointerCancel() {
    dragStartRef.current = null;
  }

  useEffect(() => {
    setActivePage((value) => Math.min(value, Math.max(0, pages.length - 1)));
  }, [pages.length]);

  useEffect(() => {
    if (!hasMultiplePages || autoPlayMs <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setActivePage((value) => (value + 1) % pages.length);
    }, autoPlayMs);

    return () => window.clearTimeout(timer);
  }, [activePage, autoPlayMs, hasMultiplePages, pages.length]);

  if (!currentItems.length) {
    return null;
  }

  return (
    <div className={className}>
      {(header || actions) ? (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>{header}</div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}

      <div
        key={activePage}
        className="grid cursor-grab touch-pan-y select-none gap-4 active:cursor-grabbing md:grid-cols-2 xl:grid-cols-3"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {currentItems.map((item, index) => renderItem(item, index, activePage * pageSize + index))}
      </div>

      {hasMultiplePages ? (
        <div className="mt-7 flex items-center justify-center gap-4">
          <CarouselArrowButton direction="previous" onClick={goToPreviousPage} disabled={!hasMultiplePages} />
          <div className="flex items-center gap-2" aria-label="Chọn nhóm hiển thị">
            {pages.map((_page, pageIndex) => {
              const isActive = pageIndex === activePage;

              return (
                <button
                  key={pageIndex}
                  type="button"
                  onClick={() => goToPage(pageIndex)}
                  className={[
                    "h-1.5 rounded-full transition-all duration-300",
                    isActive ? "w-7 bg-[#b529aa]" : "w-1.5 bg-[#f2bee9] hover:bg-[#d94dce]",
                  ].join(" ")}
                  aria-label={`Hiển thị nhóm ${pageIndex + 1}`}
                  aria-current={isActive ? "true" : undefined}
                />
              );
            })}
          </div>
          <CarouselArrowButton direction="next" onClick={goToNextPage} disabled={!hasMultiplePages} />
        </div>
      ) : null}
    </div>
  );
}
