import "server-only";

import { connectDbListener } from "@/lib/database";
import type { RealtimeNotificationPayload, RealtimeStateSnapshot, RealtimeStreamOptions } from "@/features/realtime/types";

function encodeSseMessage(event: string, data: Record<string, unknown>) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function sameSnapshot(
  current: RealtimeStateSnapshot | null,
  next: RealtimeStateSnapshot | null
) {
  return current?.version === next?.version;
}

function parseNotificationPayload(payload: string | undefined): RealtimeNotificationPayload | null {
  if (!payload) return null;

  try {
    return JSON.parse(payload) as RealtimeNotificationPayload;
  } catch {
    return null;
  }
}

export function createListenRealtimeStream<TState extends RealtimeStateSnapshot | null>({
  channel,
  resourceId,
  readyEvent = "ready",
  changedEvent,
  deletedEvent,
  loadState,
  matchesNotification,
  mapReadyPayload,
  mapChangedPayload,
}: RealtimeStreamOptions<TState>) {
  const encoder = new TextEncoder();
  let closed = false;
  let listenerClient: Awaited<ReturnType<typeof connectDbListener>> | null = null;
  let notificationHandler: ((message: { channel?: string; payload?: string }) => void) | null = null;

  const cleanup = () => {
    if (closed) return;
    closed = true;
    if (listenerClient) {
      if (notificationHandler) {
        listenerClient.off("notification", notificationHandler);
        notificationHandler = null;
      }
      void listenerClient.query(`UNLISTEN ${channel}`).catch(() => undefined);
      listenerClient.release();
      listenerClient = null;
    }
  };

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let currentState: TState;

      const closeStream = () => {
        if (closed) return;
        cleanup();
        try {
          controller.close();
        } catch {
          return;
        }
      };

      const syncState = async () => {
        const nextState = await loadState();
        if (closed) {
          return;
        }

        if (!nextState) {
          if (deletedEvent && currentState) {
            try {
              controller.enqueue(
                encoder.encode(
                  encodeSseMessage(deletedEvent, {
                    resourceId,
                  })
                )
              );
            } catch {
              closeStream();
              return;
            }
          }
          closeStream();
          return;
        }

        if (!sameSnapshot(currentState, nextState)) {
          currentState = nextState;
          const changedState = nextState as Exclude<TState, null>;
          try {
            controller.enqueue(
              encoder.encode(
                encodeSseMessage(
                  changedEvent,
                  mapChangedPayload?.(changedState, resourceId) ?? {
                    resourceId,
                    version: changedState.version,
                  }
                )
              )
            );
          } catch {
            closeStream();
          }
        }
      };

      try {
        listenerClient = await connectDbListener();
        await listenerClient.query(`LISTEN ${channel}`);
        currentState = await loadState();
        if (closed) {
          closeStream();
          return;
        }

        controller.enqueue(
          encoder.encode(
            encodeSseMessage(
              readyEvent,
              mapReadyPayload?.(currentState, resourceId) ?? {
                resourceId,
                version: currentState?.version ?? "",
              }
            )
          )
        );

        notificationHandler = (message) => {
          if (closed || message.channel !== channel) {
            return;
          }

          const payload = parseNotificationPayload(message.payload);
          if (!payload || !matchesNotification(payload, resourceId)) {
            return;
          }

          void syncState().catch(() => {
            closeStream();
          });
        };
        listenerClient.on("notification", notificationHandler);
      } catch {
        closeStream();
      }
    },
    cancel() {
      cleanup();
      return undefined;
    },
  });
}
