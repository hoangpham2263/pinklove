"use client";

import { type FormEvent, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { FieldsEditor } from "@/components/common/fields-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getManagedPageFields, isManagedSitePageSlug } from "@/features/pages/config/managed-pages";
import { MediaSelector } from "@/features/media/components/media-selector";
import { STRUCTURED_DATA_FIELD } from "@/lib/page-fields";
import { canCustomizePagePermalink, getManagedPagePath, getDefaultPagePath, normalizePagePermalinkInput } from "@/lib/page-paths";
import { ROUTES } from "@/lib/routes";
import { SeoPreview } from "./seo-preview";
import type { ManagedPage } from "@/lib/managed-pages";
import { finishMutation, postForm } from "@/lib/client-mutation";
import { slugify } from "@/lib/utils";

const TiptapRichTextEditor = dynamic(
  () => import("@/components/common/tiptap-rich-text-editor").then((mod) => mod.TiptapRichTextEditor),
  { ssr: false }
);

type PageEditorFormProps = {
  page: ManagedPage;
  availablePages: ManagedPage[];
  isSaved?: boolean;
  hasError?: boolean;
};

export function PageEditorForm({ page, availablePages }: PageEditorFormProps) {
  const router = useRouter();
  const [ogImage, setOgImage] = useState(page.ogImage || "");
  const [isSaving, setIsSaving] = useState(false);
  
  // SEO Preview States
  const [seoTitle, setSeoTitle] = useState(page.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(page.seoDescription || "");
  const [slug, setSlug] = useState(page.slug || "");
  const [permalink, setPermalink] = useState(page.permalink || getDefaultPagePath(page.slug));
  const [pageTitle, setPageTitle] = useState(page.title || "");
  const [pageName, setPageName] = useState(page.name || "");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(!!page.slug);
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(!!page.title);

  // Template and Custom Fields
  const [customFields, setCustomFields] = useState<Record<string, unknown>>(page.customFields || {});
  const structuredDataValue =
    typeof customFields[STRUCTURED_DATA_FIELD] === "string"
      ? String(customFields[STRUCTURED_DATA_FIELD])
      : "";

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextName = e.target.value;
    setPageName(nextName);
    if (!isSlugManuallyEdited) {
      setSlug(slugify(nextName));
    }
    if (!isTitleManuallyEdited) {
      setPageTitle(nextName);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setIsSlugManuallyEdited(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageTitle(e.target.value);
    setIsTitleManuallyEdited(true);
  };

  const handleCustomFieldChange = (name: string, value: unknown) => {
    setCustomFields(prev => ({ ...prev, [name]: value }));
  };

  const isProtectedSlug = isManagedSitePageSlug(page.slug);
  const canCustomizePermalink = canCustomizePagePermalink(page.slug);
  const templateFields = getManagedPageFields(page.slug);

  const previewPage: ManagedPage = {
    ...page,
    slug,
    permalink: normalizePagePermalinkInput(permalink, slug),
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await postForm(ROUTES.API.ADMIN.PAGES.UPDATE, new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã lưu thay đổi trang.");
      finishMutation(router, result, { redirect: "replace", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu trang.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <NativeForm action={ROUTES.API.ADMIN.PAGES.UPDATE} method="POST" className="grid grid-cols-1 lg:grid-cols-12 gap-6" onSubmit={handleSubmit}>
      <input type="hidden" name="originalSlug" value={page.slug} />
      <input type="hidden" name="ogImage" value={ogImage} />
      <input type="hidden" name="customFields" value={JSON.stringify(customFields)} />

      {/* Left Column: Main Content & SEO (9/12) */}
      <div className="lg:col-span-9 space-y-6">
        <Card className="">
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="font-medium">
                  Page Name
                </label>
                <Input 
                  id="name" 
                  name="name" 
                  value={pageName} 
                  onChange={handleNameChange}
                  required 
                  placeholder="Internal name" 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="slug" className="font-medium">
                  Slug nội bộ
                </label>
                <Input 
                  id="slug" 
                  name="slug" 
                  value={slug} 
                  onChange={handleSlugChange}
                  required 
                  placeholder="URL path segment"
                  readOnly={isProtectedSlug}
                  className={isProtectedSlug ? "bg-muted cursor-not-allowed opacity-70" : ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="permalink" className="font-medium">
                Custom Permalink
              </label>
              <Input
                id="permalink"
                name="permalink"
                value={permalink}
                onChange={(e) => setPermalink(e.target.value)}
                readOnly={!canCustomizePermalink}
                className={!canCustomizePermalink ? "bg-muted cursor-not-allowed opacity-70" : ""}
                placeholder="/ten-trang-seo"
              />
              <p className="text-[10px] text-muted-foreground italic">
                {!canCustomizePermalink
                  ? "Trang system đặc biệt dùng URL cố định."
                  : "Nhập đường dẫn public như WordPress/Rank Math, ví dụ /gioi-thieu hoặc /dich-vu."}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="title" className="font-medium">
                Page Title (H1)
              </label>
              <Input 
                id="title" 
                name="title" 
                value={pageTitle} 
                onChange={handleTitleChange}
                placeholder="Main heading displayed on page" 
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="excerpt" className="font-medium">
                Excerpt
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                defaultValue={page.excerpt}
                className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Brief summary"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="body" className="font-medium">
                Body Content
              </label>
              <TiptapRichTextEditor
                name="body"
                initialValue={page.body}
              />
            </div>
          </CardContent>
        </Card>

        {templateFields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Custom Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldsEditor
                fields={templateFields}
                values={customFields}
                onChange={handleCustomFieldChange}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
              <CardTitle>SEO Settings</CardTitle>
              <span className="text-muted-foreground transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <CardContent className="space-y-4 border-t pt-4">
              <SeoPreview 
                title={seoTitle || pageTitle} 
                description={seoDescription} 
                path={getManagedPagePath(previewPage)}
              />

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="seoTitle" className="font-medium flex justify-between">
                    <span>SEO Title</span>
                    <span className={(seoTitle || pageTitle).length > 60 ? "text-orange-500" : "text-muted-foreground"}>
                      {(seoTitle || pageTitle).length} / 60 chars
                    </span>
                  </label>
                  <Input 
                    id="seoTitle" 
                    name="seoTitle" 
                    value={seoTitle} 
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Search engine title" 
                  />
                  <p className="text-muted-foreground">Tip: Use your main keyword at the beginning of the title.</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="seoDescription" className="font-medium flex justify-between">
                    <span>SEO Description</span>
                    <span className={seoDescription.length > 160 ? "text-orange-500" : "text-muted-foreground"}>
                      {seoDescription.length} / 160 chars
                    </span>
                  </label>
                  <textarea
                    id="seoDescription"
                    name="seoDescription"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Search engine description"
                  />
                  <p className="text-muted-foreground">Tip: A good description increases click-through rate.</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="seoKeywords" className="font-medium">
                    SEO Keywords
                  </label>
                  <Input id="seoKeywords" name="seoKeywords" defaultValue={page.seoKeywords} placeholder="comma, separated, keywords" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="canonicalUrl" className="font-medium">
                    Canonical URL
                  </label>
                  <Input id="canonicalUrl" name="canonicalUrl" defaultValue={page.canonicalUrl} placeholder="https://example.com/page" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="breadcrumbTitle" className="font-medium">
                    Breadcrumb Title
                  </label>
                  <Input
                    id="breadcrumbTitle"
                    name="breadcrumbTitle"
                    defaultValue={page.breadcrumbTitle}
                    placeholder="Tên hiển thị trong breadcrumb"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="breadcrumbParentSlug" className="font-medium">
                    Breadcrumb Parent
                  </label>
                  <select
                    id="breadcrumbParentSlug"
                    name="breadcrumbParentSlug"
                    defaultValue={page.breadcrumbParentSlug || ""}
                    className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Tự động / không chọn</option>
                    {availablePages
                      .filter((item) => item.slug !== page.slug)
                      .map((item) => (
                        <option key={item.slug} value={item.slug}>
                          {item.name} ({getManagedPagePath(item)})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="structuredDataJson" className="font-medium">
                    Structured Data JSON-LD
                  </label>
                  <textarea
                    id="structuredDataJson"
                    value={structuredDataValue}
                    onChange={(e) => handleCustomFieldChange(STRUCTURED_DATA_FIELD, e.target.value)}
                    className="min-h-40 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder={'{"@context":"https://schema.org","@type":"WebPage","name":"Page name"}'}
                  />
                  <p className="text-muted-foreground">
                    Nhập JSON-LD hợp lệ cho page này. Để trống nếu không muốn render schema.
                  </p>
                </div>
              </div>

              <hr />

              <div className="space-y-4">
                <h3 className="font-semibold">Open Graph (Social)</h3>
                <div className="space-y-2">
                  <label htmlFor="ogTitle" className="font-medium">
                    OG Title
                  </label>
                  <Input id="ogTitle" name="ogTitle" defaultValue={page.ogTitle} placeholder="Facebook/Twitter title" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="ogDescription" className="font-medium">
                    OG Description
                  </label>
                  <textarea
                    id="ogDescription"
                    name="ogDescription"
                    defaultValue={page.ogDescription}
                    className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Facebook/Twitter description"
                  />
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input type="checkbox" name="noindex" defaultChecked={page.noindex} className="rounded border-input text-primary focus:ring-ring" />
                    <span className="font-medium">Noindex</span> (Hide from search engines)
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input type="checkbox" name="nofollow" defaultChecked={page.nofollow} className="rounded border-input text-primary focus:ring-ring" />
                    <span className="font-medium">Nofollow</span> (Don&apos;t follow links)
                  </label>
                </div>
              </div>
            </CardContent>
          </details>
        </Card>
      </div>

      {/* Right Column: Sidebar (3/12) */}
      <div className="lg:col-span-3 space-y-6">
        <Card className="">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Publish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="status" className="font-medium">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={page.status}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Update Page"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Featured Image</CardTitle>
          </CardHeader>
          <CardContent>
            <MediaSelector value={ogImage} onChange={setOgImage} />
            <p className="mt-2 text-muted-foreground text-xs">Used as the featured image and OG image.</p>
          </CardContent>
        </Card>
      </div>
    </NativeForm>
  );
}
