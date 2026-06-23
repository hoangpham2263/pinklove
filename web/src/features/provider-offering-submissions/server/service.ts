import "server-only";

import type { OfferingFulfillmentType } from "@/features/offerings/types";
import { createAdminNotification } from "@/features/notifications/server/service";
import { getOfferingById } from "@/features/offerings/server/service";
import { upsertOfferingSearchDocument } from "@/features/offerings/server/search-documents";
import { recordDomainEvent } from "@/features/platform/server/domain-events";
import { getProviderByUserId, upsertProviderServiceForOffering } from "@/features/providers/server/service";
import { getProviderServiceOfferingTypeKey, PROVIDER_SERVICE_KIND_VALUES } from "@/features/provider-offering-submissions/config/service-kinds";
import { formatVnd } from "@/lib/currency";
import type {
  ProviderOfferingReviewStatus,
  OfferingProviderSupplier,
  OfferingProviderSupplierSource,
  OfferingProviderSupplierStatus,
  AvailableProviderSupplyOffering,
  ProviderOfferingSubmission,
  ProviderOfferingSubmissionActorType,
  ProviderOfferingSubmissionDetail,
  ProviderOfferingSubmissionEvent,
  ProviderOfferingSubmissionEventType,
  ProviderOfferingSubmissionType,
  ProviderOfferingSupplierRequest,
  ProviderOfferingSupplierRequestStatus,
  AdminProviderSupplySourcingOffering,
} from "@/features/provider-offering-submissions/types";
import { query, withTransaction, type DbExecutor } from "@/lib/database";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type SubmissionRow = {
  id: string;
  provider_user_id: string;
  provider_username: string;
  provider_display_name: string | null;
  linked_offering_id: string | null;
  linked_offering_slug: string | null;
  linked_offering_name: string | null;
  category_id: string | null;
  category_name: string | null;
  submission_type: ProviderOfferingSubmissionType;
  review_status: ProviderOfferingReviewStatus;
  name: string;
  slug_candidate: string;
  excerpt: string;
  description: string;
  thumbnail_url: string;
  fulfillment_type: OfferingFulfillmentType;
  service_kind: string;
  duration_minutes: string;
  service_area: string;
  purchase_cost: string;
  proposed_stock_quantity: string;
  low_stock_threshold: string;
  allow_backorder: boolean;
  provider_sku: string;
  provider_note: string;
  admin_sell_price: string | null;
  review_note: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reviewed_by_username: string | null;
  created_at: string;
  updated_at: string;
};

type SubmissionEventRow = {
  id: string;
  submission_id: string;
  actor_user_id: string | null;
  actor_username: string | null;
  actor_type: ProviderOfferingSubmissionActorType;
  event_type: ProviderOfferingSubmissionEventType;
  message: string;
  created_at: string;
};

type SupplierRow = {
  id: string;
  offering_id: string;
  offering_name: string;
  offering_slug: string;
  offering_thumbnail_url: string | null;
  offering_price: string;
  provider_user_id: string;
  provider_username: string;
  provider_display_name: string | null;
  status: OfferingProviderSupplierStatus;
  source: OfferingProviderSupplierSource;
  purchase_cost: string;
  provider_sku: string;
  lead_time_days: string;
  monthly_capacity: string;
  service_area: string;
  quality_note: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

type SupplierRequestRow = {
  id: string;
  offering_id: string;
  offering_name: string;
  offering_slug: string;
  offering_thumbnail_url: string | null;
  offering_price: string;
  provider_user_id: string;
  provider_username: string;
  provider_display_name: string | null;
  review_status: ProviderOfferingSupplierRequestStatus;
  purchase_cost: string;
  provider_sku: string;
  lead_time_days: string;
  monthly_capacity: string;
  service_area: string;
  sample_image_url: string;
  material_note: string;
  quality_note: string;
  provider_note: string;
  review_note: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
};

type AvailableOfferingRow = {
  id: string;
  name: string;
  slug: string;
  thumbnail_url: string | null;
  excerpt: string | null;
  offering_type: string;
  price: string;
  supplier_status: OfferingProviderSupplierStatus | null;
  request_status: ProviderOfferingSupplierRequestStatus | null;
};

type SaveProviderOfferingSubmissionInput = {
  submissionId?: string;
  providerId: string;
  linkedOfferingId?: string;
  categoryId?: string;
  submissionType: ProviderOfferingSubmissionType;
  name: string;
  slugCandidate: string;
  excerpt?: string;
  description?: string;
  thumbnailUrl?: string;
  fulfillmentType: OfferingFulfillmentType;
  serviceKind?: string;
  durationMinutes?: number;
  serviceArea?: string;
  purchaseCost: number;
  proposedStockQuantity: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  providerSku?: string;
  providerNote?: string;
};

type ReviewProviderOfferingSubmissionInput = {
  submissionId: string;
  actorUserId: string;
  nextStatus: Extract<ProviderOfferingReviewStatus, "under_review" | "changes_requested" | "rejected" | "archived">;
  reviewNote?: string;
};

type ApproveProviderOfferingSubmissionInput = {
  submissionId: string;
  actorUserId: string;
  adminSellPrice: number;
  reviewNote?: string;
  assignProviderSupplier?: boolean;
};

type CreateSupplierRequestInput = {
  offeringId: string;
  providerId: string;
  purchaseCost: number;
  providerSku?: string;
  leadTimeDays: number;
  monthlyCapacity: number;
  serviceArea?: string;
  sampleImageUrl?: string;
  materialNote?: string;
  qualityNote?: string;
  providerNote?: string;
};

type ReviewSupplierRequestInput = {
  requestId: string;
  actorUserId: string;
  nextStatus: Exclude<ProviderOfferingSupplierRequestStatus, "submitted" | "approved"> | "approved";
  adminSellPrice?: number;
  reviewNote?: string;
};

type UpdateOfferingProviderSupplierStatusInput = {
  supplierId: string;
  actorUserId: string;
  nextStatus: OfferingProviderSupplierStatus;
  adminSellPrice?: number;
  reviewNote?: string;
};

const SUBMISSION_SELECT = `
  SELECT
    s.id,
    s.provider_user_id,
    provider.account_name AS provider_username,
    COALESCE(NULLIF(BTRIM(provider_profile.display_name), ''), NULLIF(BTRIM(provider_profile.full_name), '')) AS provider_display_name,
    s.linked_offering_id,
    linked.slug AS linked_offering_slug,
    linked.name AS linked_offering_name,
    s.category_id,
    category.name AS category_name,
    s.submission_type,
    s.review_status,
    s.name,
    s.slug_candidate,
    s.excerpt,
    s.description,
    s.thumbnail_url,
    s.fulfillment_type,
    s.service_kind,
    s.duration_minutes::text,
    s.service_area,
    s.purchase_cost::text,
    s.proposed_stock_quantity::text,
    s.low_stock_threshold::text,
    s.allow_backorder,
    s.provider_sku,
    s.provider_note,
    s.admin_sell_price::text,
    s.review_note,
    s.submitted_at::text,
    s.reviewed_at::text,
    s.reviewed_by::text,
    reviewer.account_name AS reviewed_by_username,
    s.created_at::text,
    s.updated_at::text
  FROM provider_offering_submissions s
  JOIN users provider ON provider.id = s.provider_user_id
  LEFT JOIN user_profiles provider_profile ON provider_profile.user_id = provider.id
  LEFT JOIN offerings linked ON linked.id = s.linked_offering_id
  LEFT JOIN offering_categories category ON category.id = s.category_id
  LEFT JOIN users reviewer ON reviewer.id = s.reviewed_by
`;

const SUPPLIER_SELECT = `
  SELECT
    supplier.id,
    supplier.offering_id,
    offering.name AS offering_name,
    offering.slug AS offering_slug,
    offering.thumbnail_url AS offering_thumbnail_url,
    offering.price::text AS offering_price,
    supplier.provider_user_id,
    provider.account_name AS provider_username,
    COALESCE(NULLIF(BTRIM(provider_profile.display_name), ''), NULLIF(BTRIM(provider_profile.full_name), '')) AS provider_display_name,
    supplier.status,
    supplier.source,
    supplier.purchase_cost::text,
    supplier.provider_sku,
    supplier.lead_time_days::text,
    supplier.monthly_capacity::text,
    supplier.service_area,
    supplier.quality_note,
    supplier.approved_by::text,
    supplier.approved_at::text,
    supplier.created_at::text,
    supplier.updated_at::text
  FROM offering_provider_suppliers supplier
  JOIN offerings offering ON offering.id = supplier.offering_id
  JOIN users provider ON provider.id = supplier.provider_user_id
  LEFT JOIN user_profiles provider_profile ON provider_profile.user_id = provider.id
`;

const SUPPLIER_REQUEST_SELECT = `
  SELECT
    request.id,
    request.offering_id,
    offering.name AS offering_name,
    offering.slug AS offering_slug,
    offering.thumbnail_url AS offering_thumbnail_url,
    offering.price::text AS offering_price,
    request.provider_user_id,
    provider.account_name AS provider_username,
    COALESCE(NULLIF(BTRIM(provider_profile.display_name), ''), NULLIF(BTRIM(provider_profile.full_name), '')) AS provider_display_name,
    request.review_status,
    request.purchase_cost::text,
    request.provider_sku,
    request.lead_time_days::text,
    request.monthly_capacity::text,
    request.service_area,
    request.sample_image_url,
    request.material_note,
    request.quality_note,
    request.provider_note,
    request.review_note,
    request.submitted_at::text,
    request.reviewed_at::text,
    request.reviewed_by::text,
    request.created_at::text,
    request.updated_at::text
  FROM provider_offering_supplier_requests request
  JOIN offerings offering ON offering.id = request.offering_id
  JOIN users provider ON provider.id = request.provider_user_id
  LEFT JOIN user_profiles provider_profile ON provider_profile.user_id = provider.id
`;

function toNumber(value: string | null | undefined) {
  return Number(value ?? "0");
}

function toInteger(value: string | null | undefined) {
  return Math.max(0, Math.trunc(Number(value ?? "0")));
}

function normalizeAdminSellPrice(value: number | undefined) {
  if (!Number.isFinite(value) || value === undefined || value <= 0) {
    throw new Error("SELL_PRICE_REQUIRED");
  }

  return value;
}

function mapSubmissionRow(row: SubmissionRow): ProviderOfferingSubmission {
  return {
    id: row.id,
    providerId: row.provider_user_id,
    providerUsername: row.provider_username,
    providerDisplayName: row.provider_display_name ?? row.provider_username,
    linkedOfferingId: row.linked_offering_id ?? undefined,
    linkedOfferingSlug: row.linked_offering_slug ?? undefined,
    linkedOfferingName: row.linked_offering_name ?? undefined,
    categoryId: row.category_id ?? undefined,
    categoryName: row.category_name ?? undefined,
    submissionType: row.submission_type,
    reviewStatus: row.review_status,
    name: row.name,
    slugCandidate: row.slug_candidate,
    excerpt: row.excerpt,
    description: row.description,
    thumbnailUrl: row.thumbnail_url,
    fulfillmentType: row.fulfillment_type,
    serviceKind: row.service_kind,
    durationMinutes: toInteger(row.duration_minutes),
    serviceArea: row.service_area,
    purchaseCost: toNumber(row.purchase_cost),
    proposedStockQuantity: toNumber(row.proposed_stock_quantity),
    lowStockThreshold: toNumber(row.low_stock_threshold),
    allowBackorder: row.allow_backorder,
    providerSku: row.provider_sku,
    providerNote: row.provider_note,
    adminSellPrice: row.admin_sell_price ? toNumber(row.admin_sell_price) : undefined,
    reviewNote: row.review_note,
    submittedAt: row.submitted_at ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewedByUserId: row.reviewed_by ?? undefined,
    reviewedByUsername: row.reviewed_by_username ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSupplierRow(row: SupplierRow): OfferingProviderSupplier {
  return {
    id: row.id,
    offeringId: row.offering_id,
    offeringName: row.offering_name,
    offeringSlug: row.offering_slug,
    offeringThumbnailUrl: row.offering_thumbnail_url ?? "",
    offeringPrice: toNumber(row.offering_price),
    providerId: row.provider_user_id,
    providerUsername: row.provider_username,
    providerDisplayName: row.provider_display_name ?? row.provider_username,
    status: row.status,
    source: row.source,
    purchaseCost: toNumber(row.purchase_cost),
    providerSku: row.provider_sku,
    leadTimeDays: toInteger(row.lead_time_days),
    monthlyCapacity: toInteger(row.monthly_capacity),
    serviceArea: row.service_area,
    qualityNote: row.quality_note,
    approvedByUserId: row.approved_by ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSupplierRequestRow(row: SupplierRequestRow): ProviderOfferingSupplierRequest {
  return {
    id: row.id,
    offeringId: row.offering_id,
    offeringName: row.offering_name,
    offeringSlug: row.offering_slug,
    offeringThumbnailUrl: row.offering_thumbnail_url ?? "",
    offeringPrice: toNumber(row.offering_price),
    providerId: row.provider_user_id,
    providerUsername: row.provider_username,
    providerDisplayName: row.provider_display_name ?? row.provider_username,
    reviewStatus: row.review_status,
    purchaseCost: toNumber(row.purchase_cost),
    providerSku: row.provider_sku,
    leadTimeDays: toInteger(row.lead_time_days),
    monthlyCapacity: toInteger(row.monthly_capacity),
    serviceArea: row.service_area,
    sampleImageUrl: row.sample_image_url,
    materialNote: row.material_note,
    qualityNote: row.quality_note,
    providerNote: row.provider_note,
    reviewNote: row.review_note,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewedByUserId: row.reviewed_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEventRow(row: SubmissionEventRow): ProviderOfferingSubmissionEvent {
  return {
    id: row.id,
    submissionId: row.submission_id,
    actorUserId: row.actor_user_id ?? undefined,
    actorUsername: row.actor_username ?? undefined,
    actorType: row.actor_type,
    eventType: row.event_type,
    message: row.message,
    createdAt: row.created_at,
  };
}

async function getSubmissionRowById(submissionId: string): Promise<SubmissionRow | null> {
  const result = await query<SubmissionRow>(
    `
      ${SUBMISSION_SELECT}
      WHERE s.id = $1
      LIMIT 1
    `,
    [submissionId]
  );

  return result.rows[0] ?? null;
}

async function getSubmissionEvents(submissionId: string): Promise<ProviderOfferingSubmissionEvent[]> {
  const result = await query<SubmissionEventRow>(
    `
      SELECT
        e.id,
        e.submission_id,
        e.actor_user_id,
        actor.account_name AS actor_username,
        e.actor_type,
        e.event_type,
        e.message,
        e.created_at::text
      FROM provider_offering_submission_events e
      LEFT JOIN users actor ON actor.id = e.actor_user_id
      WHERE e.submission_id = $1
      ORDER BY e.created_at DESC, e.id DESC
    `,
    [submissionId]
  );

  return result.rows.map(mapEventRow);
}

async function appendSubmissionEvent(
  execute: DbExecutor,
  input: {
    submissionId: string;
    actorUserId?: string;
    actorType: ProviderOfferingSubmissionActorType;
    eventType: ProviderOfferingSubmissionEventType;
    message: string;
  }
) {
  await execute(
    `
      INSERT INTO provider_offering_submission_events (
        submission_id,
        actor_user_id,
        actor_type,
        event_type,
        message
      )
      VALUES ($1, $2, $3, $4, $5)
    `,
    [input.submissionId, input.actorUserId ?? null, input.actorType, input.eventType, input.message]
  );
}

async function upsertOfferingProviderSupplier(
  execute: DbExecutor,
  input: {
    offeringId: string;
    providerId: string;
    actorUserId?: string;
    source: OfferingProviderSupplierSource;
    purchaseCost: number;
    providerSku?: string;
    leadTimeDays?: number;
    monthlyCapacity?: number;
    serviceArea?: string;
    qualityNote?: string;
  }
) {
  await execute(
    `
      INSERT INTO offering_provider_suppliers (
        offering_id,
        provider_user_id,
        status,
        source,
        purchase_cost,
        provider_sku,
        lead_time_days,
        monthly_capacity,
        service_area,
        quality_note,
        approved_by,
        approved_at
      )
      VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (offering_id, provider_user_id) DO UPDATE
      SET
        status = 'active',
        source = EXCLUDED.source,
        purchase_cost = EXCLUDED.purchase_cost,
        provider_sku = EXCLUDED.provider_sku,
        lead_time_days = EXCLUDED.lead_time_days,
        monthly_capacity = EXCLUDED.monthly_capacity,
        service_area = EXCLUDED.service_area,
        quality_note = EXCLUDED.quality_note,
        approved_by = EXCLUDED.approved_by,
        approved_at = NOW(),
        updated_at = NOW()
    `,
    [
      input.offeringId,
      input.providerId,
      input.source,
      input.purchaseCost,
      (input.providerSku ?? "").trim(),
      Math.max(0, Math.trunc(input.leadTimeDays ?? 0)),
      Math.max(0, Math.trunc(input.monthlyCapacity ?? 0)),
      (input.serviceArea ?? "").trim(),
      (input.qualityNote ?? "").trim(),
      input.actorUserId ?? null,
    ]
  );
}

async function assertLinkedOfferingOwnership(providerId: string, linkedOfferingId?: string) {
  if (!linkedOfferingId) {
    return null;
  }

  const offering = await getOfferingById(linkedOfferingId);
  const provider = await getProviderByUserId(providerId);
  if (!offering || offering.offeringType === "digital_template" || offering.ownerType !== "provider" || offering.ownerProviderId !== provider?.id) {
    throw new Error("LINKED_OFFERING_NOT_ALLOWED");
  }

  return offering;
}

export async function listProviderOfferingSubmissionsForProvider(providerId: string): Promise<ProviderOfferingSubmission[]> {
  const result = await query<SubmissionRow>(
    `
      ${SUBMISSION_SELECT}
      WHERE s.provider_user_id = $1
      ORDER BY s.updated_at DESC
    `,
    [providerId]
  );

  return result.rows.map(mapSubmissionRow);
}

export async function listProviderOfferingSubmissionsForAdmin(): Promise<ProviderOfferingSubmission[]> {
  const result = await query<SubmissionRow>(
    `
      ${SUBMISSION_SELECT}
      ORDER BY
        CASE s.review_status
          WHEN 'submitted' THEN 0
          WHEN 'under_review' THEN 1
          WHEN 'changes_requested' THEN 2
          WHEN 'draft' THEN 3
          WHEN 'approved' THEN 4
          WHEN 'rejected' THEN 5
          ELSE 6
        END,
        s.updated_at DESC
    `
  );

  return result.rows.map(mapSubmissionRow);
}

export async function listAvailableOfferingsForProviderSupply(providerId: string): Promise<AvailableProviderSupplyOffering[]> {
  const result = await query<AvailableOfferingRow>(
    `
      SELECT
        offering.id,
        offering.name,
        offering.slug,
        offering.thumbnail_url,
        offering.excerpt,
        offering.offering_type,
        offering.price::text,
        supplier.status AS supplier_status,
        request.review_status AS request_status
      FROM offerings offering
      INNER JOIN physical_offerings physical ON physical.offering_id = offering.id
      LEFT JOIN offering_provider_suppliers supplier
        ON supplier.offering_id = offering.id
       AND supplier.provider_user_id = $1
       AND supplier.status <> 'revoked'
      LEFT JOIN LATERAL (
        SELECT review_status
        FROM provider_offering_supplier_requests request
        WHERE request.offering_id = offering.id
          AND request.provider_user_id = $1
          AND request.review_status IN ('submitted', 'under_review', 'changes_requested')
        ORDER BY request.updated_at DESC
        LIMIT 1
      ) request ON TRUE
      WHERE offering.status = 'published'
        AND offering.offering_type <> 'digital_template'
        AND physical.allow_provider_supply = TRUE
      ORDER BY offering.updated_at DESC
    `,
    [providerId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    thumbnailUrl: row.thumbnail_url ?? "",
    excerpt: row.excerpt ?? "",
    offeringType: row.offering_type,
    price: toNumber(row.price),
    supplierStatus: row.supplier_status ?? undefined,
    requestStatus: row.request_status ?? undefined,
  }));
}

export async function listProviderSupplySourcingOfferingsForAdmin(): Promise<AdminProviderSupplySourcingOffering[]> {
  const result = await query<{
    id: string;
    name: string;
    slug: string;
    price: string;
    fulfillment_type: OfferingFulfillmentType;
    allow_provider_supply: boolean | null;
    open_request_count: string;
    approved_supplier_count: string;
  }>(
    `
      SELECT
        offering.id,
        offering.name,
        offering.slug,
        offering.price::text,
        offering.fulfillment_type,
        physical.allow_provider_supply,
        COUNT(DISTINCT request.id) FILTER (
          WHERE request.review_status IN ('submitted', 'under_review', 'changes_requested')
        )::text AS open_request_count,
        COUNT(DISTINCT supplier.id) FILTER (
          WHERE supplier.status = 'active'
        )::text AS approved_supplier_count
      FROM offerings offering
      LEFT JOIN physical_offerings physical ON physical.offering_id = offering.id
      LEFT JOIN provider_offering_supplier_requests request ON request.offering_id = offering.id
      LEFT JOIN offering_provider_suppliers supplier ON supplier.offering_id = offering.id
      WHERE offering.status = 'published'
        AND offering.offering_type <> 'digital_template'
      GROUP BY offering.id, physical.allow_provider_supply
      ORDER BY
        COALESCE(physical.allow_provider_supply, FALSE) DESC,
        offering.updated_at DESC,
        offering.name ASC
    `
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: toNumber(row.price),
    fulfillmentType: row.fulfillment_type,
    allowProviderSupply: Boolean(row.allow_provider_supply),
    openRequestCount: toInteger(row.open_request_count),
    approvedSupplierCount: toInteger(row.approved_supplier_count),
  }));
}

export async function announceProviderSupplySourcing(input: {
  offeringId: string;
  actorUserId: string;
  note?: string;
}): Promise<void> {
  const offeringResult = await query<{
    id: string;
    name: string;
    slug: string;
    status: string;
    offering_type: string;
    fulfillment_type: OfferingFulfillmentType;
  }>(
    `
      SELECT id, name, slug, status, offering_type, fulfillment_type
      FROM offerings
      WHERE id = $1
      LIMIT 1
    `,
    [input.offeringId]
  );
  const offering = offeringResult.rows[0];
  if (!offering || offering.status !== "published" || offering.offering_type === "digital_template") {
    throw new Error("OFFERING_NOT_AVAILABLE");
  }

  await query(
    `
      INSERT INTO physical_offerings (offering_id, fulfillment_type, allow_provider_supply)
      VALUES ($1, $2, TRUE)
      ON CONFLICT (offering_id) DO UPDATE
      SET
        fulfillment_type = EXCLUDED.fulfillment_type,
        allow_provider_supply = TRUE,
        updated_at = NOW()
    `,
    [offering.id, offering.fulfillment_type]
  );

  const note = (input.note ?? "").trim();
  await createAdminNotification({
    actorUserId: input.actorUserId,
    title: "Có dịch vụ/sản phẩm cần provider",
    body: note ? `${offering.name}: ${note}` : `${offering.name} đang cần provider gửi báo giá, năng lực và thông tin cung cấp.`,
    linkUrl: ROUTES.PROVIDER.AVAILABLE_TEMPLATES,
    audienceType: "role",
    roles: [USER_ROLES.PROVIDER],
  });
}

export async function listLiveOfferingsForProviderSubmissions(providerUserId: string): Promise<Array<{ id: string; name: string; slug: string }>> {
  const provider = await getProviderByUserId(providerUserId);
  const result = await query<{ id: string; name: string; slug: string }>(
    `
      SELECT DISTINCT
        offering.id,
        offering.name,
        offering.slug
      FROM offerings offering
      LEFT JOIN offering_provider_suppliers supplier
        ON supplier.offering_id = offering.id
       AND supplier.provider_user_id = $1
       AND supplier.status IN ('active', 'paused', 'suspended')
      LEFT JOIN physical_offerings physical
        ON physical.offering_id = offering.id
      WHERE offering.status = 'published'
        AND offering.offering_type <> 'digital_template'
        AND (
          supplier.id IS NOT NULL
          OR ($2::text IS NOT NULL AND physical.provider_id::text = $2::text)
        )
      ORDER BY offering.name ASC
    `,
    [providerUserId, provider?.id ?? null]
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
  }));
}

export async function listSupplierRequestsForProvider(providerId: string): Promise<ProviderOfferingSupplierRequest[]> {
  const result = await query<SupplierRequestRow>(
    `
      ${SUPPLIER_REQUEST_SELECT}
      WHERE request.provider_user_id = $1
      ORDER BY request.updated_at DESC
    `,
    [providerId]
  );

  return result.rows.map(mapSupplierRequestRow);
}

export async function listApprovedSupplierOptionsForOfferings(offeringIds: string[]): Promise<Array<{ id: string; label: string }>> {
  const uniqueOfferingIds = Array.from(new Set(offeringIds.filter(Boolean)));
  if (uniqueOfferingIds.length === 0) {
    return [];
  }

  const result = await query<{ id: string; label: string }>(
    `
      SELECT
        supplier.provider_user_id AS id,
        COALESCE(NULLIF(BTRIM(profile.display_name), ''), NULLIF(BTRIM(profile.full_name), ''), provider.account_name) AS label
      FROM offering_provider_suppliers supplier
      JOIN users provider ON provider.id = supplier.provider_user_id
      LEFT JOIN user_profiles profile ON profile.user_id = provider.id
      WHERE supplier.offering_id = ANY($1::text[])
        AND supplier.status = 'active'
      GROUP BY supplier.provider_user_id, label
      HAVING COUNT(DISTINCT supplier.offering_id) = $2
      ORDER BY label ASC
    `,
    [uniqueOfferingIds, uniqueOfferingIds.length]
  );

  return result.rows;
}

export async function listOfferingProviderSuppliersForAdmin(): Promise<OfferingProviderSupplier[]> {
  const result = await query<SupplierRow>(
    `
      ${SUPPLIER_SELECT}
      ORDER BY
        CASE supplier.status
          WHEN 'active' THEN 0
          WHEN 'paused' THEN 1
          WHEN 'suspended' THEN 2
          ELSE 3
        END,
        supplier.updated_at DESC
    `
  );

  return result.rows.map(mapSupplierRow);
}

export async function listSupplierRequestsForAdmin(): Promise<ProviderOfferingSupplierRequest[]> {
  const result = await query<SupplierRequestRow>(
    `
      ${SUPPLIER_REQUEST_SELECT}
      ORDER BY
        CASE request.review_status
          WHEN 'submitted' THEN 0
          WHEN 'under_review' THEN 1
          WHEN 'changes_requested' THEN 2
          WHEN 'approved' THEN 3
          WHEN 'rejected' THEN 4
          ELSE 5
        END,
        request.updated_at DESC
    `
  );

  return result.rows.map(mapSupplierRequestRow);
}

export async function createSupplierRequest(input: CreateSupplierRequestInput): Promise<string> {
  const offering = await getOfferingById(input.offeringId);

  if (!offering || offering.status !== "published" || offering.offeringType === "digital_template" || !offering.allowProviderSupply) {
    throw new Error("OFFERING_NOT_AVAILABLE");
  }

  const existingSupplier = await query<{ id: string }>(
    `
      SELECT id
      FROM offering_provider_suppliers
      WHERE offering_id = $1
        AND provider_user_id = $2
        AND status IN ('active', 'paused', 'suspended')
      LIMIT 1
    `,
    [input.offeringId, input.providerId]
  );
  if (existingSupplier.rows[0]) {
    throw new Error("SUPPLIER_ALREADY_EXISTS");
  }

  const existingOpenRequest = await query<{ id: string; review_status: ProviderOfferingSupplierRequestStatus }>(
    `
      SELECT id, review_status
      FROM provider_offering_supplier_requests
      WHERE offering_id = $1
        AND provider_user_id = $2
        AND review_status IN ('submitted', 'under_review', 'changes_requested')
      LIMIT 1
    `,
    [input.offeringId, input.providerId]
  );
  const openRequest = existingOpenRequest.rows[0];
  if (openRequest?.review_status === "submitted" || openRequest?.review_status === "under_review") {
    throw new Error("SUPPLIER_REQUEST_ALREADY_OPEN");
  }

  if (openRequest?.review_status === "changes_requested") {
    await query(
      `
        UPDATE provider_offering_supplier_requests
        SET
          review_status = 'submitted',
          purchase_cost = $2,
          provider_sku = $3,
          lead_time_days = $4,
          monthly_capacity = $5,
          service_area = $6,
          sample_image_url = $7,
          material_note = $8,
          quality_note = $9,
          provider_note = $10,
          submitted_at = NOW(),
          reviewed_at = NULL,
          reviewed_by = NULL,
          updated_at = NOW()
        WHERE id = $1
      `,
      [
        openRequest.id,
        input.purchaseCost,
        (input.providerSku ?? "").trim(),
        Math.max(0, Math.trunc(input.leadTimeDays)),
        Math.max(0, Math.trunc(input.monthlyCapacity)),
        (input.serviceArea ?? "").trim(),
        (input.sampleImageUrl ?? "").trim(),
        (input.materialNote ?? "").trim(),
        (input.qualityNote ?? "").trim(),
        (input.providerNote ?? "").trim(),
      ]
    );

    await createAdminNotification({
      actorUserId: input.providerId,
      title: "Provider đã bổ sung supplier request",
      body: `${offering.name} vừa được provider bổ sung thông tin và gửi review lại.`,
      linkUrl: ROUTES.ADMIN.PROVIDER_OFFERINGS,
      audienceType: "role",
      roles: [USER_ROLES.ADMIN],
    });

    return openRequest.id;
  }

  const result = await query<{ id: string }>(
    `
      INSERT INTO provider_offering_supplier_requests (
        offering_id,
        provider_user_id,
        review_status,
        purchase_cost,
        provider_sku,
        lead_time_days,
        monthly_capacity,
        service_area,
        sample_image_url,
        material_note,
        quality_note,
        provider_note
      )
      VALUES ($1, $2, 'submitted', $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `,
    [
      input.offeringId,
      input.providerId,
      input.purchaseCost,
      (input.providerSku ?? "").trim(),
      Math.max(0, Math.trunc(input.leadTimeDays)),
      Math.max(0, Math.trunc(input.monthlyCapacity)),
      (input.serviceArea ?? "").trim(),
      (input.sampleImageUrl ?? "").trim(),
      (input.materialNote ?? "").trim(),
      (input.qualityNote ?? "").trim(),
      (input.providerNote ?? "").trim(),
    ]
  );

  await createAdminNotification({
    actorUserId: input.providerId,
    title: "Provider xin cung cấp mẫu",
    body: `${offering.name} vừa có yêu cầu supplier mới cần review.`,
    linkUrl: ROUTES.ADMIN.PROVIDER_OFFERINGS,
    audienceType: "role",
    roles: [USER_ROLES.ADMIN],
  });

  return result.rows[0].id;
}

export async function reviewSupplierRequest(input: ReviewSupplierRequestInput): Promise<void> {
  const requestResult = await query<SupplierRequestRow>(
    `
      ${SUPPLIER_REQUEST_SELECT}
      WHERE request.id = $1
      LIMIT 1
    `,
    [input.requestId]
  );
  const request = requestResult.rows[0];
  if (!request) {
    throw new Error("REQUEST_NOT_FOUND");
  }
  if (request.review_status === "approved") {
    throw new Error("REQUEST_FINALIZED");
  }

  const reviewNote = (input.reviewNote ?? "").trim();
  const adminSellPrice = input.nextStatus === "approved" ? normalizeAdminSellPrice(input.adminSellPrice) : undefined;
  await query(
    `
      UPDATE provider_offering_supplier_requests
      SET
        review_status = $2,
        review_note = $3,
        reviewed_by = $4,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
    `,
    [input.requestId, input.nextStatus, reviewNote, input.actorUserId]
  );

  if (input.nextStatus === "approved") {
    await query(
      `
        UPDATE offerings
        SET price = $2, updated_at = NOW()
        WHERE id = $1
      `,
      [request.offering_id, adminSellPrice]
    );

    await upsertOfferingProviderSupplier(query, {
      offeringId: request.offering_id,
      providerId: request.provider_user_id,
      actorUserId: input.actorUserId,
      source: "supplier_request",
      purchaseCost: toNumber(request.purchase_cost),
      providerSku: request.provider_sku,
      leadTimeDays: toInteger(request.lead_time_days),
      monthlyCapacity: toInteger(request.monthly_capacity),
      serviceArea: request.service_area,
      qualityNote: [request.material_note, request.quality_note, request.provider_note].filter(Boolean).join("\n\n"),
    });

    await query(
      `
        UPDATE offering_provider_suppliers
        SET
          status = 'revoked',
          quality_note = COALESCE(NULLIF(quality_note, ''), 'Admin đã chọn provider khác làm nguồn cung ứng chính.'),
          updated_at = NOW()
        WHERE offering_id = $1
          AND provider_user_id <> $2
          AND status IN ('active', 'paused', 'suspended')
      `,
      [request.offering_id, request.provider_user_id]
    );

    await query(
      `
        UPDATE provider_offering_supplier_requests
        SET
          review_status = 'rejected',
          review_note = COALESCE(NULLIF(review_note, ''), 'Admin đã chọn provider khác cho dịch vụ/sản phẩm này.'),
          reviewed_by = $3,
          reviewed_at = NOW(),
          updated_at = NOW()
        WHERE offering_id = $1
          AND id <> $2
          AND review_status IN ('submitted', 'under_review', 'changes_requested')
      `,
      [request.offering_id, input.requestId, input.actorUserId]
    );
  }

  await createAdminNotification({
    actorUserId: input.actorUserId,
    title: "Yêu cầu cung cấp mẫu đã được cập nhật",
    body:
      input.nextStatus === "approved"
        ? "Admin đã duyệt bạn làm supplier cho mẫu."
        : input.nextStatus === "changes_requested"
          ? "Admin yêu cầu bổ sung thông tin supplier request."
          : input.nextStatus === "rejected"
            ? "Admin đã từ chối supplier request."
            : "Admin đã cập nhật supplier request.",
    linkUrl: ROUTES.PROVIDER.SUPPLY_REQUESTS,
    audienceType: "users",
    userIds: [request.provider_user_id],
  });
}

export async function updateOfferingProviderSupplierStatus(input: UpdateOfferingProviderSupplierStatusInput): Promise<void> {
  const result = await query<SupplierRow>(
    `
      ${SUPPLIER_SELECT}
      WHERE supplier.id = $1
      LIMIT 1
    `,
    [input.supplierId]
  );
  const supplier = result.rows[0];
  if (!supplier) {
    throw new Error("SUPPLIER_NOT_FOUND");
  }

  const adminSellPrice = input.nextStatus === "active" ? normalizeAdminSellPrice(input.adminSellPrice) : undefined;
  const reviewNote = (input.reviewNote ?? "").trim();
  const qualityNote = reviewNote
    ? [supplier.quality_note, `Status ${input.nextStatus}: ${reviewNote}`].filter(Boolean).join("\n\n")
    : supplier.quality_note;

  await query(
    `
      UPDATE offering_provider_suppliers
      SET
        status = $2,
        quality_note = $3,
        updated_at = NOW()
      WHERE id = $1
    `,
    [input.supplierId, input.nextStatus, qualityNote]
  );

  if (input.nextStatus === "active") {
    await query(
      `
        UPDATE offerings
        SET price = $2, updated_at = NOW()
        WHERE id = $1
      `,
      [supplier.offering_id, adminSellPrice]
    );
  }

  await createAdminNotification({
    actorUserId: input.actorUserId,
    title: "Trạng thái supplier đã được cập nhật",
    body:
      input.nextStatus === "active"
        ? "Admin đã mở lại quyền cung cấp mẫu."
        : input.nextStatus === "paused"
          ? "Admin đã tạm dừng quyền cung cấp mẫu."
          : input.nextStatus === "suspended"
            ? "Admin đã suspend quyền cung cấp mẫu."
            : "Admin đã thu hồi quyền cung cấp mẫu.",
    linkUrl: ROUTES.PROVIDER.SUPPLY_REQUESTS,
    audienceType: "users",
    userIds: [supplier.provider_user_id],
  });
}

export async function getProviderOfferingSubmissionDetailForProvider(
  providerId: string,
  submissionId: string
): Promise<ProviderOfferingSubmissionDetail | null> {
  const row = await getSubmissionRowById(submissionId);
  if (!row || row.provider_user_id !== providerId) {
    return null;
  }

  return {
    ...mapSubmissionRow(row),
    events: await getSubmissionEvents(submissionId),
  };
}

export async function getProviderOfferingSubmissionDetailForAdmin(submissionId: string): Promise<ProviderOfferingSubmissionDetail | null> {
  const row = await getSubmissionRowById(submissionId);
  if (!row) {
    return null;
  }

  return {
    ...mapSubmissionRow(row),
    events: await getSubmissionEvents(submissionId),
  };
}

export async function saveProviderOfferingSubmission(input: SaveProviderOfferingSubmissionInput): Promise<string> {
  const linkedOfferingId = input.submissionType === "create" ? undefined : input.linkedOfferingId;
  await assertLinkedOfferingOwnership(input.providerId, linkedOfferingId);

  const name = input.name.trim();
  const slugCandidate = input.slugCandidate.trim();
  const excerpt = (input.excerpt ?? "").trim();
  const description = (input.description ?? "").trim();
  const thumbnailUrl = (input.thumbnailUrl ?? "").trim();
  const serviceKind = input.fulfillmentType === "service" && PROVIDER_SERVICE_KIND_VALUES.includes(input.serviceKind ?? "")
    ? input.serviceKind ?? "other"
    : "general";
  const durationMinutes = input.fulfillmentType === "service" ? Math.max(0, Math.trunc(input.durationMinutes ?? 0)) : 0;
  const serviceArea = input.fulfillmentType === "service" ? (input.serviceArea ?? "").trim() : "";
  const providerSku = (input.providerSku ?? "").trim();
  const providerNote = (input.providerNote ?? "").trim();

  if (!name || !slugCandidate) {
    throw new Error("INVALID_SUBMISSION");
  }

  if (input.submissionType !== "create" && !linkedOfferingId) {
    throw new Error("LINKED_OFFERING_REQUIRED");
  }

  return withTransaction(async (execute) => {
    if (input.submissionId) {
      const existing = await execute<{
        id: string;
        review_status: ProviderOfferingReviewStatus;
        provider_user_id: string;
      }>(
        `
          SELECT id, review_status, provider_user_id
          FROM provider_offering_submissions
          WHERE id = $1
          LIMIT 1
        `,
        [input.submissionId]
      );

      const row = existing.rows[0];
      if (!row || row.provider_user_id !== input.providerId) {
        throw new Error("SUBMISSION_NOT_FOUND");
      }

      if (!["draft", "changes_requested"].includes(row.review_status)) {
        throw new Error("SUBMISSION_LOCKED");
      }

      await execute(
        `
          UPDATE provider_offering_submissions
          SET
            linked_offering_id = $2,
            category_id = $3,
            submission_type = $4,
            name = $5,
            slug_candidate = $6,
            excerpt = $7,
            description = $8,
            thumbnail_url = $9,
            fulfillment_type = $10,
            service_kind = $11,
            duration_minutes = $12,
            service_area = $13,
            purchase_cost = $14,
            proposed_stock_quantity = $15,
            low_stock_threshold = $16,
            allow_backorder = $17,
            provider_sku = $18,
            provider_note = $19,
            updated_at = NOW()
          WHERE id = $1
        `,
        [
          input.submissionId,
          linkedOfferingId ?? null,
          input.categoryId ?? null,
          input.submissionType,
          name,
          slugCandidate,
          excerpt,
          description,
          thumbnailUrl,
          input.fulfillmentType,
          serviceKind,
          durationMinutes,
          serviceArea,
          input.purchaseCost,
          input.proposedStockQuantity,
          input.lowStockThreshold,
          input.allowBackorder,
          providerSku,
          providerNote,
        ]
      );

      await appendSubmissionEvent(execute, {
        submissionId: input.submissionId,
        actorUserId: input.providerId,
        actorType: "provider",
        eventType: "updated",
        message: "Provider đã cập nhật hồ sơ dịch vụ/sản phẩm chờ duyệt.",
      });

      return input.submissionId;
    }

    const inserted = await execute<{ id: string }>(
      `
        INSERT INTO provider_offering_submissions (
          provider_user_id,
          linked_offering_id,
          category_id,
          submission_type,
          review_status,
          name,
          slug_candidate,
          excerpt,
          description,
          thumbnail_url,
          fulfillment_type,
          service_kind,
          duration_minutes,
          service_area,
          purchase_cost,
          proposed_stock_quantity,
          low_stock_threshold,
          allow_backorder,
          provider_sku,
          provider_note
        )
        VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id
      `,
      [
        input.providerId,
        linkedOfferingId ?? null,
        input.categoryId ?? null,
        input.submissionType,
        name,
        slugCandidate,
        excerpt,
        description,
        thumbnailUrl,
        input.fulfillmentType,
        serviceKind,
        durationMinutes,
        serviceArea,
        input.purchaseCost,
        input.proposedStockQuantity,
        input.lowStockThreshold,
        input.allowBackorder,
        providerSku,
        providerNote,
      ]
    );

    const submissionId = inserted.rows[0].id;
    await appendSubmissionEvent(execute, {
      submissionId,
      actorUserId: input.providerId,
      actorType: "provider",
      eventType: "created",
      message: "Provider đã tạo bản nháp dịch vụ/sản phẩm.",
    });

    return submissionId;
  });
}

export async function submitProviderOfferingSubmission(providerId: string, submissionId: string): Promise<void> {
  let submittedName = "";
  await withTransaction(async (execute) => {
    const result = await execute<{
      id: string;
      review_status: ProviderOfferingReviewStatus;
      provider_user_id: string;
      name: string;
    }>(
      `
        SELECT id, review_status, provider_user_id, name
        FROM provider_offering_submissions
        WHERE id = $1
        LIMIT 1
      `,
      [submissionId]
    );

    const row = result.rows[0];
    if (!row || row.provider_user_id !== providerId) {
      throw new Error("SUBMISSION_NOT_FOUND");
    }

    if (!["draft", "changes_requested"].includes(row.review_status)) {
      throw new Error("SUBMISSION_LOCKED");
    }
    submittedName = row.name;

    await execute(
      `
        UPDATE provider_offering_submissions
        SET
          review_status = 'submitted',
          submitted_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
      `,
      [submissionId]
    );

    await appendSubmissionEvent(execute, {
      submissionId,
      actorUserId: providerId,
      actorType: "provider",
      eventType: "submitted",
      message: `Provider đã gửi duyệt dịch vụ/sản phẩm "${row.name}".`,
    });
  });

  await createAdminNotification({
    actorUserId: providerId,
    title: "Provider gửi dịch vụ/sản phẩm chờ duyệt",
    body: `${submittedName || "Một hồ sơ"} vừa được provider gửi lên để admin review.`,
    linkUrl: ROUTES.ADMIN.PROVIDER_OFFERINGS,
    audienceType: "role",
    roles: [USER_ROLES.ADMIN],
  });
}

export async function reviewProviderOfferingSubmission(input: ReviewProviderOfferingSubmissionInput): Promise<void> {
  let providerId = "";
  await withTransaction(async (execute) => {
    const result = await execute<{
      id: string;
      review_status: ProviderOfferingReviewStatus;
      provider_user_id: string;
    }>(
      `
        SELECT id, review_status, provider_user_id
        FROM provider_offering_submissions
        WHERE id = $1
        LIMIT 1
      `,
      [input.submissionId]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error("SUBMISSION_NOT_FOUND");
    }
    providerId = row.provider_user_id;

    if (row.review_status === "approved") {
      throw new Error("SUBMISSION_FINALIZED");
    }

    const reviewNote = (input.reviewNote ?? "").trim();
    await execute(
      `
        UPDATE provider_offering_submissions
        SET
          review_status = $2,
          review_note = $3,
          reviewed_by = $4,
          reviewed_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
      `,
      [input.submissionId, input.nextStatus, reviewNote, input.actorUserId]
    );

    const eventMap: Record<ReviewProviderOfferingSubmissionInput["nextStatus"], { eventType: ProviderOfferingSubmissionEventType; message: string }> = {
      under_review: {
        eventType: "review_started",
        message: "Admin đã nhận xử lý hồ sơ dịch vụ/sản phẩm.",
      },
      changes_requested: {
        eventType: "changes_requested",
        message: reviewNote ? `Admin yêu cầu chỉnh sửa: ${reviewNote}` : "Admin yêu cầu provider chỉnh sửa hồ sơ dịch vụ/sản phẩm.",
      },
      rejected: {
        eventType: "rejected",
        message: reviewNote ? `Admin từ chối hồ sơ: ${reviewNote}` : "Admin đã từ chối hồ sơ dịch vụ/sản phẩm.",
      },
      archived: {
        eventType: "archived",
        message: "Admin đã lưu trữ hồ sơ dịch vụ/sản phẩm.",
      },
    };

    await appendSubmissionEvent(execute, {
      submissionId: input.submissionId,
      actorUserId: input.actorUserId,
      actorType: "admin",
      eventType: eventMap[input.nextStatus].eventType,
      message: eventMap[input.nextStatus].message,
    });
  });

  if (providerId) {
    await createAdminNotification({
      actorUserId: input.actorUserId,
      title: "Admin đã cập nhật review dịch vụ/sản phẩm",
      body:
        input.nextStatus === "changes_requested"
          ? "Admin yêu cầu bạn chỉnh sửa hồ sơ dịch vụ/sản phẩm."
          : input.nextStatus === "under_review"
            ? "Admin đã bắt đầu review hồ sơ dịch vụ/sản phẩm của bạn."
            : input.nextStatus === "rejected"
              ? "Admin đã từ chối hồ sơ dịch vụ/sản phẩm của bạn."
              : "Admin đã lưu trữ hồ sơ dịch vụ/sản phẩm của bạn.",
      linkUrl: ROUTES.PROVIDER.OFFERING(input.submissionId),
      audienceType: "users",
      userIds: [providerId],
    });
  }
}

export async function approveProviderOfferingSubmission(input: ApproveProviderOfferingSubmissionInput): Promise<string> {
  const assignProviderSupplier = input.assignProviderSupplier !== false;
  const adminSellPrice = normalizeAdminSellPrice(input.adminSellPrice);
  const result = await query<{
    id: string;
    provider_user_id: string;
    linked_offering_id: string | null;
    category_id: string | null;
    submission_type: ProviderOfferingSubmissionType;
    review_status: ProviderOfferingReviewStatus;
    name: string;
    slug_candidate: string;
    excerpt: string;
    description: string;
    thumbnail_url: string;
    fulfillment_type: OfferingFulfillmentType;
    service_kind: string;
    duration_minutes: string;
    service_area: string;
    purchase_cost: string;
    proposed_stock_quantity: string;
    low_stock_threshold: string;
    allow_backorder: boolean;
    provider_sku: string;
    provider_note: string;
  }>(
    `
      SELECT
        id,
        provider_user_id,
        linked_offering_id,
        category_id,
        submission_type,
        review_status,
        name,
        slug_candidate,
        excerpt,
        description,
        thumbnail_url,
        fulfillment_type,
        service_kind,
        duration_minutes::text,
        service_area,
        purchase_cost::text,
        proposed_stock_quantity::text,
        low_stock_threshold::text,
        allow_backorder,
        provider_sku,
        provider_note
      FROM provider_offering_submissions
      WHERE id = $1
      LIMIT 1
    `,
    [input.submissionId]
  );

  const submission = result.rows[0];
  if (!submission) {
    throw new Error("SUBMISSION_NOT_FOUND");
  }

  if (!["submitted", "under_review", "changes_requested", "approved"].includes(submission.review_status)) {
    throw new Error("SUBMISSION_NOT_APPROVABLE");
  }

  const provider = await getProviderByUserId(submission.provider_user_id);
  if (submission.submission_type !== "discontinue" && !provider?.id) {
    throw new Error("PROVIDER_ENTITY_REQUIRED");
  }

  const reviewNote = (input.reviewNote ?? "").trim();
  const ownerProviderId = provider?.id ?? null;
  const ownerProviderType = provider?.provider_type ? String(provider.provider_type) : null;
  const serviceOfferingType = submission.fulfillment_type === "service" ? getProviderServiceOfferingTypeKey(submission.service_kind) : "physical_product";
  let catalogEventName: "offering.created" | "offering.updated" = "offering.updated";

  const linkedOfferingId = await withTransaction(async (execute) => {
    let nextLinkedOfferingId = submission.linked_offering_id;

    if (submission.submission_type === "create") {
      const existing = await execute<{ id: string; offering_type: string }>(
        `
          SELECT id, offering_type
          FROM offerings
          WHERE ($1::text IS NOT NULL AND id::text = $1::text)
             OR slug = $2
          ORDER BY CASE WHEN id::text = $1::text THEN 0 ELSE 1 END
          LIMIT 1
          FOR UPDATE
        `,
        [submission.linked_offering_id, submission.slug_candidate]
      );
      const existingOffering = existing.rows[0];

      if (existingOffering) {
        const expectedOfferingType = submission.fulfillment_type === "service" ? serviceOfferingType : "physical_product";
        const isLinkedOffering = Boolean(submission.linked_offering_id) && existingOffering.id === submission.linked_offering_id;
        if (!isLinkedOffering || existingOffering.offering_type !== expectedOfferingType) {
          throw new Error("OFFERING_SLUG_IN_USE");
        }
      }

      if (existingOffering) {
        const updated = await execute<{ id: string }>(
          `
            UPDATE offerings
            SET
              slug = $2,
              category_id = $3,
              name = $4,
              status = 'published',
              excerpt = NULLIF($5, ''),
              description = NULLIF($6, ''),
              thumbnail_url = NULLIF($7, ''),
              price = $8,
              fulfillment_type = $9,
              offering_type = CASE WHEN $9 = 'service' THEN $16 ELSE offering_type END,
              template_key = CASE WHEN $9 = 'service' THEN $16 ELSE template_key END,
              config = CASE
                WHEN $9 = 'service' THEN config || jsonb_build_object(
                  'service_kind', $13::text,
                  'duration_minutes', $14::int,
                  'service_area', $15::text
                )
                ELSE config
              END,
              track_inventory = TRUE,
              stock_quantity = $10,
              low_stock_threshold = $11,
              allow_backorder = $12,
              updated_at = NOW()
            WHERE id = $1
            RETURNING id
          `,
          [
            existingOffering.id,
            submission.slug_candidate,
            submission.category_id,
            submission.name,
            submission.excerpt,
            submission.description,
            submission.thumbnail_url,
            adminSellPrice,
            submission.fulfillment_type,
            toInteger(submission.proposed_stock_quantity),
            toInteger(submission.low_stock_threshold),
            submission.allow_backorder,
            submission.service_kind,
            toInteger(submission.duration_minutes),
            submission.service_area,
            serviceOfferingType,
          ]
        );
        nextLinkedOfferingId = updated.rows[0]?.id ?? existingOffering.id;
        catalogEventName = "offering.updated";
      } else {
        const created = await execute<{ id: string }>(
          `
            INSERT INTO offerings (
              slug,
              category_id,
              name,
              excerpt,
              description,
              status,
              offering_type,
              template_key,
              template_engine,
              template_mode,
              thumbnail_url,
              price,
              fulfillment_type,
              track_inventory,
              stock_quantity,
              low_stock_threshold,
              allow_backorder,
              config
            )
            VALUES (
              $1, $2, $3, NULLIF($4, ''), NULLIF($5, ''), 'published',
              CASE WHEN $8 = 'service' THEN $15 ELSE 'physical_product' END,
              CASE WHEN $8 = 'service' THEN $15 ELSE 'physical_product' END,
              '', '', NULLIF($6, ''), $7, $8, TRUE, $9, $10, $11,
              CASE
                WHEN $8 = 'service' THEN jsonb_build_object(
                  'service_kind', $12::text,
                  'duration_minutes', $13::int,
                  'service_area', $14::text
                )
                ELSE '{}'::jsonb
              END
            )
            RETURNING id
          `,
          [
            submission.slug_candidate,
            submission.category_id,
            submission.name,
            submission.excerpt,
            submission.description,
            submission.thumbnail_url,
            adminSellPrice,
            submission.fulfillment_type,
            toInteger(submission.proposed_stock_quantity),
            toInteger(submission.low_stock_threshold),
            submission.allow_backorder,
            submission.service_kind,
            toInteger(submission.duration_minutes),
            submission.service_area,
            serviceOfferingType,
          ]
        );
        nextLinkedOfferingId = created.rows[0]?.id ?? null;
        catalogEventName = "offering.created";
      }

      if (!nextLinkedOfferingId) {
        throw new Error("OFFERING_APPLY_FAILED");
      }

      await execute(
        `
          INSERT INTO physical_offerings (
            offering_id,
            fulfillment_type,
            track_inventory,
            stock_quantity,
            low_stock_threshold,
            allow_backorder,
            cost_price,
            provider_sku,
            allow_provider_supply,
            provider_type,
            provider_id
          )
          VALUES ($1, $2, TRUE, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (offering_id) DO UPDATE
          SET
            fulfillment_type = EXCLUDED.fulfillment_type,
            track_inventory = EXCLUDED.track_inventory,
            stock_quantity = EXCLUDED.stock_quantity,
            low_stock_threshold = EXCLUDED.low_stock_threshold,
            allow_backorder = EXCLUDED.allow_backorder,
            cost_price = EXCLUDED.cost_price,
            provider_sku = EXCLUDED.provider_sku,
            allow_provider_supply = EXCLUDED.allow_provider_supply,
            provider_type = EXCLUDED.provider_type,
            provider_id = EXCLUDED.provider_id
        `,
        [
          nextLinkedOfferingId,
          submission.fulfillment_type,
          toInteger(submission.proposed_stock_quantity),
          toInteger(submission.low_stock_threshold),
          submission.allow_backorder,
          toNumber(submission.purchase_cost),
          submission.provider_sku,
          assignProviderSupplier,
          ownerProviderType,
          ownerProviderId,
        ]
      );
    } else if (submission.submission_type === "update") {
      if (!nextLinkedOfferingId) {
        throw new Error("LINKED_OFFERING_REQUIRED");
      }

      const updated = await execute<{ id: string }>(
        `
          UPDATE offerings
          SET
            slug = $2,
            category_id = $3,
            name = $4,
            status = 'published',
            excerpt = NULLIF($5, ''),
            description = NULLIF($6, ''),
            thumbnail_url = NULLIF($7, ''),
            price = $8,
            fulfillment_type = $9,
            offering_type = CASE WHEN $9 = 'service' THEN $16 ELSE offering_type END,
            template_key = CASE WHEN $9 = 'service' THEN $16 ELSE template_key END,
            config = CASE
              WHEN $9 = 'service' THEN config || jsonb_build_object(
                'service_kind', $13::text,
                'duration_minutes', $14::int,
                'service_area', $15::text
              )
              ELSE config
            END,
            track_inventory = TRUE,
            stock_quantity = $10,
            low_stock_threshold = $11,
            allow_backorder = $12,
            updated_at = NOW()
          WHERE id = $1
          RETURNING id
        `,
        [
          nextLinkedOfferingId,
          submission.slug_candidate,
          submission.category_id,
          submission.name,
          submission.excerpt,
          submission.description,
          submission.thumbnail_url,
          adminSellPrice,
          submission.fulfillment_type,
          toInteger(submission.proposed_stock_quantity),
          toInteger(submission.low_stock_threshold),
          submission.allow_backorder,
          submission.service_kind,
          toInteger(submission.duration_minutes),
          submission.service_area,
          serviceOfferingType,
        ]
      );

      if (!updated.rows[0]) {
        throw new Error("LINKED_OFFERING_NOT_FOUND");
      }

      await execute(
        `
          INSERT INTO physical_offerings (
            offering_id,
            fulfillment_type,
            track_inventory,
            stock_quantity,
            low_stock_threshold,
            allow_backorder,
            cost_price,
            provider_sku,
            allow_provider_supply,
            provider_type,
            provider_id
          )
          VALUES ($1, $2, TRUE, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (offering_id) DO UPDATE
          SET
            fulfillment_type = EXCLUDED.fulfillment_type,
            track_inventory = EXCLUDED.track_inventory,
            stock_quantity = EXCLUDED.stock_quantity,
            low_stock_threshold = EXCLUDED.low_stock_threshold,
            allow_backorder = EXCLUDED.allow_backorder,
            cost_price = EXCLUDED.cost_price,
            provider_sku = EXCLUDED.provider_sku,
            allow_provider_supply = EXCLUDED.allow_provider_supply,
            provider_type = EXCLUDED.provider_type,
            provider_id = EXCLUDED.provider_id
        `,
        [
          nextLinkedOfferingId,
          submission.fulfillment_type,
          toInteger(submission.proposed_stock_quantity),
          toInteger(submission.low_stock_threshold),
          submission.allow_backorder,
          toNumber(submission.purchase_cost),
          submission.provider_sku,
          assignProviderSupplier,
          ownerProviderType,
          ownerProviderId,
        ]
      );
    } else {
      if (!nextLinkedOfferingId) {
        throw new Error("LINKED_OFFERING_REQUIRED");
      }

      const updated = await execute<{ id: string }>(
        `
          UPDATE offerings
          SET status = 'draft', updated_at = NOW()
          WHERE id = $1
          RETURNING id
        `,
        [nextLinkedOfferingId]
      );

      if (!updated.rows[0]) {
        throw new Error("LINKED_OFFERING_NOT_FOUND");
      }
    }

    if (nextLinkedOfferingId && submission.submission_type !== "discontinue") {
      if (submission.fulfillment_type === "service") {
        await execute(
          `
            INSERT INTO service_offerings (
              offering_id, service_kind, duration_minutes, requires_consultation, service_area
            )
            VALUES ($1, $2, $3, TRUE, $4)
            ON CONFLICT (offering_id) DO UPDATE
            SET
              service_kind = EXCLUDED.service_kind,
              duration_minutes = EXCLUDED.duration_minutes,
              service_area = EXCLUDED.service_area,
              updated_at = NOW()
          `,
          [
            nextLinkedOfferingId,
            submission.service_kind || "other",
            toInteger(submission.duration_minutes),
            submission.service_area,
          ]
        );
      } else {
        await execute("DELETE FROM service_offerings WHERE offering_id = $1", [nextLinkedOfferingId]);
      }
    }

    await execute(
      `
        UPDATE provider_offering_submissions
        SET
          linked_offering_id = $2,
          review_status = 'approved',
          admin_sell_price = $3,
          review_note = $4,
          reviewed_by = $5,
          reviewed_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
      `,
      [input.submissionId, nextLinkedOfferingId, adminSellPrice, reviewNote, input.actorUserId]
    );

    if (nextLinkedOfferingId && assignProviderSupplier && submission.submission_type !== "discontinue") {
      await upsertOfferingProviderSupplier(execute, {
        offeringId: nextLinkedOfferingId,
        providerId: submission.provider_user_id,
        actorUserId: input.actorUserId,
        source: "proposal",
        purchaseCost: toNumber(submission.purchase_cost),
        providerSku: submission.provider_sku,
        monthlyCapacity: toInteger(submission.proposed_stock_quantity),
        qualityNote: submission.provider_note,
      });
    }

    if (nextLinkedOfferingId && ownerProviderId && submission.submission_type !== "discontinue") {
      await upsertProviderServiceForOffering({
        providerId: ownerProviderId,
        offeringId: nextLinkedOfferingId,
        title: submission.name,
        fulfillmentType: submission.fulfillment_type,
        serviceKind: submission.service_kind,
        durationMinutes: toInteger(submission.duration_minutes),
        serviceArea: submission.service_area,
        status: "active",
        basePrice: adminSellPrice,
        metadata: {
          source: "provider_offering_submission",
          submission_id: input.submissionId,
          provider_type: ownerProviderType,
        },
        execute,
      });
    }

    await appendSubmissionEvent(execute, {
      submissionId: input.submissionId,
      actorUserId: input.actorUserId,
      actorType: "admin",
      eventType: "approved",
      message:
        submission.review_status === "approved"
          ? "Admin đã cập nhật lại hồ sơ dịch vụ/sản phẩm và áp dụng vào catalog."
          : submission.submission_type === "discontinue"
          ? "Admin đã duyệt ngừng bán dịch vụ/sản phẩm."
          : "Admin đã duyệt hồ sơ dịch vụ/sản phẩm và áp dụng vào catalog.",
    });

    return nextLinkedOfferingId;
  });

  const linkedOffering = linkedOfferingId ? await getOfferingById(linkedOfferingId) : null;
  if (linkedOffering) {
    await upsertOfferingSearchDocument(linkedOffering);
    await recordDomainEvent({
      eventName: catalogEventName,
      aggregateType: "offering",
      aggregateId: linkedOffering.id,
      actorType: "admin",
      actorId: input.actorUserId,
      payload: { slug: linkedOffering.slug, offeringType: linkedOffering.offeringType },
    });
  }

  const notificationTitle =
    submission.submission_type === "discontinue"
      ? "Yêu cầu ngừng bán đã được duyệt"
    : submission.review_status === "approved"
        ? "Catalog dịch vụ/sản phẩm đã được cập nhật"
        : submission.submission_type === "update"
          ? "Cập nhật dịch vụ/sản phẩm provider đã được duyệt"
          : "Dịch vụ/sản phẩm provider đã được duyệt và mở bán";
  const notificationBody =
    submission.submission_type === "discontinue"
        ? `Admin đã duyệt ngừng bán "${submission.name}".`
      : submission.review_status === "approved"
        ? `Admin đã cập nhật "${submission.name}" trong catalog với giá bán ${formatVnd(adminSellPrice)}.`
        : submission.submission_type === "update"
          ? `Admin đã duyệt cập nhật "${submission.name}" và áp dụng vào catalog.`
          : `Admin đã duyệt "${submission.name}" và đưa lên catalog.`;

  await createAdminNotification({
    actorUserId: input.actorUserId,
    title: notificationTitle,
    body: notificationBody,
    linkUrl: ROUTES.PROVIDER.OFFERING(input.submissionId),
    audienceType: "users",
    userIds: [submission.provider_user_id],
  });

  return linkedOfferingId ?? "";
}
