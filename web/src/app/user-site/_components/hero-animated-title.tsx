"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

const ROTATING_SEGMENT_INTERVAL_MS = 2600;
const ROTATING_SEGMENT_TRANSITION_MS = 720;

function renderAnimatedCharacters(text: string, mode: "enter" | "exit") {
  return Array.from(text).map((character, index) => (
    <span
      key={`${mode}-${character}-${index}`}
      className={`hero-title-rotating-char hero-title-rotating-char-${mode}`}
      style={{ "--hero-char-index": index } as CSSProperties}
    >
      {character === " " ? "\u00A0" : character}
    </span>
  ));
}

export function HeroAnimatedTitle({
  topLine,
  lineOnePrefix,
  lineOneRotating,
  lineOneSuffix,
  lineTwo,
  fallbackTitle,
  className = "",
}: {
  topLine?: string;
  lineOnePrefix?: string;
  lineOneRotating?: string;
  lineOneSuffix?: string;
  lineTwo?: string;
  fallbackTitle?: string;
  className?: string;
}) {
  const structuredTopLine = topLine?.trim() || "";
  const rotatingOptions = useMemo(
    () =>
      (lineOneRotating || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    [lineOneRotating]
  );
  const [activeRotatingIndex, setActiveRotatingIndex] = useState(0);
  const [exitingRotatingText, setExitingRotatingText] = useState<string | null>(null);
  const safeActiveRotatingIndex = rotatingOptions.length > 0 ? activeRotatingIndex % rotatingOptions.length : 0;

  useEffect(() => {
    if (rotatingOptions.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setExitingRotatingText(rotatingOptions[safeActiveRotatingIndex] || null);
      setActiveRotatingIndex((currentIndex) => (currentIndex + 1) % rotatingOptions.length);
    }, ROTATING_SEGMENT_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [rotatingOptions, safeActiveRotatingIndex]);

  useEffect(() => {
    if (!exitingRotatingText) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setExitingRotatingText(null);
    }, ROTATING_SEGMENT_TRANSITION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [exitingRotatingText]);

  const rotatingSegment = rotatingOptions.length ? rotatingOptions[safeActiveRotatingIndex] || "" : lineOneRotating?.trim() || "";
  const structuredLineOne = [lineOnePrefix?.trim(), rotatingSegment].filter(Boolean).join(" ").trim();
  const structuredLineTwoPrefix = lineOneSuffix?.trim() || "";
  const structuredLineTwoBrand = lineTwo?.trim() || "";
  const structuredLineTwo = [structuredLineTwoPrefix, structuredLineTwoBrand].filter(Boolean).join(" ").trim();
  const hasStructuredTitle = Boolean(structuredTopLine || structuredLineOne || structuredLineTwo);
  const fallbackLines = useMemo(
    () =>
      (fallbackTitle || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    [fallbackTitle]
  );
  const displayLines = hasStructuredTitle
    ? [structuredLineOne, structuredLineTwo].filter(Boolean)
    : fallbackLines.length
      ? fallbackLines
      : [fallbackTitle || ""];
  if (hasStructuredTitle) {
    return (
      <h1 className={className}>
        {structuredTopLine ? (
          <span className="block w-fit max-w-full mx-auto lg:mx-0">
            <span className="text-black">{structuredTopLine}</span>
          </span>
        ) : null}

        {structuredLineOne ? (
          <span className="block w-fit max-w-full whitespace-nowrap mx-auto lg:mx-0">
            {lineOnePrefix?.trim() ? <span>{lineOnePrefix.trim()}</span> : null}
            {lineOnePrefix?.trim() && rotatingSegment ? " " : null}
            {rotatingSegment || rotatingOptions.length ? (
              <span className="hero-title-rotating-slot inline-grid align-baseline font-bold">
                {exitingRotatingText ? (
                  <span className="hero-title-rotating-text hero-title-rotating-text-exit font-['Trebuchet_MS','Gill_Sans','Segoe_UI',sans-serif] text-[0.9em] leading-none tracking-[0.01em] text-[#d94dce] italic">
                    {renderAnimatedCharacters(exitingRotatingText, "exit")}
                  </span>
                ) : null}
                <span
                  key={rotatingSegment}
                  className="hero-title-rotating-text hero-title-rotating-text-enter font-['Trebuchet_MS','Gill_Sans','Segoe_UI',sans-serif] text-[0.9em] leading-none tracking-[0.01em] text-[#d94dce] italic"
                >
                  {renderAnimatedCharacters(rotatingSegment, "enter")}
                </span>
              </span>
            ) : null}
          </span>
        ) : null}

        {structuredLineTwo ? (
          <span className="block w-fit max-w-full mx-auto lg:mx-0">
            {structuredLineTwoPrefix ? <span className="text-black">{structuredLineTwoPrefix}</span> : null}
            {structuredLineTwoPrefix && structuredLineTwoBrand ? " " : null}
            {structuredLineTwoBrand ? (
              <span className="relative inline-block align-baseline">
                <span className="hero-title-brand-line block font-bold">{structuredLineTwoBrand}</span>
                <span
                  aria-hidden="true"
                  className="hero-title-light-sweep pointer-events-none absolute inset-0 block font-bold text-transparent"
                >
                  {structuredLineTwoBrand}
                </span>
              </span>
            ) : null}
          </span>
        ) : null}
      </h1>
    );
  }

  return (
    <h1 className={className}>
      {displayLines.map((line, index) => (
        <span key={`${line}-${index}`} className="relative block w-fit max-w-full mx-auto lg:mx-0">
          <span className={`block ${index === 1 ? "hero-title-brand-line font-bold" : "text-black"}`}>{line}</span>
          {index === 1 ? (
            <span
              aria-hidden="true"
              className="hero-title-light-sweep pointer-events-none absolute inset-0 block font-bold text-transparent"
            >
              {line}
            </span>
          ) : null}
        </span>
      ))}
    </h1>
  );
}
