export type ProviderAvailabilityKind =
  | "general"
  | "consultation"
  | "on_site_service"
  | "provider_site_service"
  | "handoff"
  | "production";

export const PROVIDER_AVAILABILITY_KIND_OPTIONS: Array<{ value: ProviderAvailabilityKind; label: string }> = [
  { value: "general", label: "Thời gian làm việc" },
  { value: "consultation", label: "Tư vấn ban đầu" },
  { value: "on_site_service", label: "Làm tại địa điểm khách" },
  { value: "provider_site_service", label: "Làm tại studio/cửa hàng" },
  { value: "handoff", label: "Bàn giao/nhận hàng" },
  { value: "production", label: "Sản xuất/chuẩn bị" },
];

export const PROVIDER_AVAILABILITY_KIND_VALUES = PROVIDER_AVAILABILITY_KIND_OPTIONS.map((option) => option.value);

export const PROVIDER_SERVICE_SCOPED_AVAILABILITY_KIND_VALUES: ProviderAvailabilityKind[] = [
  "on_site_service",
  "provider_site_service",
  "handoff",
  "production",
];

export function providerAvailabilityKindRequiresService(value: string | null | undefined) {
  return PROVIDER_SERVICE_SCOPED_AVAILABILITY_KIND_VALUES.includes(value as ProviderAvailabilityKind);
}

export function getProviderAvailabilityKindLabel(value: string | null | undefined) {
  return PROVIDER_AVAILABILITY_KIND_OPTIONS.find((option) => option.value === value)?.label ?? "Thời gian làm việc";
}

export function getProviderAvailabilityKindClassName(value: string | null | undefined) {
  switch (value) {
    case "consultation":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "on_site_service":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "provider_site_service":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "handoff":
      return "bg-orange-50 text-orange-700 ring-orange-200";
    case "production":
      return "bg-teal-50 text-teal-700 ring-teal-200";
    case "general":
    default:
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
}

export function getProviderAvailabilityKindEventColors(value: ProviderAvailabilityKind) {
  switch (value) {
    case "consultation":
      return { backgroundColor: "#fffbeb", borderColor: "#f59e0b", textColor: "#92400e" };
    case "on_site_service":
      return { backgroundColor: "#eff6ff", borderColor: "#3b82f6", textColor: "#1e40af" };
    case "provider_site_service":
      return { backgroundColor: "#f5f3ff", borderColor: "#8b5cf6", textColor: "#5b21b6" };
    case "handoff":
      return { backgroundColor: "#fff7ed", borderColor: "#f97316", textColor: "#9a3412" };
    case "production":
      return { backgroundColor: "#f0fdfa", borderColor: "#14b8a6", textColor: "#0f766e" };
    case "general":
    default:
      return { backgroundColor: "#f0fdf4", borderColor: "#22c55e", textColor: "#166534" };
  }
}
