# Provider Docs

Use this file for the dedicated provider portal.

## Scope

- `provider/*` is a separate protected area for accounts with role `PROVIDER`.
- Do not mix provider order management into the customer workspace when the behavior is operational or collaboration-heavy.
- Keep `customer/provider` as a lightweight bridge page only. The real working surface belongs in `provider/*`.

## Routes

- Public provider auth:
  - `/provider/login`
- Public provider entry:
  - `/provider`
- Canonical provider working surface:
  - `/provider`
- Protected provider detail route:
  - `/provider/orders/[id]`
- Legacy redirect-only aliases:
  - `/provider/dashboard`
  - `/provider/orders`

## Auth

- Use `requireProvider()` for all protected provider routes and provider-only APIs.
- Provider login must use the dedicated route handler `POST /api/provider/auth/login`.
- Each provider has a dedicated canonical portal link at `/provider`.
- After provider login, redirects should resolve back to the canonical portal link when possible.
- Non-provider users must not enter the provider workspace.
- Provider UI mutations and fetches should go through `src/lib/api-client.provider.ts`.
- If a provider client form needs a native `action=` fallback, prefer `providerApiActions.*` from the same role API file when the endpoint is fixed.

## Provider Order Flow

- Use `provider_order_assignments` as the source of truth for which provider owns which order.
- Use `provider_order_events` as the append-only activity timeline between admin and provider.
- Admin assigns or reassigns a provider from admin order detail.
- Admin can also open a provider-specific portal link from the provider management area.
- Provider updates status, provider reference, and provider note from provider order detail.
- Admin reads provider progress back on the admin order detail page.
- Provider also sees admin-driven order-state changes from the provider order detail without a page reload.
- Provider receives realtime account notifications from the provider portal header bell without switching to another page.
- Internal links from admin or customer bridge pages should prefer the canonical provider portal link, not the legacy aliases.

## Provider Offering Approval

- Provider product submissions remain account workflow records and store the actor as `provider_user_id`.
- When admin approves a provider `create` or `update` submission into the catalog, the runtime must resolve `provider_user_id` to the provider ecosystem entity in `providers.id`.
- Approved provider catalog rows must write that entity into `physical_offerings.provider_id` and `physical_offerings.provider_type`; admin should not choose platform/provider ownership manually in this workflow.
- `offering_provider_suppliers.provider_user_id` still records the account-bound supplier workflow, but marketplace/catalog ownership remains `providers.id`.

## Source Finding Flow

- Admin can announce that a published non-template offering needs sourcing. This sets `physical_offerings.allow_provider_supply = true` and sends a provider-role notification.
- Providers respond from `/provider/available-templates` by submitting cost, SKU, lead time, capacity, service area, sample image, material note, quality note, and provider note.
- Admin compares all rows in `provider_offering_supplier_requests` before approving exactly one provider as the active source for that offering.
- Approving one supplier request rejects other open requests for the same offering and revokes older active/paused/suspended suppliers for that offering.
- Approval of a supplier request should update the sell price only when admin intentionally enters a valid admin sell price.

## Realtime Direction

- Use the event log first.
- Provider assignment and portal realtime should build on top of the shared realtime core described in `docs/realtime.md`.
- Keep `provider_order_assignments` and `provider_order_events` as the storage contract behind realtime views.
- Do not introduce provider-only transport rules that diverge from the shared SSE/resource model unless the shared realtime doc is updated in the same task.

## UI Rules

- Provider pages use the same shared card/button/input language as admin and customer areas.
- Keep the canonical provider portal operations-first:
  - landing + login when signed out
  - assigned-order list when signed in
  - link into per-order detail
  - realtime activity visibility
- Keep `/provider/orders/[id]` focused on timeline and provider status updates.
- Avoid admin-style navigation shells for the provider-facing canonical portal.
- Provider operational status labels should be shown in Vietnamese even when the stored enum values remain English in code and database.
