export const PROVIDER_SERVICE_KIND_OPTIONS = [
  { value: "photography", label: "Chụp ảnh" },
  { value: "videography", label: "Quay phim" },
  { value: "decoration", label: "Trang trí" },
  { value: "planning", label: "Wedding planner" },
  { value: "venue", label: "Địa điểm/studio" },
  { value: "consultation", label: "Tư vấn" },
  { value: "handoff", label: "Bàn giao/nhận hàng" },
  { value: "other", label: "Dịch vụ khác" },
];

export const PROVIDER_SERVICE_KIND_VALUES = PROVIDER_SERVICE_KIND_OPTIONS.map((option) => option.value);

export function getProviderServiceKindLabel(value: string | null | undefined) {
  return PROVIDER_SERVICE_KIND_OPTIONS.find((option) => option.value === value)?.label ?? "Dịch vụ khác";
}

export function getProviderServiceOfferingTypeKey(value: string | null | undefined) {
  switch (value) {
    case "photography":
      return "wedding_photo";
    case "videography":
      return "wedding_video";
    case "decoration":
      return "wedding_service";
    case "planning":
      return "wedding_service";
    case "venue":
    case "consultation":
    case "handoff":
    case "other":
    default:
      return "wedding_service";
  }
}
