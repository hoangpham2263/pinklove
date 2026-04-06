"use client";

import { useState } from "react";
import { NativeForm } from "@/components/common/native-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";
import { CMS_TEMPLATES } from "@/features/client/templates";

export function QuickCreatePageForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [isTitleEdited, setIsTitleEdited] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextName = e.target.value;
    setName(nextName);
    
    if (!isSlugEdited) {
      setSlug(slugify(nextName));
    }
    
    if (!isTitleEdited) {
      setTitle(nextName);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setIsSlugEdited(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsTitleEdited(true);
  };

  return (
    <NativeForm action="/api/admin/pages/create" method="POST" className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="font-medium text-sm">
          Tên trang (Nội bộ)
        </label>
        <Input 
          id="name" 
          name="name" 
          value={name}
          onChange={handleNameChange}
          placeholder="Ví dụ: Dịch vụ" 
          required 
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="slug" className="font-medium text-sm">
          Slug (URL)
        </label>
        <Input 
          id="slug" 
          name="slug" 
          value={slug}
          onChange={handleSlugChange}
          placeholder="dich-vu" 
          required 
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="title" className="font-medium text-sm">
          Tiêu đề trang (H1)
        </label>
        <Input 
          id="title" 
          name="title" 
          value={title}
          onChange={handleTitleChange}
          placeholder="Tiêu đề hiển thị trên trang" 
          required 
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="template" className="font-medium text-sm">
          Template
        </label>
        <select
          id="template"
          name="template"
          defaultValue="default"
          className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {Object.entries(CMS_TEMPLATES).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      
      <Button type="submit" className="w-full">
        Tạo trang mới
      </Button>
    </NativeForm>
  );
}
