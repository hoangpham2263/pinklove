"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <div className="max-w-xl space-y-3">
        <h1 className="text-2xl font-semibold">Không thể tải trang</h1>
        <p className="text-sm text-muted-foreground">
          Trang đang gặp lỗi runtime. Kiểm tra cấu hình môi trường, đặc biệt là DATABASE_URL khi chạy local.
        </p>
      </div>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Thử lại
      </button>
      {error.message ? (
        <pre className="max-w-full overflow-auto rounded-md border bg-muted/40 p-3 text-left text-xs text-muted-foreground">
          {error.message}
        </pre>
      ) : null}
    </main>
  );
}
