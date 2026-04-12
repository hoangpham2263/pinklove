"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (!enabled) {
      setStatus("live");
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
      setStatus("live");
      void load()
        .then((data) => {
          onData(data);
        })
        .catch((error) => {
          onError?.(error instanceof Error ? error : new Error("REALTIME_LOAD_FAILED"));
        });
    };

    const handleDeleted = () => {
      onDeleted?.();
    };

    eventSource.addEventListener("open", handleOpen);
    eventSource.addEventListener("error", handleError);
    eventSource.addEventListener(changedEvent, handleChanged);

    if (deletedEvent) {
      eventSource.addEventListener(deletedEvent, handleDeleted);
    }

    return () => {
      eventSource.removeEventListener("open", handleOpen);
      eventSource.removeEventListener("error", handleError);
      eventSource.removeEventListener(changedEvent, handleChanged);
      if (deletedEvent) {
        eventSource.removeEventListener(deletedEvent, handleDeleted);
      }
      eventSource.close();
    };
  }, [changedEvent, deletedEvent, enabled, load, onData, onDeleted, onError, streamUrl]);

  return {
    status,
  };
}
