"use client";

import { useMemo, useState } from "react";
import { X, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { type Offering } from "@/features/offerings/types";
import { formatVnd } from "@/lib/currency";

export type OfferingSearchSelectProps = {
  name: string;
  options: Offering[];
  defaultValue?: string[];
  label: string;
  description?: string;
  excludeId?: string;
};

export function OfferingSearchSelect({
  name,
  options,
  defaultValue = [],
  label,
  description,
  excludeId,
}: OfferingSearchSelectProps) {
  const [search, setSearch] = useState("");
  const [selectedValues, setSelectedValues] = useState<string[]>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return options.filter((option) => {
      if (option.id === excludeId) return false;
      if (!query) return true;
      return option.name.toLowerCase().includes(query) || option.slug.toLowerCase().includes(query);
    });
  }, [options, search, excludeId]);

  const selectedOptions = useMemo(() => {
    const optionMap = new Map(options.map((option) => [option.id, option] as const));
    return selectedValues
      .map((id) => optionMap.get(id))
      .filter((item): item is Offering => Boolean(item));
  }, [options, selectedValues]);

  function toggleOffering(id: string) {
    setSelectedValues((prev) => {
      if (prev.includes(id)) {
        return prev.filter((v) => v !== id);
      }
      return [...prev, id];
    });
  }

  function removeOffering(id: string) {
    setSelectedValues((prev) => prev.filter((v) => v !== id));
  }

  return (
    <div className="space-y-3">
      {selectedValues.map((val) => (
        <input key={val} type="hidden" name={name} value={val} />
      ))}

      <div>
        <label className="text-sm font-medium leading-5">{label}</label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      
      <div className="rounded-md border bg-card p-3">
        {selectedOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-3">Chưa chọn sản phẩm nào.</p>
        ) : (
          <div className="mb-3 flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
            {selectedOptions.map((option) => (
              <div
                key={option.id}
                className="flex items-center justify-between gap-2 rounded-md border bg-secondary/30 px-3 py-2 text-sm transition-colors hover:bg-secondary/50"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{option.name}</span>
                  <span className="text-xs text-muted-foreground">{formatVnd(option.price)}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeOffering(option.id)}
                  aria-label={`Bỏ ${option.name}`}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger
            render={
              <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => setSearch("")}>
                <Plus className="mr-2 size-4" />
                Thêm sản phẩm
              </Button>
            }
          />
          <DialogContent className="flex h-[min(42rem,calc(100vh-2rem))] w-[min(44rem,calc(100vw-2rem))] max-w-none grid-rows-none flex-col gap-0 overflow-hidden p-0">
            <div className="shrink-0 p-6 pb-4">
              <DialogHeader>
                <DialogTitle>Chọn {label.toLowerCase()}</DialogTitle>
              </DialogHeader>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm sản phẩm bằng tên hoặc slug..."
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              <div className="flex flex-col gap-2">
                {filteredOptions.length === 0 ? (
                  <div className="flex h-full min-h-72 items-center justify-center rounded-md border border-dashed text-center text-sm text-muted-foreground">
                    Không tìm thấy sản phẩm phù hợp.
                  </div>
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = selectedValues.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={`flex min-h-16 cursor-pointer items-center justify-between gap-3 rounded-md border p-3 text-left transition-colors ${
                          isSelected ? "border-primary/20 bg-primary/5" : "bg-card hover:bg-accent/50"
                        }`}
                        onClick={() => toggleOffering(option.id)}
                      >
                        <span className="flex min-w-0 flex-col gap-1">
                          <span className="truncate font-medium">{option.name}</span>
                          <span className="text-xs text-muted-foreground">{formatVnd(option.price)}</span>
                        </span>
                        <span className="shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium">
                          {isSelected ? "Bỏ chọn" : "Chọn"}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between border-t bg-muted/20 p-4">
              <span className="text-sm text-muted-foreground">
                Đã chọn {selectedValues.length} sản phẩm
              </span>
              <Button type="button" onClick={() => setIsOpen(false)}>Xong</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
