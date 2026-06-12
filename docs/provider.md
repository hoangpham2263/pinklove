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
- Provider marketplace lead queue:
  - `/provider/leads`
- Provider service bookings:
  - `/provider/bookings`
- Provider portfolio and profile operations:
  - `/provider/portfolio`
  - `/provider/pricing`
  - `/provider/regions`
  - `/provider/reviews`
  - `/provider/organization`
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

## Provider Lead Flow

- `vendor_leads` stores customer interest before a booking exists.
- Providers update lead status and issue quotes from `/provider/leads`.
- Accepting a sent quote creates a booking; it does not create a commerce order.
- Provider lead/search queries belong to `src/features/providers/server/*`.

## Provider Booking and Profile Flow

- `/provider/bookings` is the provider-owned view of service bookings and
  allows direct status updates for assigned bookings.
- `/provider/pricing` manages provider pricing rows for marketplace profile
  enrichment.
- `/provider/regions` manages provider service regions and coverage data.
- `/provider/reviews` surfaces customer reviews created after eligible
  bookings.
- `/provider/portfolio` manages provider media collections and albums.
- `/provider/organization` manages provider organizations, invited members,
  and organization roles.

## Provider Deliverables

- Provider Deliverables is the correct workflow for post-service handoff after
  a photography, videography, planning, or similar service booking.
- Do not overload `/provider/portfolio` or Media Collections as the delivery
  system for customer files. Portfolio and collections are for public/provider
  albums, preview sets, covers, and curated galleries.
- A deliverable should be linked to:
  - `booking`
  - `wedding_site` when the booking belongs to a wedding workspace
  - `provider_user_id` for the provider account performing the handoff
  - `provider_id` when marketplace/provider entity ownership is needed
  - optional lightweight `media_collection` preview or cover set
- The provider-facing form should capture external links instead of uploading
  heavy files into the website:
  - Google Drive, Dropbox, Pixieset, Pic-Time, YouTube/Vimeo, or similar URL
  - delivery title and description
  - file/count summary, such as selected photos, full gallery, raw files, video
  - delivery deadline and delivered-at timestamps
  - customer note and provider internal note
  - status such as `draft`, `sent`, `viewed`, `revision_requested`,
    `accepted`, `expired`, or `broken_link`
- Customer workspace should show deliverables from their bookings, let the
  customer confirm receipt, and let them request revisions or report broken
  links without requiring staff to resend files manually.
- Admin/CSKH should be able to monitor overdue deliverables, broken links,
  revision requests, and bookings whose deliverable is still missing.
- This workflow should be added on top of the existing `wedding_photo` service
  offering type and provider booking flow. Do not add a new offering type only
  to represent file delivery.

## Provider Offering Approval

- Provider product submissions remain account workflow records and store the actor as `provider_user_id`.
- Provider service/product submissions are the required entry point before provider scheduling. A provider cannot create availability for a service until admin has approved/given that provider a service.
- Service submissions must capture service detail up front:
  - `fulfillment_type = service`
  - `service_kind` (`makeup`, `photography`, `videography`, `decoration`, `planning`, `venue`, `consultation`, `handoff`, `other`)
  - `duration_minutes`
  - `service_area`
- When admin approves a provider `create` or `update` submission into the catalog, the runtime must resolve `provider_user_id` to the provider ecosystem entity in `providers.id`.
- Approved provider catalog rows must write that entity into `physical_offerings.provider_id` and `physical_offerings.provider_type`; admin should not choose platform/provider ownership manually in this workflow.
- Approved service submissions must also upsert `service_offerings` and active `provider_services` so provider availability can select the exact service.
- `offering_provider_suppliers.provider_user_id` still records the account-bound supplier workflow, but marketplace/catalog ownership remains `providers.id`.

## Source Finding Flow

- Admin can announce that a published non-template offering needs sourcing. This sets `physical_offerings.allow_provider_supply = true` and sends a provider-role notification.
- Providers respond from `/provider/available-templates` by submitting cost, SKU, lead time, capacity, service area, sample image, material note, quality note, and provider note.
- Admin compares all rows in `provider_offering_supplier_requests` before approving exactly one provider as the active source for that offering.
- Approving one supplier request rejects other open requests for the same offering and revokes older active/paused/suspended suppliers for that offering.
- Approval of a supplier request should update the sell price only when admin intentionally enters a valid admin sell price.

## Provider Availability Flow

- Provider availability belongs to the service booking domain, not to offering type configuration.
- `providers.provider_type` is the provider category (`supplier`, `studio`, `makeup`, `photographer`, etc.). Do not add a separate calendar type just to represent provider categories.
- `booking_calendars` is the provider-owned calendar container. Use `key`, `label`, `timezone`, and `config` when a provider later needs multiple calendars such as default, team, studio room, or seasonal calendars.
- `provider_availability` stores recurring weekly availability rules. Provider-facing rules must scope to an approved service through `provider_service_id`/`offering_id`; do not use provider-wide availability as a substitute for service approval:
  - `provider_service_id`
  - `offering_id`
  - `availability_kind` (`general`, `consultation`, `on_site_service`, `provider_site_service`, `handoff`, `production`)
  - `day_of_week`
  - `starts_at`
  - `ends_at`
  - `duration_minutes`
  - `buffer_before_minutes`
  - `buffer_after_minutes`
  - `capacity`
  - `status` (`available`, `unavailable`, `blocked`)
- `provider_time_slots` is reserved for concrete dated slots used by booking/reservation workflows. It should carry `availability_id`, `provider_service_id`, `offering_id`, and `availability_kind` when generated from a weekly rule. Do not use it as the source of truth for provider-declared weekly rules.
- `fulfillment_type` (`digital`, `physical`, `service`) describes handoff/commerce behavior only. It must not be used as the only calendar classifier. Use `availability_kind` plus `offering_id`/`provider_service_id` to distinguish makeup at customer site, studio work, consultation, production, and handoff windows.
- `/provider/availability` must show a service request CTA instead of calendar controls when the provider has no approved `service` offering.
- The schedulable service list must include only active provider services whose offering has `fulfillment_type = service`.
- Provider UI mutations for availability should use `providerApi.updateAvailability()` from `src/lib/api-client.provider.ts`.
- The provider calendar UI should create a rule only when the user selects/drags a time range. It must include the selected service scope and availability purpose. Clicking an existing rule opens edit actions; it should not delete immediately.
- Admin availability screens may inspect declared availability and concrete time slots, but provider-facing schedule management should remain in `/provider/availability`.

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
- Provider operational status labels should be shown in English consistently with the rest of the project.
