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
      <div className="min-h-screen bg-muted/20">
        <div className="grid w-full gap-4 px-4 py-4 lg:grid-cols-12">
          <main className="min-w-0 lg:col-span-10">
            {editor}
          </main>
          <div className="min-w-0 lg:col-span-2">
            <div className="space-y-4 rounded-lg bg-card p-3 shadow-sm ring-1 ring-border/40 lg:sticky lg:top-4">
              {sidebar}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-5 py-5">
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-10">{editor}</div>
        <div className="lg:col-span-2">
          <div className="space-y-4 rounded-lg bg-card p-3 shadow-sm ring-1 ring-border/40">
            {sidebar}
          </div>
        </div>
      </div>
    </div>
  );
}
