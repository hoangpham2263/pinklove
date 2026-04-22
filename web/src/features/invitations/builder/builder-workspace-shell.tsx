"use client";

import type { ReactNode } from "react";

export function BuilderWorkspaceShell({
  editor,
  sidebar,
  variant = "split",
}: {
  editor: ReactNode;
  sidebar: ReactNode;
  variant?: "split" | "fullscreen";
}) {
  if (variant === "fullscreen") {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="grid w-full gap-5 px-4 py-5 lg:grid-cols-12">
          <main className="min-w-0 lg:col-span-10">
            {editor}
          </main>
          <div className="min-w-0 lg:col-span-2">
            <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm lg:sticky lg:top-5">
              {sidebar}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-5 py-5">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-10">{editor}</div>
        <div className="lg:col-span-2">
          <div className="space-y-4 rounded-2xl border bg-card p-4">
            {sidebar}
          </div>
        </div>
      </div>
    </div>
  );
}
