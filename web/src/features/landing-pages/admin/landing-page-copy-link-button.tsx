"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

type LandingPageCopyLinkButtonProps = {
  path: string;
};

export function LandingPageCopyLinkButton({ path }: LandingPageCopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const displayUrl = useMemo(() => path, [path]);

  async function handleCopy() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullUrl = `${origin}${path}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Đã sao chép link.");
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
        {displayUrl}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition hover:bg-muted"
        aria-label="Sao chép link"
        title="Sao chép"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
