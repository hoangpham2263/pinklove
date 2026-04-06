import "server-only";

import { listMediaAssets } from "@/features/media/server/media-store";

type MediaReference =
  | string
  | {
      id?: string;
      url?: string;
      src?: string;
      value?: unknown;
    };

function isDirectMediaUrl(value: string) {
  return value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://");
}

function parsePossibleJson(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return value;
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

export async function resolveMediaUrl(input: unknown): Promise<string | undefined> {
  if (input == null) {
    return undefined;
  }

  if (typeof input === "string") {
    const value = input.trim();
    if (!value) {
      return undefined;
    }

    const parsed = parsePossibleJson(value);
    if (parsed !== value) {
      return resolveMediaUrl(parsed);
    }

    if (isDirectMediaUrl(value)) {
      return value;
    }

    const items = await listMediaAssets();
    const matched = items.find((item) => item.id === value || item.fileName === value);
    return matched?.url;
  }

  if (typeof input === "object") {
    const value = input as MediaReference;

    if (typeof value.url === "string" && value.url.trim()) {
      return resolveMediaUrl(value.url);
    }

    if (typeof value.src === "string" && value.src.trim()) {
      return resolveMediaUrl(value.src);
    }

    if (typeof value.id === "string" && value.id.trim()) {
      const items = await listMediaAssets();
      const matched = items.find((item) => item.id === value.id);
      return matched?.url;
    }

    if (value.value !== undefined) {
      return resolveMediaUrl(value.value);
    }
  }

  return undefined;
}
