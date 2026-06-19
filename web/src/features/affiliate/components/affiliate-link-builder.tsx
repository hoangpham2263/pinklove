"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Link as LinkIcon, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/routes";

type AffiliateLinkBuilderProps = {
  code: string;
  origin: string;
};

const quickTargets = [
  { label: "Trang chủ", value: ROUTES.HOME },
  { label: "Mẫu thiệp", value: ROUTES.TEMPLATES },
  { label: "Thiệp giấy", value: ROUTES.PAPER },
  { label: "Tự tạo thiệp", value: ROUTES.CUSTOMER.INVITATIONS },
  { label: "Dịch vụ", value: ROUTES.SERVICES },
];

function normalizeInternalTarget(input: string, origin: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return "/";
  }

  const target = trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : trimmed.startsWith("/")
      ? trimmed
      : `/${trimmed}`;
  const parsed = new URL(target, origin);
  const expectedOrigin = new URL(origin).origin;

  if (parsed.origin !== expectedOrigin) {
    throw new Error("EXTERNAL_TARGET");
  }

  parsed.hash = "";
  parsed.searchParams.delete("ref");

  return `${parsed.pathname}${parsed.search}`;
}

function buildAffiliateUrl(input: string, code: string, origin: string) {
  const targetPath = normalizeInternalTarget(input, origin);
  const url = new URL(targetPath, origin);
  url.searchParams.set("ref", code);
  return url.toString();
}

export function AffiliateLinkBuilder({ code, origin }: AffiliateLinkBuilderProps) {
  const [target, setTarget] = useState("/");
  const [copied, setCopied] = useState(false);

  const generated = useMemo(() => {
    try {
      return {
        link: buildAffiliateUrl(target, code, origin),
        error: "",
      };
    } catch {
      return {
        link: "",
        error: "Chỉ tạo link cho URL nội bộ thuộc website hiện tại.",
      };
    }
  }, [code, origin, target]);

  async function handleCopy() {
    if (!generated.link) {
      toast.error("URL chưa hợp lệ.");
      return;
    }

    await navigator.clipboard.writeText(generated.link);
    setCopied(true);
    toast.success("Đã copy link affiliate.");
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-5 rounded-lg border bg-background p-4">
      <div className="space-y-2">
        <label htmlFor="affiliateTargetUrl" className="font-medium">
          Link website cần chia sẻ
        </label>
        <div className="flex flex-col gap-2 md:flex-row">
        <Input
          id="affiliateTargetUrl"
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          placeholder={`${ROUTES.TEMPLATES}, ${ROUTES.TEMPLATES.slice(1)} hoặc https://domain.com${ROUTES.TEMPLATES}`}
        />
          <Button type="button" variant="outline" onClick={() => setTarget("/")}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
        {generated.error ? (
          <p className="text-sm text-destructive">{generated.error}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Có thể nhập đường dẫn nội bộ hoặc URL đầy đủ cùng domain website.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {quickTargets.map((item) => (
          <Button key={item.value} type="button" variant="outline" size="sm" onClick={() => setTarget(item.value)}>
            {item.label}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        <label htmlFor="affiliateGeneratedLink" className="font-medium">
          Link affiliate
        </label>
        <div className="flex flex-col gap-2 md:flex-row">
          <Input id="affiliateGeneratedLink" value={generated.link} readOnly />
          <Button type="button" onClick={handleCopy} disabled={!generated.link}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copy
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
        <div className="flex items-start gap-2">
          <LinkIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Khi khách mở link này, hệ thống sẽ lưu mã giới thiệu trong cookie 30 ngày và gắn vào đơn hàng nếu khách checkout sau đó.
          </p>
        </div>
      </div>
    </div>
  );
}
