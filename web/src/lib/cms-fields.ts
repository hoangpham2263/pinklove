export type CmsFields = Record<string, unknown>;

type CmsFieldsContainer = {
  customFields?: Record<string, unknown>;
};

export function getFields<TFields extends CmsFields = CmsFields>(
  page?: CmsFieldsContainer | null
): TFields {
  return ((page?.customFields as TFields | undefined) ?? ({} as TFields));
}
