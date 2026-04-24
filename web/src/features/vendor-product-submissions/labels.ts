import type {
  VendorProductReviewStatus,
  VendorProductSubmissionType,
} from "@/features/vendor-product-submissions/types";

export function getVendorProductSubmissionTypeLabel(value: VendorProductSubmissionType) {
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

export function getVendorProductReviewStatusLabel(value: VendorProductReviewStatus) {
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
