"use client";

import { apiFetch, apiJson } from "@/lib/api";
import { postForm, type MutationResult } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import type { VendorOrderDetail, VendorOrderSummary } from "@/features/vendor-orders/types";

export type VendorPortalStats = {
  total: number;
  active: number;
  review: number;
  completed: number;
};

async function submitForm(action: string, formData: FormData): Promise<MutationResult> {
  return postForm(action, formData);
}

async function updateShippingProfile(formData: FormData) {
  return submitForm(ROUTES.API.PARTNER.SHIPPING_PROFILE, formData);
}

async function updateVendorAssignment(formData: FormData) {
  return submitForm(ROUTES.API.PARTNER.ORDERS.UPDATE, formData);
}

async function saveProductSubmission(formData: FormData) {
  return submitForm(ROUTES.API.PARTNER.PRODUCTS.SUBMISSIONS, formData);
}

async function submitProductSubmission(submissionId: string, formData: FormData) {
  return submitForm(ROUTES.API.PARTNER.PRODUCTS.SUBMIT(submissionId), formData);
}

async function fetchVendorOrderDetail(url: string) {
  const response = await apiFetch(url, {
    cache: "no-store",
  });

  if (response.status === 404) {
    throw new Error("not_found");
  }

  if (!response.ok) {
    throw new Error("LOAD_FAILED");
  }

  const data = (await response.json()) as { detail?: VendorOrderDetail | null };
  return data.detail ?? null;
}

async function fetchRequiredVendorOrderDetail(url: string) {
  const detail = await fetchVendorOrderDetail(url);
  if (!detail) {
    throw new Error("LOAD_FAILED");
  }

  return detail;
}

async function fetchVendorPortalSummary(url: string) {
  return apiJson<{
    stats?: VendorPortalStats;
    assignments?: VendorOrderSummary[];
  }>(url, {
    cache: "no-store",
  });
}

export const vendorApi = {
  updateShippingProfile,
  updateVendorAssignment,
  saveProductSubmission,
  submitProductSubmission,
  fetchVendorOrderDetail,
  fetchRequiredVendorOrderDetail,
  fetchVendorPortalSummary,
};

export const vendorApiActions = {
  updateShippingProfile: ROUTES.API.PARTNER.SHIPPING_PROFILE,
  updateVendorAssignment: ROUTES.API.PARTNER.ORDERS.UPDATE,
  saveProductSubmission: ROUTES.API.PARTNER.PRODUCTS.SUBMISSIONS,
  submitProductSubmission: ROUTES.API.PARTNER.PRODUCTS.SUBMIT,
} as const;
