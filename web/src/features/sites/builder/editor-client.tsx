"use client";

import dynamic from "next/dynamic";

const BuilderEditor = dynamic(
  () => import("./editor").then((module) => module.BuilderEditor),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
        Đang tải trình dựng thiệp...
      </div>
    ),
  }
);

export function BuilderEditorClient({ initialValue }: { initialValue: unknown }) {
  return <BuilderEditor initialValue={initialValue} />;
}
