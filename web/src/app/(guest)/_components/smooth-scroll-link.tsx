"use client";

import { useRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type SmoothScrollLinkProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick"> & {
  targetId?: string;
  pixelsPerSecond?: number;
  children: ReactNode;
};

export function SmoothScrollLink({
  targetId,
  pixelsPerSecond = 950,
  children,
  ...props
}: SmoothScrollLinkProps) {
  const animationRef = useRef<number | null>(null);

  const startScroll = () => {
    if (animationRef.current) {
      window.cancelAnimationFrame(animationRef.current);
    }

    const scroller = document.scrollingElement || document.documentElement;
    const html = document.documentElement;
    const previousScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";

    const startY = scroller.scrollTop;
    const maxY = Math.max(scroller.scrollHeight - window.innerHeight, 0);
    const target = targetId ? document.getElementById(targetId) : null;
    const targetY = target
      ? Math.min(target.getBoundingClientRect().top + startY, maxY)
      : maxY;
    const distance = targetY - startY;

    if (Math.abs(distance) < 1) {
      scroller.scrollTop = targetY;
      html.style.scrollBehavior = previousScrollBehavior;
      return;
    }

    const direction = distance > 0 ? 1 : -1;
    let previousTime = performance.now();
    let currentY = startY;

    const finish = () => {
      scroller.scrollTop = targetY;
      html.style.scrollBehavior = previousScrollBehavior;
      animationRef.current = null;
    };

    const step = (currentTime: number) => {
      const deltaSeconds = Math.max((currentTime - previousTime) / 1000, 0);
      previousTime = currentTime;
      currentY += direction * pixelsPerSecond * deltaSeconds;

      const reachedTarget = direction > 0 ? currentY >= targetY : currentY <= targetY;
      if (reachedTarget) {
        finish();
        return;
      }

      scroller.scrollTop = currentY;
      animationRef.current = window.requestAnimationFrame(step);
    };

    animationRef.current = window.requestAnimationFrame(step);
  };

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        startScroll();
      }}
      {...props}
    >
      {children}
    </button>
  );
}
