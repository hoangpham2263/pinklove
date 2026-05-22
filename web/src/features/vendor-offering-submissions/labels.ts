import type {
  VendorOfferingReviewStatus,
  VendorOfferingSubmissionType,
} from "@/features/vendor-offering-submissions/types";

export function getVendorOfferingSubmissionTypeLabel(value: VendorOfferingSubmissionType) {
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

export function getVendorOfferingReviewStatusLabel(value: VendorOfferingReviewStatus) {
  switch (value) {
    case "draft":
      return "Nháp";
    case "submitted":
      return "Đã gửi duyệt";
    case "under_review":
      return "Đang review";
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
