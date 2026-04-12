# Partner Docs

Use this file for the dedicated vendor/partner portal.

## Scope

- `partner/*` is a separate protected area for accounts with role `VENDOR`.
- Do not mix partner order management into the customer workspace when the behavior is operational or collaboration-heavy.
- Keep `customer/vendor` as a lightweight bridge page only. The real working surface belongs in `partner/*`.

## Routes

- Public partner auth:
  - `/partner/login`
- Public vendor entry:
  - `/partner/[slug]`
- Canonical partner working surface:
  - `/partner/[slug]`
- Protected partner detail route:
  - `/partner/orders/[id]`
- Legacy redirect-only aliases:
  - `/partner/dashboard`
  - `/partner/orders`

## Auth

- Use `requireVendor()` for all protected partner routes and partner-only APIs.
- Partner login must use the dedicated route handler `POST /api/partner/auth/login`.
- Each vendor has a dedicated canonical portal link at `/partner/[slug]`.
- After vendor login, redirects should resolve back to the canonical portal link when possible.
- Non-vendor users must not enter the partner workspace.

## Vendor Order Flow

- Use `vendor_order_assignments` as the source of truth for which vendor owns which order.
- Use `vendor_order_events` as the append-only activity timeline between admin and vendor.
- Admin assigns or reassigns a vendor from admin order detail.
- Admin can also open a vendor-specific portal link from the vendor management area.
- Vendor updates status, vendor reference, and vendor note from partner order detail.
- Admin reads vendor progress back on the admin order detail page.
- Vendor also sees admin-driven order-state changes from the partner order detail without a page reload.
- Internal links from admin or customer bridge pages should prefer the canonical vendor portal link, not the legacy aliases.

## Realtime Direction

- Use the event log first.
- Vendor assignment and portal realtime should build on top of the shared realtime core described in `docs/realtime.md`.
- Keep `vendor_order_assignments` and `vendor_order_events` as the storage contract behind realtime views.
- Do not introduce partner-only transport rules that diverge from the shared SSE/resource model unless the shared realtime doc is updated in the same task.

## UI Rules

- Partner pages use the same shared card/button/input language as admin and customer areas.
- Keep the canonical vendor portal operations-first:
  - landing + login when signed out
  - assigned-order list when signed in
  - link into per-order detail
  - realtime activity visibility
- Keep `/partner/orders/[id]` focused on timeline and vendor status updates.
- Avoid admin-style navigation shells for the vendor-facing canonical portal.
- Partner operational status labels should be shown in Vietnamese even when the stored enum values remain English in code and database.
