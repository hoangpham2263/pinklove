import { notFound } from "next/navigation";

import { getOfferingTypeByKey } from "@/features/offerings/server/service";
import { getRegisteredOfferingType } from "@/features/offerings/type-registry";
import { SYSTEM_OFFERING_TYPES } from "@/features/offerings/types";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { OfferingTypeForm } from "../offering-type-form";

type AdminOfferingTypeEditorPageProps = {
  params: Promise<{ key: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOfferingTypeEditorPage({
  params,
  searchParams,
}: AdminOfferingTypeEditorPageProps) {
  await requireAdmin();
  const { key } = await params;
  const query = (await searchParams) ?? {};
  const returnTo = getQueryValue(query.returnTo) ?? ROUTES.ADMIN.OFFERING_TYPES;
  const decodedKey = decodeURIComponent(key);

  if (decodedKey === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE || !getRegisteredOfferingType(decodedKey)) {
    notFound();
  }

  const offeringType = await getOfferingTypeByKey(decodedKey);

  if (!offeringType) {
    notFound();
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Chỉnh offering type: {offeringType.label}</h1>
        <p className="font-mono text-sm text-muted-foreground">{offeringType.key}</p>
      </div>
      <OfferingTypeForm offeringType={offeringType} returnTo={returnTo} />
    </section>
  );
}
