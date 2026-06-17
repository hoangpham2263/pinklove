"use client";

import { useEffect, useRef, type ReactNode } from "react";

type AdEventPayload = {
  kind: "ad" | "provider-promotion";
  id: string;
  providerId?: string;
  eventType: "impression" | "click";
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
};

type AdEventTrackerProps = {
  impression?: Omit<AdEventPayload, "eventType">;
  click?: Omit<AdEventPayload, "eventType">;
  children?: ReactNode;
  className?: string;
};

function postEvent(payload: AdEventPayload) {
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon("/api/ads/events", blob)) {
      return;
    }
  }

  void fetch("/api/ads/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function AdEventTracker({ impression, click, children, className }: AdEventTrackerProps) {
  const didTrackImpression = useRef(false);

  useEffect(() => {
    if (!impression || didTrackImpression.current) {
      return;
    }

    didTrackImpression.current = true;
    postEvent({ ...impression, eventType: "impression" });
  }, [impression]);

  if (!children) {
    return null;
  }

  return (
    <div
      className={className}
      onClick={() => {
        if (click) {
          postEvent({ ...click, eventType: "click" });
        }
      }}
    >
      {children}
    </div>
  );
}
