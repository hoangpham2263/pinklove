import type {
  OfferingProviderSupplierSource,
  OfferingProviderSupplierStatus,
  ProviderOfferingReviewStatus,
  ProviderOfferingSupplierRequestStatus,
  ProviderOfferingSubmissionType,
} from "@/features/provider-offering-submissions/types";

export function getProviderOfferingSubmissionTypeLabel(value: ProviderOfferingSubmissionType) {
  switch (value) {
    case "create":
      return "Tạo mới";
    case "update":
      return "Cập nhật";
    case "discontinue":
      return "Ngừng bán";
    default:
      return value;
  }
}

export function getProviderOfferingReviewStatusLabel(value: ProviderOfferingReviewStatus) {
  switch (value) {
    case "draft":
      return "Draft";
    case "submitted":
      return "Submitted";
    case "under_review":
      return "Under review";
    case "changes_requested":
      return "Changes requested";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "archived":
      return "Archived";
    default:
      return value;
  }
}

export function getProviderOfferingSupplierRequestStatusLabel(value: ProviderOfferingSupplierRequestStatus) {
  switch (value) {
    case "submitted":
      return "Submitted";
    case "under_review":
      return "Under review";
    case "changes_requested":
      return "Changes requested";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return value;
  }
}

export function getOfferingProviderSupplierStatusLabel(value: OfferingProviderSupplierStatus) {
  switch (value) {
    case "active":
      return "Active";
    case "paused":
      return "Paused";
    case "suspended":
      return "Suspended";
    case "revoked":
      return "Revoked";
    default:
      return value;
  }
}

export function getOfferingProviderSupplierSourceLabel(value: OfferingProviderSupplierSource) {
  switch (value) {
    case "admin":
      return "Admin gán";
    case "proposal":
      return "Từ hồ sơ dịch vụ/sản phẩm";
    case "supplier_request":
      return "Từ yêu cầu cung cấp";
    default:
      return value;
  }
}
