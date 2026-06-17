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

function HomeStatCard({ item, active }: { item: HomeStatsItem; active: boolean }) {
  const value = useCountUp(item.value, active);

  return (
    <article className="group relative min-h-36 overflow-hidden rounded-lg border border-[#f8d8f4] bg-white/92 p-5 shadow-[0_14px_34px_rgba(35,31,39,0.07)] transition duration-300 hover:-translate-y-1 hover:border-[#ff6ff5] hover:shadow-[0_22px_48px_rgba(217,77,206,0.14)] sm:p-6 lg:min-h-40 lg:p-7">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#ff95f8_0%,#ff6ff5_45%,#f8d8f4_100%)] opacity-75 transition-opacity group-hover:opacity-100" />
      <div className="flex h-full flex-col justify-between gap-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{item.label}</p>
        <div>
          <p
            className={[
              "bg-[linear-gradient(90deg,#3B2A33_0%,#B529AA_54%,#FF6FF5_100%)] bg-clip-text text-4xl font-semibold leading-none text-transparent sm:text-5xl lg:text-6xl",
              active ? "opacity-100" : "opacity-70",
            ].join(" ")}
          >
            {value}
          </p>
          {item.description ? <p className="mt-3 text-sm leading-6 text-stone-600">{item.description}</p> : null}
        </div>
      </div>
    </article>
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {items.map((item) => (
              <HomeStatCard key={`${item.label}-${item.value}`} item={item} active={active} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
