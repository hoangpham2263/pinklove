"use client";

import { apiFetch, apiJson } from "@/lib/api";
import { postForm, type MutationResult } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import type { ProviderOrderDetail, ProviderOrderSummary } from "@/features/provider-orders/types";

export type ProviderPortalStats = {
  total: number;
  active: number;
  review: number;
  completed: number;
};

async function submitForm(action: string, formData: FormData): Promise<MutationResult> {
  return postForm(action, formData);
}

async function updateShippingProfile(formData: FormData) {
  return submitForm(ROUTES.API.PROVIDER.SHIPPING_PROFILE, formData);
}

async function updateProviderAssignment(formData: FormData) {
  return submitForm(ROUTES.API.PROVIDER.ORDERS.UPDATE, formData);
}

async function saveOfferingSubmission(formData: FormData) {
  return submitForm(ROUTES.API.PROVIDER.OFFERINGS.SUBMISSIONS, formData);
}

async function submitOfferingSubmission(submissionId: string, formData: FormData) {
  return submitForm(ROUTES.API.PROVIDER.OFFERINGS.SUBMIT(submissionId), formData);
}

async function createSupplyRequest(formData: FormData) {
  return submitForm(ROUTES.API.PROVIDER.OFFERINGS.SUPPLY_REQUESTS, formData);
}

async function updateAvailability(formData: FormData) {
  return submitForm(ROUTES.API.PROVIDER.AVAILABILITY, formData);
}

async function fetchProviderOrderDetail(url: string) {
  const response = await apiFetch(url, {
    cache: "no-store",
  });

  if (response.status === 404) {
    throw new Error("not_found");
  }

  if (!response.ok) {
    throw new Error("LOAD_FAILED");
  }

  const data = (await response.json()) as { detail?: ProviderOrderDetail | null };
  return data.detail ?? null;
}

async function fetchRequiredProviderOrderDetail(url: string) {
  const detail = await fetchProviderOrderDetail(url);
  if (!detail) {
    throw new Error("LOAD_FAILED");
  }

  return detail;
}

async function fetchProviderPortalSummary(url: string) {
  return apiJson<{
    stats?: ProviderPortalStats;
    assignments?: ProviderOrderSummary[];
  }>(url, {
    cache: "no-store",
  });
}

export const providerApi = {
  updateShippingProfile,
  updateProviderAssignment,
  saveOfferingSubmission,
  submitOfferingSubmission,
  createSupplyRequest,
  updateAvailability,
  fetchProviderOrderDetail,
  fetchRequiredProviderOrderDetail,
  fetchProviderPortalSummary,
};

export const providerApiActions = {
  updateShippingProfile: ROUTES.API.PROVIDER.SHIPPING_PROFILE,
  updateProviderAssignment: ROUTES.API.PROVIDER.ORDERS.UPDATE,
  saveOfferingSubmission: ROUTES.API.PROVIDER.OFFERINGS.SUBMISSIONS,
  submitOfferingSubmission: ROUTES.API.PROVIDER.OFFERINGS.SUBMIT,
  createSupplyRequest: ROUTES.API.PROVIDER.OFFERINGS.SUPPLY_REQUESTS,
  updateAvailability: ROUTES.API.PROVIDER.AVAILABILITY,
} as const;
