import "server-only";

import type { OfferingFulfillmentType } from "@/features/offerings/types";
import { createAdminNotification } from "@/features/notifications/server/service";
import { createOffering, getOfferingById, updateOffering } from "@/features/offerings/server/service";
import { getProviderByUserId } from "@/features/providers/server/service";
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
} from "@/features/provider-offering-submissions/types";
import { query, withTransaction, type DbExecutor } from "@/lib/database";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type SubmissionRow = {
  id: string;
  provider_id: string;
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
  provider_id: string;
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
  provider_id: string;
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
  offeringOwnership?: "platform" | "provider_originated";
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
  reviewNote?: string;
};

type UpdateOfferingProviderSupplierStatusInput = {
  supplierId: string;
  actorUserId: string;
  nextStatus: OfferingProviderSupplierStatus;
  reviewNote?: string;
};

const SUBMISSION_SELECT = `
  SELECT
    s.id,
    s.provider_id,
    provider.username AS provider_username,
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
    reviewer.username AS reviewed_by_username,
    s.created_at::text,
    s.updated_at::text
  FROM provider_offering_submissions s
  JOIN users provider ON provider.id = s.provider_id
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
    supplier.provider_id,
    provider.username AS provider_username,
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
  JOIN users provider ON provider.id = supplier.provider_id
  LEFT JOIN user_profiles provider_profile ON provider_profile.user_id = provider.id
`;

const SUPPLIER_REQUEST_SELECT = `
  SELECT
    request.id,
    request.offering_id,
    offering.name AS offering_name,
    offering.slug AS offering_slug,
    offering.thumbnail_url AS offering_thumbnail_url,
    request.provider_id,
    provider.username AS provider_username,
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
  JOIN users provider ON provider.id = request.provider_id
  LEFT JOIN user_profiles provider_profile ON provider_profile.user_id = provider.id
`;

function toNumber(value: string | null | undefined) {
  return Number(value ?? "0");
}

function toInteger(value: string | null | undefined) {
  return Math.max(0, Math.trunc(Number(value ?? "0")));
}

function mapSubmissionRow(row: SubmissionRow): ProviderOfferingSubmission {
  return {
    id: row.id,
    providerId: row.provider_id,
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
    providerId: row.provider_id,
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
    providerId: row.provider_id,
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
        actor.username AS actor_username,
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
        provider_id,
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
      ON CONFLICT (offering_id, provider_id) DO UPDATE
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
  if (!offering || offering.offeringType !== "physical_product" || offering.ownerType !== "provider" || offering.ownerProviderId !== provider?.id) {
    throw new Error("LINKED_OFFERING_NOT_ALLOWED");
  }

  return offering;
}

export async function listProviderOfferingSubmissionsForProvider(providerId: string): Promise<ProviderOfferingSubmission[]> {
  const result = await query<SubmissionRow>(
    `
      ${SUBMISSION_SELECT}
      WHERE s.provider_id = $1
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
       AND supplier.provider_id = $1
       AND supplier.status <> 'revoked'
      LEFT JOIN LATERAL (
        SELECT review_status
        FROM provider_offering_supplier_requests request
        WHERE request.offering_id = offering.id
          AND request.provider_id = $1
          AND request.review_status IN ('submitted', 'under_review', 'changes_requested')
        ORDER BY request.updated_at DESC
        LIMIT 1
      ) request ON TRUE
      WHERE offering.status = 'published'
        AND offering.offering_type = 'physical_product'
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

export async function listSupplierRequestsForProvider(providerId: string): Promise<ProviderOfferingSupplierRequest[]> {
  const result = await query<SupplierRequestRow>(
    `
      ${SUPPLIER_REQUEST_SELECT}
      WHERE request.provider_id = $1
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
        supplier.provider_id AS id,
        COALESCE(NULLIF(BTRIM(profile.display_name), ''), NULLIF(BTRIM(profile.full_name), ''), provider.username) AS label
      FROM offering_provider_suppliers supplier
      JOIN users provider ON provider.id = supplier.provider_id
      LEFT JOIN user_profiles profile ON profile.user_id = provider.id
      WHERE supplier.offering_id = ANY($1::text[])
        AND supplier.status = 'active'
      GROUP BY supplier.provider_id, label
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

  if (!offering || offering.status !== "published" || offering.offeringType !== "physical_product" || !offering.allowProviderSupply) {
    throw new Error("OFFERING_NOT_AVAILABLE");
  }

  const existingSupplier = await query<{ id: string }>(
    `
      SELECT id
      FROM offering_provider_suppliers
      WHERE offering_id = $1
        AND provider_id = $2
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
        AND provider_id = $2
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
        provider_id,
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
    await upsertOfferingProviderSupplier(query, {
      offeringId: request.offering_id,
      providerId: request.provider_id,
      actorUserId: input.actorUserId,
      source: "supplier_request",
      purchaseCost: toNumber(request.purchase_cost),
      providerSku: request.provider_sku,
      leadTimeDays: toInteger(request.lead_time_days),
      monthlyCapacity: toInteger(request.monthly_capacity),
      serviceArea: request.service_area,
      qualityNote: [request.material_note, request.quality_note, request.provider_note].filter(Boolean).join("\n\n"),
    });
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
    linkUrl: ROUTES.PARTNER.SUPPLY_REQUESTS,
    audienceType: "users",
    userIds: [request.provider_id],
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
    linkUrl: ROUTES.PARTNER.SUPPLY_REQUESTS,
    audienceType: "users",
    userIds: [supplier.provider_id],
  });
}

export async function getProviderOfferingSubmissionDetailForProvider(
  providerId: string,
  submissionId: string
): Promise<ProviderOfferingSubmissionDetail | null> {
  const row = await getSubmissionRowById(submissionId);
  if (!row || row.provider_id !== providerId) {
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
  await assertLinkedOfferingOwnership(input.providerId, input.linkedOfferingId);

  const name = input.name.trim();
  const slugCandidate = input.slugCandidate.trim();
  const excerpt = (input.excerpt ?? "").trim();
  const description = (input.description ?? "").trim();
  const thumbnailUrl = (input.thumbnailUrl ?? "").trim();
  const providerSku = (input.providerSku ?? "").trim();
  const providerNote = (input.providerNote ?? "").trim();

  if (!name || !slugCandidate) {
    throw new Error("INVALID_SUBMISSION");
  }

  if (input.submissionType !== "create" && !input.linkedOfferingId) {
    throw new Error("LINKED_OFFERING_REQUIRED");
  }

  return withTransaction(async (execute) => {
    if (input.submissionId) {
      const existing = await execute<{
        id: string;
        review_status: ProviderOfferingReviewStatus;
        provider_id: string;
      }>(
        `
          SELECT id, review_status, provider_id
          FROM provider_offering_submissions
          WHERE id = $1
          LIMIT 1
        `,
        [input.submissionId]
      );

      const row = existing.rows[0];
      if (!row || row.provider_id !== input.providerId) {
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
            purchase_cost = $11,
            proposed_stock_quantity = $12,
            low_stock_threshold = $13,
            allow_backorder = $14,
            provider_sku = $15,
            provider_note = $16,
            updated_at = NOW()
          WHERE id = $1
        `,
        [
          input.submissionId,
          input.linkedOfferingId ?? null,
          input.categoryId ?? null,
          input.submissionType,
          name,
          slugCandidate,
          excerpt,
          description,
          thumbnailUrl,
          input.fulfillmentType,
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
        message: "Provider đã cập nhật hồ sơ sản phẩm chờ duyệt.",
      });

      return input.submissionId;
    }

    const inserted = await execute<{ id: string }>(
      `
        INSERT INTO provider_offering_submissions (
          provider_id,
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
          purchase_cost,
          proposed_stock_quantity,
          low_stock_threshold,
          allow_backorder,
          provider_sku,
          provider_note
        )
        VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id
      `,
      [
        input.providerId,
        input.linkedOfferingId ?? null,
        input.categoryId ?? null,
        input.submissionType,
        name,
        slugCandidate,
        excerpt,
        description,
        thumbnailUrl,
        input.fulfillmentType,
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
      message: "Provider đã tạo bản nháp sản phẩm.",
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
      provider_id: string;
      name: string;
    }>(
      `
        SELECT id, review_status, provider_id, name
        FROM provider_offering_submissions
        WHERE id = $1
        LIMIT 1
      `,
      [submissionId]
    );

    const row = result.rows[0];
    if (!row || row.provider_id !== providerId) {
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
      message: `Provider đã gửi duyệt sản phẩm "${row.name}".`,
    });
  });

  await createAdminNotification({
    actorUserId: providerId,
    title: "Provider gửi sản phẩm chờ duyệt",
    body: `${submittedName || "Một sản phẩm"} vừa được provider gửi lên để admin review.`,
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
      provider_id: string;
    }>(
      `
        SELECT id, review_status, provider_id
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
    providerId = row.provider_id;

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
        message: "Admin đã nhận xử lý hồ sơ sản phẩm.",
      },
      changes_requested: {
        eventType: "changes_requested",
        message: reviewNote ? `Admin yêu cầu chỉnh sửa: ${reviewNote}` : "Admin yêu cầu provider chỉnh sửa hồ sơ sản phẩm.",
      },
      rejected: {
        eventType: "rejected",
        message: reviewNote ? `Admin từ chối hồ sơ: ${reviewNote}` : "Admin đã từ chối hồ sơ sản phẩm.",
      },
      archived: {
        eventType: "archived",
        message: "Admin đã lưu trữ hồ sơ sản phẩm.",
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
      title: "Admin đã cập nhật review sản phẩm",
      body:
        input.nextStatus === "changes_requested"
          ? "Admin yêu cầu bạn chỉnh sửa hồ sơ sản phẩm."
          : input.nextStatus === "under_review"
            ? "Admin đã bắt đầu review hồ sơ sản phẩm của bạn."
            : input.nextStatus === "rejected"
              ? "Admin đã từ chối hồ sơ sản phẩm của bạn."
              : "Admin đã lưu trữ hồ sơ sản phẩm của bạn.",
      linkUrl: ROUTES.PARTNER.OFFERING(input.submissionId),
      audienceType: "users",
      userIds: [providerId],
    });
  }
}

export async function approveProviderOfferingSubmission(input: ApproveProviderOfferingSubmissionInput): Promise<string> {
  const assignProviderSupplier = input.assignProviderSupplier !== false;
  const offeringOwnership = input.offeringOwnership ?? "platform";
  const result = await query<{
    id: string;
    provider_id: string;
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
        provider_id,
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

  if (!["submitted", "under_review", "changes_requested"].includes(submission.review_status)) {
    throw new Error("SUBMISSION_NOT_APPROVABLE");
  }

  let linkedOfferingId = submission.linked_offering_id;
  const provider = await getProviderByUserId(submission.provider_id);
  if (submission.submission_type === "create") {
    const ownerType = offeringOwnership === "provider_originated" ? "provider" : "internal";
    const created = await createOffering({
      slug: submission.slug_candidate,
      categoryId: submission.category_id ?? undefined,
      name: submission.name,
      excerpt: submission.excerpt,
      description: submission.description,
      status: "draft",
      offeringType: "physical_product",
      templateKey: "physical_product",
      thumbnailUrl: submission.thumbnail_url || undefined,
      price: input.adminSellPrice,
      fulfillmentType: submission.fulfillment_type,
      trackInventory: true,
      stockQuantity: toNumber(submission.proposed_stock_quantity),
      lowStockThreshold: toNumber(submission.low_stock_threshold),
      allowBackorder: submission.allow_backorder,
      costPrice: toNumber(submission.purchase_cost),
      providerSku: submission.provider_sku,
      ownerType,
      ownerProviderId: offeringOwnership === "provider_originated" ? provider?.id : undefined,
      ownerProviderType: offeringOwnership === "provider_originated" ? String(provider?.provider_type ?? "provider") : undefined,
      config: {},
    });

    linkedOfferingId = created.id;
  } else if (submission.submission_type === "update") {
    if (!submission.linked_offering_id) {
      throw new Error("LINKED_OFFERING_REQUIRED");
    }

    const offering = await getOfferingById(submission.linked_offering_id);
    if (!offering) {
      throw new Error("LINKED_OFFERING_NOT_FOUND");
    }

    await updateOffering(offering.slug, {
      categoryId: submission.category_id ?? undefined,
      name: submission.name,
      slug: submission.slug_candidate,
      excerpt: submission.excerpt,
      description: submission.description,
      thumbnailUrl: submission.thumbnail_url || undefined,
      price: input.adminSellPrice,
      fulfillmentType: submission.fulfillment_type,
      trackInventory: true,
      stockQuantity: toNumber(submission.proposed_stock_quantity),
      lowStockThreshold: toNumber(submission.low_stock_threshold),
      allowBackorder: submission.allow_backorder,
      costPrice: toNumber(submission.purchase_cost),
      providerSku: submission.provider_sku,
      ownerType: "provider",
      ownerProviderId: provider?.id,
      ownerProviderType: String(provider?.provider_type ?? "provider"),
      config: offering.config,
    });
  } else {
    if (!submission.linked_offering_id) {
      throw new Error("LINKED_OFFERING_REQUIRED");
    }

    const offering = await getOfferingById(submission.linked_offering_id);
    if (!offering) {
      throw new Error("LINKED_OFFERING_NOT_FOUND");
    }

    await updateOffering(offering.slug, {
      status: "draft",
    });
  }

  const reviewNote = (input.reviewNote ?? "").trim();
  await query(
    `
      UPDATE provider_offering_submissions
      SET
        linked_offering_id = COALESCE($2, linked_offering_id),
        review_status = 'approved',
        admin_sell_price = $3,
        review_note = $4,
        reviewed_by = $5,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
    `,
    [input.submissionId, linkedOfferingId, input.adminSellPrice, reviewNote, input.actorUserId]
  );

  if (linkedOfferingId && assignProviderSupplier && submission.submission_type !== "discontinue") {
    await upsertOfferingProviderSupplier(query, {
      offeringId: linkedOfferingId,
      providerId: submission.provider_id,
      actorUserId: input.actorUserId,
      source: "proposal",
      purchaseCost: toNumber(submission.purchase_cost),
      providerSku: submission.provider_sku,
      monthlyCapacity: toInteger(submission.proposed_stock_quantity),
      qualityNote: submission.provider_note,
    });
  }

  await appendSubmissionEvent(query, {
    submissionId: input.submissionId,
    actorUserId: input.actorUserId,
    actorType: "admin",
    eventType: "approved",
    message:
      submission.submission_type === "discontinue"
        ? "Admin đã duyệt ngừng bán sản phẩm."
        : "Admin đã duyệt hồ sơ sản phẩm và áp dụng vào catalog.",
  });

  await createAdminNotification({
    actorUserId: input.actorUserId,
    title: "Sản phẩm provider đã được duyệt",
    body:
      submission.submission_type === "discontinue"
        ? "Admin đã duyệt yêu cầu ngừng bán sản phẩm của bạn."
        : "Admin đã duyệt hồ sơ sản phẩm và áp dụng vào catalog.",
    linkUrl: ROUTES.PARTNER.OFFERING(input.submissionId),
    audienceType: "users",
    userIds: [submission.provider_id],
  });

  return linkedOfferingId ?? "";
}
