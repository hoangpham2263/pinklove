# Customer Convention

This file covers the normal customer area and customer-owned site flows.

## Scope

- `src/app/customer/*`
- `src/app/customer/(builder)/design/[id]/page.tsx`
- `src/app/api/customer/*`
- `src/features/customer/*`
- customer-facing parts of `src/features/invitations/*`

## Rules

- The session cookie name is `pinklove_session`.
- Stored roles are `ADMIN`, `CUSTOMER`, `AFFILIATE`, and `PROVIDER`.
- Public visitors are treated as the `GUEST` actor in code/docs, but are not stored in the `users` table.
- The first registered account becomes `ADMIN`.
- Logged-in non-admin users (`CUSTOMER`, `AFFILIATE`, `PROVIDER`) should be redirected away from customer auth pages back to the customer dashboard.
- Admins may access the normal customer area for management and preview workflows.
- Builder-template sites should be edited through the dedicated designer route, not the generic site detail form.
- Invitation ownership now comes from ecommerce entitlements for paid offerings before customer create flows can instantiate new sites.
- Customer purchase flow uses cart and checkout routes before order creation. The invitation/site table name remains `wedding_sites`.
- `/customer/wedding-planning` manages project metadata, guest groups, guests,
  RSVP, seating, checklist tasks, and timeline items for customer-owned sites.
- `/customer/vendor-leads` owns customer lead creation, quote review, and quote
  acceptance into the separate booking lifecycle.
- `/customer/bookings` owns the service-booking lifecycle after direct service
  booking or accepted provider quotes. Keep it separate from physical commerce
  orders.
- Customer address management owns the reusable address book at `/customer/config/addresses`. A user may store multiple shipping addresses in `user_addresses`, with exactly one default address when at least one address exists.
- Checkout should prefer the default saved address for physical orders, while still allowing a one-off shipping address snapshot on the order.
- Invitation builder supports element height resizing plus grouping/ungrouping
  selected elements.
- Customer UI mutations and fetches should go through `src/lib/api-client.customer.ts`.
- Public/guest-only UI flows should use `src/lib/api-client.public.ts`, not the customer client file.
- If a customer client form needs a native `action=` fallback, prefer `customerApiActions.*` from the same role API file.

## Current customer routes

- `src/app/login/page.tsx`
- `src/app/register/page.tsx`
- `src/app/customer/(protected)/(workspace)/dashboard/page.tsx`
- `src/app/customer/(protected)/(workspace)/invitations/page.tsx`
- `src/app/customer/(protected)/(workspace)/invitations/[id]/page.tsx`
- `src/app/customer/(protected)/(workspace)/orders/page.tsx`
- `src/app/customer/(protected)/(workspace)/orders/[id]/page.tsx`
- `src/app/customer/(protected)/(workspace)/wedding-planning/page.tsx`
- `src/app/customer/(protected)/(workspace)/vendor-leads/page.tsx`
- `src/app/customer/(protected)/(workspace)/bookings/page.tsx`
- `src/app/customer/(protected)/(workspace)/messages/page.tsx`
- `src/app/customer/(protected)/(account)/config/page.tsx`
- `src/app/customer/(protected)/(account)/config/profile/page.tsx`
- `src/app/customer/(protected)/(account)/config/addresses/page.tsx`
- `src/app/customer/(protected)/(account)/config/addresses/new/page.tsx`
- `src/app/customer/(protected)/(account)/config/addresses/[id]/page.tsx`
- `src/app/customer/(protected)/(account)/config/addresses/[id]/edit/page.tsx`
- `src/app/customer/(protected)/(growth)/affiliate/page.tsx`
- `src/app/customer/(protected)/(growth)/affiliate/links/page.tsx`
- `src/app/customer/(protected)/(growth)/provider/page.tsx`
- `src/app/customer/(builder)/design/[id]/page.tsx`
