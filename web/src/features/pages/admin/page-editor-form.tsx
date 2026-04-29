"use client";

import { type FormEvent, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { FieldsEditor, type FieldsEditorProductOption } from "@/components/common/fields-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getManagedPageFields, isManagedSitePageSlug } from "@/features/pages/config/managed-pages";
import { MediaSelector } from "@/features/media/components/media-selector";
import { STRUCTURED_DATA_FIELD } from "@/lib/page-fields";
import { getManagedPagePath } from "@/lib/page-paths";
import { SeoPreview } from "./seo-preview";
import type { ManagedPage } from "@/lib/managed-pages";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { slugify } from "@/lib/utils";

const TiptapRichTextEditor = dynamic(
  () => import("@/components/common/tiptap-rich-text-editor").then((mod) => mod.TiptapRichTextEditor),
  { ssr: false }
);

type PageEditorFormProps = {
  page: ManagedPage;
  isSaved?: boolean;
  hasError?: boolean;
  productOptions?: FieldsEditorProductOption[];
};

export function PageEditorForm({ page, productOptions = [] }: PageEditorFormProps) {
  const router = useRouter();
  const [ogImage, setOgImage] = useState(page.ogImage || "");
  const [isSaving, setIsSaving] = useState(false);
  
  // SEO Preview States
  const [seoTitle, setSeoTitle] = useState(page.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(page.seoDescription || "");
  const [slug, setSlug] = useState(page.slug || "");
  const [pageTitle, setPageTitle] = useState(page.title || "");
  const [pageName, setPageName] = useState(page.name || "");
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
    if (!isProtectedSlug) {
      setSlug(slugify(nextName));
    }
    if (!isTitleManuallyEdited) {
      setPageTitle(nextName);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageTitle(e.target.value);
    setIsTitleManuallyEdited(true);
  };

  const handleCustomFieldChange = (name: string, value: unknown) => {
    setCustomFields(prev => ({ ...prev, [name]: value }));
  };

  const isProtectedSlug = isManagedSitePageSlug(page.slug);
  const templateFields = getManagedPageFields(page.slug);

  const previewPage: ManagedPage = {
    ...page,
    slug,
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await adminApi.updatePage(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã lưu thay đổi trang.");
      finishMutation(router, result, { redirect: "replace", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu trang.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <NativeForm action={adminApiActions.updatePage} method="POST" className="grid grid-cols-1 gap-6 lg:grid-cols-12" onSubmit={handleSubmit}>
      <input type="hidden" name="originalSlug" value={page.slug} />
      <input type="hidden" name="ogImage" value={ogImage} />
      <input type="hidden" name="customFields" value={JSON.stringify(customFields)} />

      {/* Left Column: Main Content & SEO (9/12) */}
      <div className="space-y-5 lg:col-span-9">
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
                productOptions={productOptions}
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

              <div className="grid gap-4">
                <div className="space-y-2">
                  <label htmlFor="seoTitle" className="flex justify-between font-medium">
                    <span>SEO Title</span>
                    <span className={(seoTitle || pageTitle).length > 60 ? "text-orange-500" : "text-muted-foreground"}>
                      {(seoTitle || pageTitle).length} / 60
                    </span>
                  </label>
                  <Input
                    id="seoTitle"
                    name="seoTitle"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Search engine title"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="seoDescription" className="flex justify-between font-medium">
                    <span>SEO Description</span>
                    <span className={seoDescription.length > 160 ? "text-orange-500" : "text-muted-foreground"}>
                      {seoDescription.length} / 160
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
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="canonicalUrl" className="font-medium">
                      Canonical URL Override
                    </label>
                    <Input
                      id="canonicalUrl"
                      name="canonicalUrl"
                      defaultValue={page.canonicalUrl}
                      placeholder="Để trống để dùng đường dẫn hiện tại"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-medium">Search Engine Rules</label>
                    <div className="flex flex-wrap gap-4 rounded-md border px-3 py-2">
                      <label className="inline-flex cursor-pointer items-center gap-2">
                        <input type="checkbox" name="noindex" defaultChecked={page.noindex} className="rounded border-input text-primary focus:ring-ring" />
                        <span>Noindex</span>
                      </label>
                      <label className="inline-flex cursor-pointer items-center gap-2">
                        <input type="checkbox" name="nofollow" defaultChecked={page.nofollow} className="rounded border-input text-primary focus:ring-ring" />
                        <span>Nofollow</span>
                      </label>
                    </div>
                  </div>
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
                </div>
              </div>
            </CardContent>
          </details>
        </Card>
      </div>

      {/* Right Column: Sidebar (3/12) */}
      <div className="space-y-5 lg:col-span-3 lg:sticky lg:top-20 lg:self-start">
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
