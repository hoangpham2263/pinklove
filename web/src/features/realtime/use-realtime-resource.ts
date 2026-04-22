"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import type { RealtimeStatus, UseRealtimeResourceOptions } from "@/features/realtime/types";

export function useRealtimeResource<TData>({
  enabled = true,
  streamUrl,
  changedEvent,
  deletedEvent,
  load,
  onData,
  onDeleted,
  onError,
}: UseRealtimeResourceOptions<TData>) {
  const [status, setStatus] = useState<RealtimeStatus>(enabled ? "connecting" : "live");
  const latestRequestIdRef = useRef(0);
  const syncResource = useEffectEvent(() => {
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;
    setStatus("live");
    void load()
      .then((data) => {
        if (latestRequestIdRef.current !== requestId) {
          return;
        }
        onData(data);
      })
      .catch((error) => {
        if (latestRequestIdRef.current !== requestId) {
          return;
        }
        onError?.(error instanceof Error ? error : new Error("REALTIME_LOAD_FAILED"));
      });
  });

  const handleDeletedEvent = useEffectEvent(() => {
    onDeleted?.();
  });

  useEffect(() => {
    if (!enabled) {
      latestRequestIdRef.current += 1;
      return;
    }

    const eventSource = new EventSource(streamUrl);

    const handleOpen = () => {
      setStatus("live");
    };

    const handleError = () => {
      setStatus("retrying");
    };

    const handleChanged = () => {
      syncResource();
    };

    const handleReady = () => {
      syncResource();
    };

    const handleDeleted = () => {
      handleDeletedEvent();
    };

    eventSource.addEventListener("open", handleOpen);
    eventSource.addEventListener("error", handleError);
    eventSource.addEventListener("ready", handleReady);
    eventSource.addEventListener(changedEvent, handleChanged);

    if (deletedEvent) {
      eventSource.addEventListener(deletedEvent, handleDeleted);
    }

    return () => {
      latestRequestIdRef.current += 1;
      eventSource.removeEventListener("open", handleOpen);
      eventSource.removeEventListener("error", handleError);
      eventSource.removeEventListener("ready", handleReady);
      eventSource.removeEventListener(changedEvent, handleChanged);
      if (deletedEvent) {
        eventSource.removeEventListener(deletedEvent, handleDeleted);
      }
      eventSource.close();
    };
  }, [changedEvent, deletedEvent, enabled, streamUrl]);

  return {
    status: enabled ? status : "live",
  };
}
