import "server-only";

import type { ProductFulfillmentType } from "@/features/products/types";
import { createAdminNotification } from "@/features/notifications/server/service";
import { createProduct, getProductById, updateProduct } from "@/features/products/server/service";
import type {
  VendorProductReviewStatus,
  VendorProductSubmission,
  VendorProductSubmissionActorType,
  VendorProductSubmissionDetail,
  VendorProductSubmissionEvent,
  VendorProductSubmissionEventType,
  VendorProductSubmissionType,
} from "@/features/vendor-product-submissions/types";
import { query, withTransaction, type DbExecutor } from "@/lib/database";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type SubmissionRow = {
  id: string;
  vendor_user_id: string;
  vendor_username: string;
  vendor_display_name: string | null;
  linked_product_id: string | null;
  linked_product_slug: string | null;
  linked_product_name: string | null;
  category_id: string | null;
  category_name: string | null;
  submission_type: VendorProductSubmissionType;
  review_status: VendorProductReviewStatus;
  name: string;
  slug_candidate: string;
  excerpt: string;
  description: string;
  thumbnail_url: string;
  fulfillment_type: ProductFulfillmentType;
  purchase_cost: string;
  proposed_stock_quantity: string;
  low_stock_threshold: string;
  allow_backorder: boolean;
  vendor_sku: string;
  vendor_note: string;
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
  actor_type: VendorProductSubmissionActorType;
  event_type: VendorProductSubmissionEventType;
  message: string;
  created_at: string;
};

type SaveVendorProductSubmissionInput = {
  submissionId?: string;
  vendorUserId: string;
  linkedProductId?: string;
  categoryId?: string;
  submissionType: VendorProductSubmissionType;
  name: string;
  slugCandidate: string;
  excerpt?: string;
  description?: string;
  thumbnailUrl?: string;
  fulfillmentType: ProductFulfillmentType;
  purchaseCost: number;
  proposedStockQuantity: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  vendorSku?: string;
  vendorNote?: string;
};

type ReviewVendorProductSubmissionInput = {
  submissionId: string;
  actorUserId: string;
  nextStatus: Extract<VendorProductReviewStatus, "under_review" | "changes_requested" | "rejected" | "archived">;
  reviewNote?: string;
};

type ApproveVendorProductSubmissionInput = {
  submissionId: string;
  actorUserId: string;
  adminSellPrice: number;
  reviewNote?: string;
};

const SUBMISSION_SELECT = `
  SELECT
    s.id,
    s.vendor_user_id,
    vendor.username AS vendor_username,
    COALESCE(NULLIF(BTRIM(vendor_profile.display_name), ''), NULLIF(BTRIM(vendor_profile.full_name), '')) AS vendor_display_name,
    s.linked_product_id,
    linked.slug AS linked_product_slug,
    linked.name AS linked_product_name,
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
    s.vendor_sku,
    s.vendor_note,
    s.admin_sell_price::text,
    s.review_note,
    s.submitted_at::text,
    s.reviewed_at::text,
    s.reviewed_by::text,
    reviewer.username AS reviewed_by_username,
    s.created_at::text,
    s.updated_at::text
  FROM vendor_product_submissions s
  JOIN users vendor ON vendor.id = s.vendor_user_id
  LEFT JOIN user_profiles vendor_profile ON vendor_profile.user_id = vendor.id
  LEFT JOIN products linked ON linked.id = s.linked_product_id
  LEFT JOIN product_categories category ON category.id = s.category_id
  LEFT JOIN users reviewer ON reviewer.id = s.reviewed_by
`;

function toNumber(value: string | null | undefined) {
  return Number(value ?? "0");
}

function mapSubmissionRow(row: SubmissionRow): VendorProductSubmission {
  return {
    id: row.id,
    vendorUserId: row.vendor_user_id,
    vendorUsername: row.vendor_username,
    vendorDisplayName: row.vendor_display_name ?? row.vendor_username,
    linkedProductId: row.linked_product_id ?? undefined,
    linkedProductSlug: row.linked_product_slug ?? undefined,
    linkedProductName: row.linked_product_name ?? undefined,
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
    vendorSku: row.vendor_sku,
    vendorNote: row.vendor_note,
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

function mapEventRow(row: SubmissionEventRow): VendorProductSubmissionEvent {
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

async function getSubmissionEvents(submissionId: string): Promise<VendorProductSubmissionEvent[]> {
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
      FROM vendor_product_submission_events e
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
    actorType: VendorProductSubmissionActorType;
    eventType: VendorProductSubmissionEventType;
    message: string;
  }
) {
  await execute(
    `
      INSERT INTO vendor_product_submission_events (
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

async function assertLinkedProductOwnership(vendorUserId: string, linkedProductId?: string) {
  if (!linkedProductId) {
    return null;
  }

  const product = await getProductById(linkedProductId);
  if (!product || product.productType !== "general_product" || product.ownerType !== "vendor" || product.ownerVendorUserId !== vendorUserId) {
    throw new Error("LINKED_PRODUCT_NOT_ALLOWED");
  }

  return product;
}

export async function listVendorProductSubmissionsForVendor(vendorUserId: string): Promise<VendorProductSubmission[]> {
  const result = await query<SubmissionRow>(
    `
      ${SUBMISSION_SELECT}
      WHERE s.vendor_user_id = $1
      ORDER BY s.updated_at DESC
    `,
    [vendorUserId]
  );

  return result.rows.map(mapSubmissionRow);
}

export async function listVendorProductSubmissionsForAdmin(): Promise<VendorProductSubmission[]> {
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

export async function getVendorProductSubmissionDetailForVendor(
  vendorUserId: string,
  submissionId: string
): Promise<VendorProductSubmissionDetail | null> {
  const row = await getSubmissionRowById(submissionId);
  if (!row || row.vendor_user_id !== vendorUserId) {
    return null;
  }

  return {
    ...mapSubmissionRow(row),
    events: await getSubmissionEvents(submissionId),
  };
}

export async function getVendorProductSubmissionDetailForAdmin(submissionId: string): Promise<VendorProductSubmissionDetail | null> {
  const row = await getSubmissionRowById(submissionId);
  if (!row) {
    return null;
  }

  return {
    ...mapSubmissionRow(row),
    events: await getSubmissionEvents(submissionId),
  };
}

export async function saveVendorProductSubmission(input: SaveVendorProductSubmissionInput): Promise<string> {
  await assertLinkedProductOwnership(input.vendorUserId, input.linkedProductId);

  const name = input.name.trim();
  const slugCandidate = input.slugCandidate.trim();
  const excerpt = (input.excerpt ?? "").trim();
  const description = (input.description ?? "").trim();
  const thumbnailUrl = (input.thumbnailUrl ?? "").trim();
  const vendorSku = (input.vendorSku ?? "").trim();
  const vendorNote = (input.vendorNote ?? "").trim();

  if (!name || !slugCandidate) {
    throw new Error("INVALID_SUBMISSION");
  }

  if (input.submissionType !== "create" && !input.linkedProductId) {
    throw new Error("LINKED_PRODUCT_REQUIRED");
  }

  return withTransaction(async (execute) => {
    if (input.submissionId) {
      const existing = await execute<{
        id: string;
        review_status: VendorProductReviewStatus;
        vendor_user_id: string;
      }>(
        `
          SELECT id, review_status, vendor_user_id
          FROM vendor_product_submissions
          WHERE id = $1
          LIMIT 1
        `,
        [input.submissionId]
      );

      const row = existing.rows[0];
      if (!row || row.vendor_user_id !== input.vendorUserId) {
        throw new Error("SUBMISSION_NOT_FOUND");
      }

      if (!["draft", "changes_requested"].includes(row.review_status)) {
        throw new Error("SUBMISSION_LOCKED");
      }

      await execute(
        `
          UPDATE vendor_product_submissions
          SET
            linked_product_id = $2,
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
            vendor_sku = $15,
            vendor_note = $16,
            updated_at = NOW()
          WHERE id = $1
        `,
        [
          input.submissionId,
          input.linkedProductId ?? null,
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
          vendorSku,
          vendorNote,
        ]
      );

      await appendSubmissionEvent(execute, {
        submissionId: input.submissionId,
        actorUserId: input.vendorUserId,
        actorType: "vendor",
        eventType: "updated",
        message: "Vendor đã cập nhật hồ sơ sản phẩm chờ duyệt.",
      });

      return input.submissionId;
    }

    const inserted = await execute<{ id: string }>(
      `
        INSERT INTO vendor_product_submissions (
          vendor_user_id,
          linked_product_id,
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
          vendor_sku,
          vendor_note
        )
        VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id
      `,
      [
        input.vendorUserId,
        input.linkedProductId ?? null,
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
        vendorSku,
        vendorNote,
      ]
    );

    const submissionId = inserted.rows[0].id;
    await appendSubmissionEvent(execute, {
      submissionId,
      actorUserId: input.vendorUserId,
      actorType: "vendor",
      eventType: "created",
      message: "Vendor đã tạo bản nháp sản phẩm.",
    });

    return submissionId;
  });
}

export async function submitVendorProductSubmission(vendorUserId: string, submissionId: string): Promise<void> {
  let submittedName = "";
  await withTransaction(async (execute) => {
    const result = await execute<{
      id: string;
      review_status: VendorProductReviewStatus;
      vendor_user_id: string;
      name: string;
    }>(
      `
        SELECT id, review_status, vendor_user_id, name
        FROM vendor_product_submissions
        WHERE id = $1
        LIMIT 1
      `,
      [submissionId]
    );

    const row = result.rows[0];
    if (!row || row.vendor_user_id !== vendorUserId) {
      throw new Error("SUBMISSION_NOT_FOUND");
    }

    if (!["draft", "changes_requested"].includes(row.review_status)) {
      throw new Error("SUBMISSION_LOCKED");
    }
    submittedName = row.name;

    await execute(
      `
        UPDATE vendor_product_submissions
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
      actorUserId: vendorUserId,
      actorType: "vendor",
      eventType: "submitted",
      message: `Vendor đã gửi duyệt sản phẩm "${row.name}".`,
    });
  });

  await createAdminNotification({
    actorUserId: vendorUserId,
    title: "Vendor gửi sản phẩm chờ duyệt",
    body: `${submittedName || "Một sản phẩm"} vừa được vendor gửi lên để admin review.`,
    linkUrl: ROUTES.ADMIN.VENDOR_PRODUCTS,
    audienceType: "role",
    roles: [USER_ROLES.ADMIN],
  });
}

export async function reviewVendorProductSubmission(input: ReviewVendorProductSubmissionInput): Promise<void> {
  let vendorUserId = "";
  await withTransaction(async (execute) => {
    const result = await execute<{
      id: string;
      review_status: VendorProductReviewStatus;
      vendor_user_id: string;
    }>(
      `
        SELECT id, review_status, vendor_user_id
        FROM vendor_product_submissions
        WHERE id = $1
        LIMIT 1
      `,
      [input.submissionId]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error("SUBMISSION_NOT_FOUND");
    }
    vendorUserId = row.vendor_user_id;

    if (row.review_status === "approved") {
      throw new Error("SUBMISSION_FINALIZED");
    }

    const reviewNote = (input.reviewNote ?? "").trim();
    await execute(
      `
        UPDATE vendor_product_submissions
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

    const eventMap: Record<ReviewVendorProductSubmissionInput["nextStatus"], { eventType: VendorProductSubmissionEventType; message: string }> = {
      under_review: {
        eventType: "review_started",
        message: "Admin đã nhận xử lý hồ sơ sản phẩm.",
      },
      changes_requested: {
        eventType: "changes_requested",
        message: reviewNote ? `Admin yêu cầu chỉnh sửa: ${reviewNote}` : "Admin yêu cầu vendor chỉnh sửa hồ sơ sản phẩm.",
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

  if (vendorUserId) {
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
      linkUrl: ROUTES.PARTNER.PRODUCT(input.submissionId),
      audienceType: "users",
      userIds: [vendorUserId],
    });
  }
}

export async function approveVendorProductSubmission(input: ApproveVendorProductSubmissionInput): Promise<string> {
  const result = await query<{
    id: string;
    vendor_user_id: string;
    linked_product_id: string | null;
    category_id: string | null;
    submission_type: VendorProductSubmissionType;
    review_status: VendorProductReviewStatus;
    name: string;
    slug_candidate: string;
    excerpt: string;
    description: string;
    thumbnail_url: string;
    fulfillment_type: ProductFulfillmentType;
    purchase_cost: string;
    proposed_stock_quantity: string;
    low_stock_threshold: string;
    allow_backorder: boolean;
    vendor_sku: string;
    vendor_note: string;
  }>(
    `
      SELECT
        id,
        vendor_user_id,
        linked_product_id,
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
        vendor_sku,
        vendor_note
      FROM vendor_product_submissions
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

  let linkedProductId = submission.linked_product_id;
  if (submission.submission_type === "create") {
    const created = await createProduct({
      slug: submission.slug_candidate,
      categoryId: submission.category_id ?? undefined,
      name: submission.name,
      excerpt: submission.excerpt,
      description: submission.description,
      status: "draft",
      productType: "general_product",
      templateKey: "general_product",
      thumbnailUrl: submission.thumbnail_url || undefined,
      price: input.adminSellPrice,
      fulfillmentType: submission.fulfillment_type,
      trackInventory: true,
      stockQuantity: toNumber(submission.proposed_stock_quantity),
      lowStockThreshold: toNumber(submission.low_stock_threshold),
      allowBackorder: submission.allow_backorder,
      costPrice: toNumber(submission.purchase_cost),
      vendorSku: submission.vendor_sku,
      config: {
        generalProduct: {
          ownerType: "vendor",
          vendorUserId: submission.vendor_user_id,
          vendorSku: submission.vendor_sku,
          costPrice: toNumber(submission.purchase_cost),
          vendorNote: submission.vendor_note,
        },
      },
    });

    linkedProductId = created.id;
  } else if (submission.submission_type === "update") {
    if (!submission.linked_product_id) {
      throw new Error("LINKED_PRODUCT_REQUIRED");
    }

    const product = await getProductById(submission.linked_product_id);
    if (!product) {
      throw new Error("LINKED_PRODUCT_NOT_FOUND");
    }

    await updateProduct(product.slug, {
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
      vendorSku: submission.vendor_sku,
      config: {
        generalProduct: {
          ownerType: "vendor",
          vendorUserId: submission.vendor_user_id,
          vendorSku: submission.vendor_sku,
          costPrice: toNumber(submission.purchase_cost),
          vendorNote: submission.vendor_note,
        },
      },
    });
  } else {
    if (!submission.linked_product_id) {
      throw new Error("LINKED_PRODUCT_REQUIRED");
    }

    const product = await getProductById(submission.linked_product_id);
    if (!product) {
      throw new Error("LINKED_PRODUCT_NOT_FOUND");
    }

    await updateProduct(product.slug, {
      status: "draft",
    });
  }

  const reviewNote = (input.reviewNote ?? "").trim();
  await query(
    `
      UPDATE vendor_product_submissions
      SET
        linked_product_id = COALESCE($2, linked_product_id),
        review_status = 'approved',
        admin_sell_price = $3,
        review_note = $4,
        reviewed_by = $5,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
    `,
    [input.submissionId, linkedProductId, input.adminSellPrice, reviewNote, input.actorUserId]
  );

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
    title: "Sản phẩm vendor đã được duyệt",
    body:
      submission.submission_type === "discontinue"
        ? "Admin đã duyệt yêu cầu ngừng bán sản phẩm của bạn."
        : "Admin đã duyệt hồ sơ sản phẩm và áp dụng vào catalog.",
    linkUrl: ROUTES.PARTNER.PRODUCT(input.submissionId),
    audienceType: "users",
    userIds: [submission.vendor_user_id],
  });

  return linkedProductId ?? "";
}
