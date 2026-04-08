export type CmsFields = Record<string, unknown>;
export type StructuredData = Record<string, unknown> | Array<Record<string, unknown>>;
export const STRUCTURED_DATA_FIELD = "structuredDataJson";

type CmsFieldsContainer = {
  customFields?: Record<string, unknown>;
};

export function getFields<TFields extends CmsFields = CmsFields>(
  page?: CmsFieldsContainer | null
): TFields {
  return ((page?.customFields as TFields | undefined) ?? ({} as TFields));
}

export function getStructuredData(
  page?: CmsFieldsContainer | null
): StructuredData | null {
  const rawValue = page?.customFields?.[STRUCTURED_DATA_FIELD];
  if (typeof rawValue !== "string") {
    return null;
  }

  const normalizedValue = rawValue.trim();
  if (!normalizedValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(normalizedValue);
    if (Array.isArray(parsed)) {
      return parsed.every((item) => item && typeof item === "object")
        ? (parsed as Array<Record<string, unknown>>)
        : null;
    }

    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
