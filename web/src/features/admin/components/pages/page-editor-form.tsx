"use client";

import { useState } from "react";
import { NativeForm } from "@/components/common/native-form";
import { FieldsEditor } from "@/components/common/fields-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getContentPageFields } from "@/features/pages/registry";
import { MediaSelector } from "@/features/media/components/media-selector";
import { getAuthPageFields, isAuthPageSlug, isManagedSitePageSlug } from "@/features/auth/page-registry";
import { SeoPreview } from "./seo-preview";
import type { CmsPage } from "@/lib/cms";
import { slugify } from "@/lib/utils";

type PageEditorFormProps = {
  page: CmsPage;
  isSaved?: boolean;
  hasError?: boolean;
};

export function PageEditorForm({ page }: PageEditorFormProps) {
  const [ogImage, setOgImage] = useState(page.ogImage || "");
  
  // SEO Preview States
  const [seoTitle, setSeoTitle] = useState(page.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(page.seoDescription || "");
  const [slug, setSlug] = useState(page.slug || "");
  const [pageTitle, setPageTitle] = useState(page.title || "");
  const [pageName, setPageName] = useState(page.name || "");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(!!page.slug);
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(!!page.title);

  // Template and Custom Fields
  const [customFields, setCustomFields] = useState<Record<string, unknown>>(page.customFields || {});

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
  const templateFields = isAuthPageSlug(page.slug)
    ? getAuthPageFields(page.slug)
    : getContentPageFields(page.slug);

  return (
    <NativeForm action="/api/admin/pages/update" method="POST" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                  Slug
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
              <textarea
                id="body"
                name="body"
                defaultValue={page.body}
                className="min-h-[400px] w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Enter page content here..."
              />
            </div>
          </CardContent>
        </Card>

        {templateFields.length > 0 && (
          <Card>
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle>Template Custom Fields</CardTitle>
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
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4">
              <CardTitle>SEO Settings</CardTitle>
              <span className="text-sm text-muted-foreground transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <CardContent className="space-y-6 border-t pt-4">
              <SeoPreview 
                title={seoTitle || pageTitle} 
                description={seoDescription} 
                slug={slug} 
              />

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <label htmlFor="seoTitle" className="font-medium flex justify-between">
                    <span>SEO Title</span>
                    <span className={`text-[10px] ${(seoTitle || pageTitle).length > 60 ? 'text-orange-500' : 'text-muted-foreground'}`}>
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
                  <p className="text-[10px] text-muted-foreground italic">Tip: Use your main keyword at the beginning of the title.</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="seoDescription" className="font-medium flex justify-between">
                    <span>SEO Description</span>
                    <span className={`text-[10px] ${seoDescription.length > 160 ? 'text-orange-500' : 'text-muted-foreground'}`}>
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
                  <p className="text-[10px] text-muted-foreground italic">Tip: A good description increases click-through rate.</p>
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
              </div>

              <hr className="my-4" />

              <div className="space-y-4">
                <h3 className="font-semibold uppercase tracking-wider text-muted-foreground">Open Graph (Social)</h3>
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

                <div className="flex flex-wrap gap-6 pt-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="noindex" defaultChecked={page.noindex} className="rounded border-input text-primary focus:ring-ring" />
                    <span className="font-medium">Noindex</span> (Hide from search engines)
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
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
              <Button type="submit" className="w-full">
                Update Page
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
