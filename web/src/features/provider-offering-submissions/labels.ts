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
      return "Nháp";
    case "submitted":
      return "Đã gửi duyệt";
    case "under_review":
      return "Đang duyệt";
    case "changes_requested":
      return "Cần chỉnh sửa";
    case "approved":
      return "Đã duyệt";
    case "rejected":
      return "Từ chối";
    case "archived":
      return "Lưu trữ";
    default:
      return value;
  }
}

export function getProviderOfferingSupplierRequestStatusLabel(value: ProviderOfferingSupplierRequestStatus) {
  switch (value) {
    case "submitted":
      return "Đã gửi duyệt";
    case "under_review":
      return "Đang duyệt";
    case "changes_requested":
      return "Cần bổ sung";
    case "approved":
      return "Đã duyệt";
    case "rejected":
      return "Từ chối";
    default:
      return value;
  }
}

export function getOfferingProviderSupplierStatusLabel(value: OfferingProviderSupplierStatus) {
  switch (value) {
    case "active":
      return "Đang cung cấp";
    case "paused":
      return "Tạm dừng";
    case "suspended":
      return "Bị hạn chế";
    case "revoked":
      return "Đã thu hồi";
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
