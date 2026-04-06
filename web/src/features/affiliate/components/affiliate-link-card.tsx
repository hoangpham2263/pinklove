"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AffiliateLinkCardProps = {
  code: string;
  link: string;
};

export function AffiliateLinkCard({ code, link }: AffiliateLinkCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="font-medium">Mã affiliate</label>
          <Input value={code} readOnly />
        </div>
        <div className="space-y-2">
          <label className="font-medium">Link giới thiệu</label>
          <div className="flex items-center gap-2">
            <Input value={link} readOnly />
            <Button type="button" variant="outline" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Chia sẻ link này để hệ thống ghi nhận lượt truy cập có gắn mã giới thiệu của bạn.
      </p>
    </div>
  );
}
