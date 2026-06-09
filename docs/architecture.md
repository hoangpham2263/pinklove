# Architecture

PinkLove is a modular Next.js monolith backed by PostgreSQL. The project is a
wedding commerce platform, not a single-purpose invitation CRUD app.

## Product Scope

Core product areas:

- Online invitations and wedding websites.
- Paper invitations and physical wedding products.
- Builder and coded invitation templates.
- Wedding services such as makeup, photography, planning, decoration, venue,
  consultation, production, and handoff workflows.
- Provider marketplace, affiliate tracking, checkout, orders, payments,
  notifications, media, landing pages, and analytics.

## System Shape

- App: `web/`, using Next.js App Router.
- Database: PostgreSQL, initialized through `web/src/lib/database.ts`.
- Domain code: `web/src/features/<feature>`.
- Shared infra: `web/src/lib`.
- Realtime: SSE over PostgreSQL `LISTEN/NOTIFY`.
- Events: durable business events in `domain_events` and canonical names in
  `domain_event_types`.
- Docs source of truth:
  - Schema: `docs/schema.md`
  - Folder/routes: `docs/structure.md`
  - Repo conventions: `docs/conventions.md`
  - Area rules: `docs/admin.md`, `docs/customer.md`, `docs/provider.md`,
    `docs/ecommerce.md`, `docs/guest.md`, `docs/realtime.md`

## Domain Boundaries

- `offerings` is the sellable catalog source of truth.
- `offering_types`, `offering_type_field_groups`, and `offering_type_fields`
  define dynamic offering admin fields.
- Durable commerce, booking, provider, analytics, permission, payment, and
  inventory data must live in relational tables.
- JSONB config is allowed for UI metadata, flexible display settings, template
  runtime data, and non-critical structured content.
- `landing_pages` owns campaign pages. Product/offering data is only a source
  reference through `source_offering_id`.
- `providers.id` is the marketplace provider identity. Account ownership uses
  `providers.owner_user_id`.
- `provider_user_id` is only for account-bound supplier/request workflows.

## Active Feature Foundations

These tables are intentionally kept and have service-level wiring. They are not
old template-version tables.

- Booking workflow:
  `bookings`, `booking_items`, `booking_payments`, `booking_status_logs`,
  `provider_time_slots`.
- Provider marketplace:
  `providers`, `provider_profiles`, `provider_services`, `provider_pricing`,
  `provider_regions`, `provider_reviews`, `regions`, `service_regions`,
  `shipping_regions`.
- Organization/team ownership:
  `organizations`, `organization_roles`, `organization_members`.
- Media relations:
  `media_asset_links`.
- Field audit:
  `field_change_logs`.

## Current Completion Gaps

These are product gaps, not unused database tables:

- Expose customer booking creation through a polished UI flow.
- Add admin/provider screens for booking status and booking payment management.
- Expand provider pricing/region/review management beyond service-level helpers.
- Add organization management UI if multi-user provider teams become active.
- Add admin surface for field-level audit log inspection when needed.

## Operating Rules

- Keep PinkLove as a modular monolith until a concrete scale bottleneck exists.
- Do not introduce microservices, Kafka, RabbitMQ, broad CQRS, or a distributed
  event bus without a measured need.
- Do not reintroduce old `template_*` version/catalog tables. Template discovery
  now belongs to offerings, landing pages, template attributes, analytics, and
  search documents.
- When schema changes, update `web/src/lib/database.ts`, `docs/schema.md`, and
  `web/scripts/audit-schema.mjs` together.
- When a feature workflow changes, update the matching area doc in the same
  change.
