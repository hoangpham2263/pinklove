import "server-only";

import { query, withTransaction } from "@/lib/database";

export const PAGE_OWNER_TYPES = ["wedding_site", "provider", "offering", "landing"] as const;
export const PAGE_TYPES = ["website", "landing", "seo", "campaign", "vendor"] as const;

export type PageOwnerType = (typeof PAGE_OWNER_TYPES)[number];
export type PageType = (typeof PAGE_TYPES)[number];

export type BuilderPage = {
  id: string;
  owner_type: PageOwnerType;
  owner_id: string;
  page_type: PageType;
  slug: string;
  title: string;
  sort_order: number;
  status: string;
  settings: Record<string, unknown>;
};

export type BuilderSection = {
  id: string;
  page_id: string;
  section_type: string;
  title: string;
  sort_order: number;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  visibility_rules: Record<string, unknown>;
  display_conditions: Record<string, unknown>;
  ab_variant_key: string | null;
};

export async function getBuilderPage(input: {
  ownerType: PageOwnerType;
  ownerId: string;
  slug: string;
}) {
  const result = await query<BuilderPage>(
    `
      SELECT *
      FROM pages
      WHERE owner_type = $1 AND owner_id = $2 AND slug = $3
      LIMIT 1
    `,
    [input.ownerType, input.ownerId, input.slug]
  );

  return result.rows[0] ?? null;
}

export async function ensureBuilderPage(input: {
  ownerType: PageOwnerType;
  ownerId: string;
  pageType: PageType;
  slug: string;
  title?: string;
  status?: string;
  settings?: Record<string, unknown>;
}) {
  const result = await query<BuilderPage>(
    `
      INSERT INTO pages (
        owner_type, owner_id, page_type, slug, title, status, settings
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      ON CONFLICT (owner_type, owner_id, slug) DO UPDATE
      SET
        page_type = EXCLUDED.page_type,
        title = COALESCE(NULLIF(EXCLUDED.title, ''), pages.title),
        status = EXCLUDED.status,
        settings = EXCLUDED.settings,
        updated_at = NOW()
      RETURNING *
    `,
    [
      input.ownerType,
      input.ownerId,
      input.pageType,
      input.slug,
      input.title ?? "",
      input.status ?? "draft",
      JSON.stringify(input.settings ?? {}),
    ]
  );

  const page = result.rows[0];
  if (!page) throw new Error("BUILDER_PAGE_SAVE_FAILED");
  return page;
}

export async function listBuilderSections(pageId: string) {
  const result = await query<BuilderSection>(
    `
      SELECT *
      FROM page_sections
      WHERE page_id = $1
      ORDER BY sort_order ASC, created_at ASC
    `,
    [pageId]
  );

  return result.rows;
}

export async function replaceBuilderSections(input: {
  pageId: string;
  sections: Array<{
    sectionType: string;
    title?: string;
    content?: Record<string, unknown>;
    settings?: Record<string, unknown>;
    visibilityRules?: Record<string, unknown>;
    displayConditions?: Record<string, unknown>;
    abVariantKey?: string | null;
  }>;
}) {
  await withTransaction(async (execute) => {
    await execute("DELETE FROM page_sections WHERE page_id = $1", [input.pageId]);

    for (let index = 0; index < input.sections.length; index += 1) {
      const section = input.sections[index];
      await execute(
        `
          INSERT INTO page_sections (
            page_id, section_type, title, sort_order, content, settings,
            visibility_rules, display_conditions, ab_variant_key
          )
          VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9)
        `,
        [
          input.pageId,
          section.sectionType,
          section.title ?? "",
          index,
          JSON.stringify(section.content ?? {}),
          JSON.stringify(section.settings ?? {}),
          JSON.stringify(section.visibilityRules ?? {}),
          JSON.stringify(section.displayConditions ?? {}),
          section.abVariantKey ?? null,
        ]
      );
    }
  });
}
