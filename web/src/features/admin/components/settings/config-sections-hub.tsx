"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpenText,
  Globe,
  Link2,
  type LucideIcon,
  Search,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";

type ConfigHubItem = {
  title: string;
  description: string;
  href: string;
};

type ConfigHubSection = {
  title: string;
  icon: "settings" | "link" | "globe" | "docs";
  items: readonly ConfigHubItem[];
};

type ConfigSectionsHubProps = {
  sections: readonly ConfigHubSection[];
};

const iconMap: Record<ConfigHubSection["icon"], LucideIcon> = {
  settings: Settings2,
  link: Link2,
  globe: Globe,
  docs: BookOpenText,
};

export function ConfigSectionsHub({ sections }: ConfigSectionsHubProps) {
  const [keyword, setKeyword] = useState("");

  const filteredSections = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return sections;
    }

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          [item.title, item.description].some((value) => value.toLowerCase().includes(normalizedKeyword))
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [keyword, sections]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm kiếm cấu hình hoặc tài liệu..."
            className="h-9 bg-white pl-9"
          />
        </div>
        <div className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3">
          <ShieldCheck className="h-4 w-4" />
          Quản lý tập trung cho toàn bộ cấu hình hệ thống
        </div>
      </div>

      <div className="rounded-md border bg-background">
        <div className="grid gap-8 p-4 lg:grid-cols-3">
        {filteredSections.map((section) => {
          const SectionIcon = iconMap[section.icon];

          return (
            <div key={section.title} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/40">
                  <SectionIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="tracking-tight text-foreground">{section.title}</h2>
                </div>
              </div>

              <div className="space-y-3">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-border hover:bg-muted/40"
                  >
                    <p className="text-foreground">{item.title}</p>
                    <p className="mt-1 leading-5 text-muted-foreground">{item.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {filteredSections.length === 0 ? (
          <div className="lg:col-span-3">
            <div className="rounded-lg border border-dashed px-4 py-10 text-center text-muted-foreground">
              Không tìm thấy mục cấu hình hoặc tài liệu phù hợp.
            </div>
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
}
