# Customer Convention

This file covers the normal customer area and customer-owned site flows.

## Scope

- `src/app/customer/*`
- `src/app/customer/(protected)/(workspace)/design/[id]/page.tsx`
- `src/app/api/customer/*`
- `src/features/customer/*`
- customer-facing parts of `src/features/invitations/*`

## Rules

- The session cookie name is `pinklove_session`.
- Stored roles are `ADMIN`, `CUSTOMER`, `AFFILIATE`, and `VENDOR`.
- Public visitors are treated as the `GUEST` actor in code/docs, but are not stored in the `users` table.
- The first registered account becomes `ADMIN`.
- Logged-in non-admin users (`CUSTOMER`, `AFFILIATE`, `VENDOR`) should be redirected away from customer auth pages back to the customer dashboard.
- Admins may access the normal customer area for management and preview workflows.
- Builder-template sites should be edited through the dedicated designer route, not the generic site detail form.
- Invitation ownership now comes from ecommerce entitlements for paid products before customer create flows can instantiate new sites.
- Customer purchase flow uses cart and checkout routes before order creation. The invitation/site table name remains `wedding_sites`.
- Customer address management owns the reusable address book at `/customer/addresses`. A user may store multiple shipping addresses in `user_addresses`, with exactly one default address when at least one address exists.
- Checkout should prefer the default saved address for physical orders, while still allowing a one-off shipping address snapshot on the order.
- Current builder limitations:
  - element height is not draggable/resizable yet
  - editor grouping is not implemented yet

## Current customer routes

- `src/app/customer/(auth)/login/page.tsx`
- `src/app/customer/(auth)/register/page.tsx`
- `src/app/customer/(protected)/(workspace)/dashboard/page.tsx`
- `src/app/customer/(protected)/(workspace)/invitations/page.tsx`
- `src/app/customer/(protected)/(workspace)/invitations/[id]/page.tsx`
- `src/app/customer/(protected)/(workspace)/orders/page.tsx`
- `src/app/customer/(protected)/(workspace)/orders/[id]/page.tsx`
- `src/app/customer/(protected)/(account)/profile/page.tsx`
- `src/app/customer/(protected)/(account)/settings/page.tsx`
- `src/app/customer/(protected)/(growth)/affiliate/page.tsx`
- `src/app/customer/(protected)/(growth)/vendor/page.tsx`
- `src/app/customer/(protected)/(workspace)/design/[id]/page.tsx`
