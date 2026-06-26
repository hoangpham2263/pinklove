"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type HomeStatsItem = {
  label: string;
  value: string;
  description?: string;
};

type ParsedStatValue = {
  prefix: string;
  target: number;
  suffix: string;
  decimals: number;
};

function parseStatValue(value: string): ParsedStatValue | null {
  const match = value.trim().match(/^([^0-9-]*)(-?\d+(?:[.,]\d+)?)(.*)$/);
  if (!match) {
    return null;
  }

  const rawNumber = match[2].replace(",", ".");
  const target = Number(rawNumber);
  if (!Number.isFinite(target)) {
    return null;
  }

  const decimalPart = rawNumber.split(".")[1];

  return {
    prefix: match[1],
    target,
    suffix: match[3],
    decimals: decimalPart?.length ?? 0,
  };
}

function useCountUp(value: string, active: boolean) {
  const parsed = useMemo(() => parseStatValue(value), [value]);
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    if (!parsed || !active) {
      return undefined;
    }

    const parsedValue = parsed;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frameId = window.requestAnimationFrame(() => setCurrentValue(parsedValue.target));
      return () => window.cancelAnimationFrame(frameId);
    }

    let frameId = 0;
    const duration = 1200;
    const startTime = window.performance.now();

    function tick(now: number) {
      const progress = Math.min(1, (now - startTime) / duration);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setCurrentValue(parsedValue.target * easedProgress);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    }

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [active, parsed]);

  if (!parsed) {
    return value;
  }

  if (!active) {
    return `${parsed.prefix}0${parsed.suffix}`;
  }

  return `${parsed.prefix}${currentValue.toFixed(parsed.decimals)}${parsed.suffix}`;
}

function HomeStatCell({ item, active, index }: { item: HomeStatsItem; active: boolean; index: number }) {
  const value = useCountUp(item.value, active);

  return (
    <div
      className={[
        "flex min-h-36 w-full flex-col items-center justify-center px-5 py-7 text-center sm:w-1/2 lg:min-h-40 lg:w-1/4 lg:px-7 lg:py-8",
        index > 0 ? "border-t border-[#f8d8f4]/80 sm:border-t-0" : "",
        index % 2 === 1 ? "sm:border-l sm:border-[#f8d8f4]/80" : "",
        index > 1 ? "sm:border-t sm:border-[#f8d8f4]/80 lg:border-t-0" : "",
        index > 0 ? "lg:border-l lg:border-[#f8d8f4]/80" : "",
      ].filter(Boolean).join(" ")}
    >
      <p
        className={[
          "bg-[linear-gradient(90deg,#3B2A33_0%,#B529AA_54%,#FF6FF5_100%)] bg-clip-text text-4xl font-semibold leading-none text-transparent sm:text-5xl lg:text-6xl",
          active ? "opacity-100" : "opacity-70",
        ].join(" ")}
      >
        {value}
      </p>
      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-stone-600 sm:text-base">
        {item.label}
      </p>
      </div>
  );
}

export function HomeStatsSection({
  items,
  className,
}: {
  items: HomeStatsItem[];
  className?: string;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || active) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, [active]);

  if (!items.length) {
    return null;
  }

  return (
    <section ref={sectionRef} className={className}>
      <div className="container mx-auto px-4">
        <div className="relative z-10">
          <div className="relative overflow-hidden rounded-2xl border border-[#f8d8f4] bg-white/92 shadow-[0_18px_44px_rgba(35,31,39,0.08)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#ff95f8_0%,#ff6ff5_45%,#f8d8f4_100%)] opacity-85" />
            <div className="flex flex-wrap justify-center">
              {items.map((item, index) => (
                <HomeStatCell key={`${item.label}-${item.value}`} item={item} active={active} index={index} />
            ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
