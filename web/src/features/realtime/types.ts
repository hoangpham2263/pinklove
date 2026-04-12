export type RealtimeStatus = "connecting" | "live" | "retrying";

export type RealtimeStateSnapshot = {
  version: string;
  payload?: Record<string, unknown>;
};

export type RealtimeNotificationPayload = {
  topic: string;
  resourceId: string;
};

export type RealtimeStreamOptions<TState extends RealtimeStateSnapshot | null> = {
  channel: string;
  resourceId: string;
  readyEvent?: string;
  changedEvent: string;
  deletedEvent?: string;
  loadState: () => Promise<TState>;
  matchesNotification: (payload: RealtimeNotificationPayload, resourceId: string) => boolean;
  mapReadyPayload?: (state: TState, resourceId: string) => Record<string, unknown>;
  mapChangedPayload?: (state: Exclude<TState, null>, resourceId: string) => Record<string, unknown>;
};

export type UseRealtimeResourceOptions<TData> = {
  enabled?: boolean;
  streamUrl: string;
  changedEvent: string;
  deletedEvent?: string;
  load: () => Promise<TData>;
  onData: (data: TData) => void;
  onDeleted?: () => void;
  onError?: (error: Error) => void;
};
