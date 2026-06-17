"use client";

import { useEffect, useMemo, useRef, useState, Children, type PointerEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PagedCarouselProps<TItem> = {
  items?: TItem[];
  itemsPerPage?: number;
  autoPlayMs?: number;
  controlsVariant?: "arrows" | "buttons";
  controlsPosition?: "footer" | "header";
  className?: string;
  gridClassName?: string;
  header?: ReactNode;
  actions?: ReactNode;
  renderItem?: (item: TItem, index: number, absoluteIndex: number) => ReactNode;
  children?: ReactNode;
};

function chunkArray<T>(array: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < array.length; index += size) {
    chunks.push(array.slice(index, index + size));
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

function CarouselIconButton({
  direction,
  onClick,
  disabled,
}: {
  direction: "previous" | "next";
  onClick: () => void;
  disabled: boolean;
}) {
  const isPrevious = direction === "previous";
  const Icon = isPrevious ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex size-10 items-center justify-center rounded-full border border-[#f8d8f4] bg-white text-stone-950 shadow-[0_12px_28px_rgba(35,31,39,0.08)] transition hover:-translate-y-0.5 hover:border-[#ff6ff5] hover:bg-[#fff5fd] hover:text-[#b529aa] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0 lg:size-11"
      aria-label={isPrevious ? "Nhóm trước" : "Nhóm tiếp theo"}
      disabled={disabled}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  );
}

export function PagedCarousel<TItem>({
  items,
  itemsPerPage = 6,
  autoPlayMs = 8000,
  controlsVariant = "arrows",
  controlsPosition = "footer",
  className,
  gridClassName = "grid cursor-grab touch-pan-y select-none gap-4 active:cursor-grabbing md:grid-cols-2 xl:grid-cols-3",
  header,
  actions,
  renderItem,
  children,
}: PagedCarouselProps<TItem>) {
  const pageSize = Math.max(1, itemsPerPage);
  
  const resolvedItems = useMemo<Array<TItem | ReactNode>>(() => {
    if (children) {
      return Children.toArray(children);
    }
    return items || [];
  }, [items, children]);

  const pages = useMemo(() => chunkArray(resolvedItems, pageSize), [resolvedItems, pageSize]);
  const [activePage, setActivePage] = useState(0);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const safeActivePage = Math.min(activePage, Math.max(0, pages.length - 1));
  const currentItems = pages[safeActivePage] ?? [];
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

  const arrowControls = hasMultiplePages ? (
    <div className="flex items-center gap-3">
      {controlsVariant === "buttons" ? (
        <CarouselIconButton direction="previous" onClick={goToPreviousPage} disabled={!hasMultiplePages} />
      ) : (
        <CarouselArrowButton direction="previous" onClick={goToPreviousPage} disabled={!hasMultiplePages} />
      )}
      {controlsVariant === "buttons" ? (
        <CarouselIconButton direction="next" onClick={goToNextPage} disabled={!hasMultiplePages} />
      ) : (
        <CarouselArrowButton direction="next" onClick={goToNextPage} disabled={!hasMultiplePages} />
      )}
    </div>
  ) : null;

  const pagination = hasMultiplePages ? (
    <div className="flex items-center gap-2" aria-label="Chọn nhóm hiển thị">
      {pages.map((_page, pageIndex) => {
        const isActive = pageIndex === safeActivePage;

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
  ) : null;

  const footerControls = hasMultiplePages ? (
    <div className="mt-7 flex items-center justify-center gap-4">
      {controlsPosition === "footer" ? arrowControls : null}
      {pagination}
    </div>
  ) : null;

  return (
    <div className={className}>
      {(header || actions || (controlsPosition === "header" && arrowControls)) ? (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 flex-1">{header}</div>
          {(actions || controlsPosition === "header") ? (
            <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
              {actions}
              {controlsPosition === "header" ? arrowControls : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        key={safeActivePage}
        className={gridClassName}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {children
          ? (currentItems as ReactNode[])
          : currentItems.map((item, index) =>
              renderItem ? renderItem(item as TItem, index, safeActivePage * pageSize + index) : null
            )}
      </div>

      {footerControls}
    </div>
  );
}
