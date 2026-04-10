import type { FieldSchema } from "@/features/pages/schema";

export const GLOBAL_FIELDS_SCHEMA: FieldSchema[] = [
  { name: "siteAnnouncement", label: "Thông báo toàn site", type: "textarea" },
  { name: "supportPhone", label: "Số điện thoại hỗ trợ", type: "text" },
  { name: "supportEmail", label: "Email hỗ trợ", type: "text" },
  { name: "supportAddress", label: "Địa chỉ liên hệ", type: "textarea" },
  { name: "zaloUrl", label: "Liên kết Zalo", type: "text" },
  { name: "facebookUrl", label: "Liên kết Facebook", type: "text" },
  { name: "instagramUrl", label: "Liên kết Instagram", type: "text" },
  { name: "tiktokUrl", label: "Liên kết TikTok", type: "text" },
  { name: "footerCopyright", label: "Copyright footer", type: "text" },
  { name: "defaultShareBadge", label: "Ảnh badge dùng chung", type: "media" },
];
