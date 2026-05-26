export const PROVIDER_SERVICE_KIND_OPTIONS = [
  { value: "makeup", label: "Makeup" },
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
