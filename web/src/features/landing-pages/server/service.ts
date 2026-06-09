import "server-only";

import { query, withTransaction } from "@/lib/database";
import { getLandingPageTemplate } from "@/features/landing-pages/templates";
import type {
  AbExperiment,
  AbExperimentMetric,
  AbExperimentStatus,
  Campaign,
  CampaignChannel,
  CampaignStatus,
  LandingPage,
  LandingPageSection,
  LandingPageSectionType,
  LandingPageStatus,
  LandingPageType,
  LandingPageWithSource,
} from "@/features/landing-pages/types";

type CreateLandingPageFromTemplateInput = {
  sourceOfferingId: string;
  templateId: string;
  name?: string;
  slug?: string;
  status?: LandingPageStatus;
};

type LandingPageSectionInput = {
  sectionType: LandingPageSectionType;
  content: Record<string, unknown>;
};

type LandingPageRow = {
  id: string;
  source_offering_id: string | null;
  name: string;
  slug: string;
  page_type: LandingPageType;
  status: LandingPageStatus;
  theme_config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  section_count?: string | number;
  campaign_count?: string | number;
};

type LandingPageWithSourceRow = LandingPageRow & {
  source_offering_name: string | null;
  source_offering_slug: string | null;
  source_offering_type: LandingPageWithSource["sourceOfferingType"] | null;
  source_template_engine: LandingPageWithSource["sourceTemplateEngine"] | null;
};

type LandingPageSectionRow = {
  id: string;
  landing_page_id: string;
  section_type: LandingPageSectionType;
  sort_order: number;
  content: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type CampaignRow = {
  id: string;
  name: string;
  channel: CampaignChannel;
  landing_page_id: string;
  status: CampaignStatus;
  budget: string | number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

type AbExperimentRow = {
  id: string;
  name: string;
  status: AbExperimentStatus;
  primary_metric: AbExperimentMetric;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

function toNumber(value: string | number | undefined) {
  return Number(value ?? 0);
}

function mapLandingPage(row: LandingPageRow): LandingPage {
  return {
    id: row.id,
    sourceOfferingId: row.source_offering_id ?? undefined,
    name: row.name,
    slug: row.slug,
    pageType: row.page_type,
    status: row.status,
    themeConfig: row.theme_config ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sectionCount: row.section_count === undefined ? undefined : toNumber(row.section_count),
    campaignCount: row.campaign_count === undefined ? undefined : toNumber(row.campaign_count),
  };
}

function mapLandingPageWithSource(row: LandingPageWithSourceRow): LandingPageWithSource {
  return {
    ...mapLandingPage(row),
    sourceOfferingName: row.source_offering_name ?? undefined,
    sourceOfferingSlug: row.source_offering_slug ?? undefined,
    sourceOfferingType: row.source_offering_type ?? undefined,
    sourceTemplateEngine: row.source_template_engine ?? undefined,
  };
}

function mapLandingPageSection(row: LandingPageSectionRow): LandingPageSection {
  return {
    id: row.id,
    landingPageId: row.landing_page_id,
    sectionType: row.section_type,
    sortOrder: row.sort_order,
    content: row.content ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    name: row.name,
    channel: row.channel,
    landingPageId: row.landing_page_id,
    status: row.status,
    budget: toNumber(row.budget),
    startedAt: row.started_at ?? undefined,
    endedAt: row.ended_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAbExperiment(row: AbExperimentRow): AbExperiment {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    primaryMetric: row.primary_metric,
    startedAt: row.started_at ?? undefined,
    endedAt: row.ended_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const landingPageWithSourceSelect = `
  SELECT
    pages.*,
    offerings.name AS source_offering_name,
    offerings.slug AS source_offering_slug,
    offerings.offering_type AS source_offering_type,
    offerings.template_engine AS source_template_engine
  FROM landing_pages pages
  LEFT JOIN offerings ON offerings.id = pages.source_offering_id
`;

export async function listLandingPagesBySourceOfferingId(sourceOfferingId: string): Promise<LandingPage[]> {
  const result = await query<LandingPageRow>(
    `
      SELECT
        pages.*,
        COUNT(DISTINCT sections.id) AS section_count,
        COUNT(DISTINCT campaigns.id) AS campaign_count
      FROM landing_pages pages
      LEFT JOIN landing_page_sections sections ON sections.landing_page_id = pages.id
      LEFT JOIN campaigns ON campaigns.landing_page_id = pages.id
      WHERE pages.source_offering_id = $1
      GROUP BY pages.id
      ORDER BY pages.created_at DESC
    `,
    [sourceOfferingId]
  );

  return result.rows.map(mapLandingPage);
}

export async function listAllLandingPages(): Promise<LandingPageWithSource[]> {
  const result = await query<LandingPageWithSourceRow>(
    `
      SELECT
        pages.*,
        offerings.name AS source_offering_name,
        offerings.slug AS source_offering_slug,
        offerings.offering_type AS source_offering_type,
        offerings.template_engine AS source_template_engine,
        COUNT(DISTINCT sections.id) AS section_count,
        COUNT(DISTINCT campaigns.id) AS campaign_count
      FROM landing_pages pages
      LEFT JOIN offerings ON offerings.id = pages.source_offering_id
      LEFT JOIN landing_page_sections sections ON sections.landing_page_id = pages.id
      LEFT JOIN campaigns ON campaigns.landing_page_id = pages.id
      GROUP BY pages.id, offerings.id
      ORDER BY pages.updated_at DESC
    `
  );

  return result.rows.map(mapLandingPageWithSource);
}

export async function listPublishedLandingPages(): Promise<LandingPageWithSource[]> {
  const result = await query<LandingPageWithSourceRow>(
    `${landingPageWithSourceSelect}
     WHERE pages.status = 'published'
       AND pages.source_offering_id IS NOT NULL
     ORDER BY pages.updated_at DESC`
  );

  return result.rows.map(mapLandingPageWithSource);
}

export async function getLandingPageById(landingPageId: string): Promise<LandingPageWithSource | null> {
  const result = await query<LandingPageWithSourceRow>(
    `${landingPageWithSourceSelect}
     WHERE pages.id = $1
     LIMIT 1`,
    [landingPageId]
  );

  return result.rows[0] ? mapLandingPageWithSource(result.rows[0]) : null;
}

export async function getPublishedLandingPageBySlug(slug: string): Promise<LandingPageWithSource | null> {
  const result = await query<LandingPageWithSourceRow>(
    `${landingPageWithSourceSelect}
     WHERE pages.slug = $1
       AND pages.status = 'published'
     LIMIT 1`,
    [slug]
  );

  return result.rows[0] ? mapLandingPageWithSource(result.rows[0]) : null;
}

export async function listLandingPageSections(landingPageId: string): Promise<LandingPageSection[]> {
  const result = await query<LandingPageSectionRow>(
    `
      SELECT *
      FROM landing_page_sections
      WHERE landing_page_id = $1
      ORDER BY sort_order ASC, created_at ASC
    `,
    [landingPageId]
  );

  return result.rows.map(mapLandingPageSection);
}

export async function updateLandingPage(input: {
  landingPageId: string;
  sourceOfferingId: string;
  name: string;
  slug: string;
  status: LandingPageStatus;
  header: Record<string, unknown>;
  footer: Record<string, unknown>;
  sections: LandingPageSectionInput[];
}): Promise<LandingPage | null> {
  if (!input.name.trim()) {
    throw new Error("LANDING_PAGE_NAME_REQUIRED");
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    throw new Error("LANDING_PAGE_INVALID_SLUG");
  }

  return await withTransaction(async (execute) => {
    const pageResult = await execute<LandingPageRow>(
      `
        UPDATE landing_pages
        SET
          source_offering_id = $2,
          name = $3,
          slug = $4,
          status = $5,
          theme_config = theme_config || $6::jsonb,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [
        input.landingPageId,
        input.sourceOfferingId,
        input.name.trim(),
        input.slug,
        input.status,
        JSON.stringify({
          header: input.header,
          footer: input.footer,
        }),
      ]
    );

    const pageRow = pageResult.rows[0];
    if (!pageRow) {
      return null;
    }

    await execute("DELETE FROM landing_page_sections WHERE landing_page_id = $1", [input.landingPageId]);

    for (const [index, section] of input.sections.entries()) {
      await execute(
        `
          INSERT INTO landing_page_sections (
            landing_page_id,
            section_type,
            sort_order,
            content
          )
          VALUES ($1, $2, $3, $4::jsonb)
        `,
        [input.landingPageId, section.sectionType, index * 10, JSON.stringify(section.content)]
      );
    }

    return mapLandingPage(pageRow);
  });
}

export async function listCampaignsByLandingPageIds(landingPageIds: string[]): Promise<Campaign[]> {
  if (landingPageIds.length === 0) {
    return [];
  }

  const result = await query<CampaignRow>(
    `
      SELECT *
      FROM campaigns
      WHERE landing_page_id = ANY($1::text[])
      ORDER BY created_at DESC
    `,
    [landingPageIds]
  );

  return result.rows.map(mapCampaign);
}

export async function listAbExperiments(): Promise<AbExperiment[]> {
  const result = await query<AbExperimentRow>(
    `
      SELECT *
      FROM ab_experiments
      ORDER BY created_at DESC
    `
  );

  return result.rows.map(mapAbExperiment);
}

export async function createLandingPageFromTemplate(input: CreateLandingPageFromTemplateInput): Promise<LandingPage> {
  const template = getLandingPageTemplate(input.templateId);
  if (!template) {
    throw new Error("LANDING_PAGE_TEMPLATE_NOT_FOUND");
  }

  const name = (input.name || template.name).trim();
  const slug = (input.slug || template.slug).trim();
  const status = input.status ?? "draft";

  if (!name) {
    throw new Error("LANDING_PAGE_NAME_REQUIRED");
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("LANDING_PAGE_INVALID_SLUG");
  }

  return await withTransaction(async (execute) => {
    const pageResult = await execute<LandingPageRow>(
      `
        INSERT INTO landing_pages (
          source_offering_id,
          name,
          slug,
          page_type,
          status,
          theme_config
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
        RETURNING *
      `,
      [
        input.sourceOfferingId,
        name,
        slug,
        template.pageType,
        status,
        JSON.stringify(template.themeConfig),
      ]
    );
    const landingPage = mapLandingPage(pageResult.rows[0]);

    for (const [index, section] of template.sections.entries()) {
      await execute(
        `
          INSERT INTO landing_page_sections (
            landing_page_id,
            section_type,
            sort_order,
            content
          )
          VALUES ($1, $2, $3, $4::jsonb)
        `,
        [landingPage.id, section.sectionType, index * 10, JSON.stringify(section.content)]
      );
    }

    return landingPage;
  });
}

export async function deleteLandingPage(landingPageId: string): Promise<boolean> {
  const result = await query<LandingPageRow>(
    `
      DELETE FROM landing_pages
      WHERE id = $1
      RETURNING *
    `,
    [landingPageId]
  );

  return (result.rowCount ?? 0) > 0;
}
