"use client";

import { useEffect } from "react";

const CHUNK_RELOAD_KEY = "pinklove:chunk-reload-once";

function isChunkLoadLikeError(error: Error & { digest?: string }) {
  const message = String(error?.message ?? "");
  return (
    message.includes("ChunkLoadError") ||
    message.includes("Loading chunk") ||
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("module factory is not available") ||
    message.includes("was instantiated because it was required from module")
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (!isChunkLoadLikeError(error)) {
      return;
    }

    const alreadyReloaded = window.sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";
    if (alreadyReloaded) {
      window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      return;
    }

    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
    window.location.reload();
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-background text-foreground">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-semibold">Đã xảy ra lỗi tải ứng dụng</h1>
          <p className="text-sm text-muted-foreground">
            Nếu đây là lỗi chunk sau khi dev server rebuild, trang sẽ tự tải lại một lần. Nếu vẫn còn, hãy thử reset thủ công.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Thử lại
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Tải lại trang
            </button>
          </div>
          <p className="max-w-full overflow-auto rounded-md border bg-muted/40 p-3 text-left text-xs text-muted-foreground">
            {error.message}
          </p>
        </main>
      </body>
    </html>
  );
}
