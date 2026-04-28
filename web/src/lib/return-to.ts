export function getSafeReturnTo(value: FormDataEntryValue | string | string[] | null | undefined, fallback: string) {
  const rawValue = (Array.isArray(value) ? value[0] : String(value ?? "")).trim();
  return rawValue.startsWith("/") && !rawValue.startsWith("//") ? rawValue : fallback;
}
