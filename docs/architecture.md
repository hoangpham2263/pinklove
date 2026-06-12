# Architecture

PinkLove is a modular Next.js monolith backed by PostgreSQL. The project is a
long-term wedding platform in the direction of The Knot, Zola, and
WeddingWire, while keeping the existing builder, commerce, marketplace,
provider portal, and landing strengths.

## Product Scope

Core product areas:

- Online invitations and wedding websites.
- Paper invitations and physical wedding products.
- Builder and coded invitation templates.
- Wedding services such as makeup, photography, planning, decoration, venue,
  consultation, production, and handoff workflows.
- Provider marketplace, affiliate tracking, checkout, orders, payments,
  notifications, media, landing pages, and analytics.

## Bounded Contexts

Every database object must belong to exactly one of these contexts:

| Context | Owns |
| --- | --- |
| Catalog | `offerings`, offering type tables, offering field definitions, offering search |
| Commerce | ecommerce orders, order items, payments, shipments, entitlements |
| Provider Marketplace | providers, services, pricing, regions, reviews, fulfillments, leads, quotes, provider search |
| Wedding Planning | `wedding_sites`, guests, RSVP, seating, tasks, timeline |
| Website Builder | reusable `pages` and `page_sections` owned by wedding sites, providers, offerings, or landing entities |
| Marketing | landing pages, landing sections, campaigns, A/B experiments, conversion goals/events |

Do not add a database table unless its bounded context is clear. Do not create
duplicate root concepts for the same domain.

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
- Cross-module writes should go through owning services, public APIs, or domain
  events. Shared read models are allowed when they are intentionally query-only.

## Module Ownership

| Module | Owns |
| --- | --- |
| Catalog | `offerings`, `offering_types`, `offering_type_fields`, `offering_type_field_groups` |
| Provider Marketplace | `providers`, `provider_profiles`, `provider_services`, `provider_reviews`, `provider_regions`, `provider_pricing`, `provider_fulfillments`, `provider_types` |
| Commerce | `commerce_orders`, `commerce_order_items`, `commerce_payments`, `commerce_entitlements`, `commerce_shipments` |
| Booking | `bookings`, `booking_items`, `booking_payments`, `booking_status_logs`, `provider_availability`, `provider_time_slots` |
| Website Builder | `pages`, `page_sections` |
| Wedding Planning | `wedding_sites`, guests, RSVP, seating, checklist, timeline |
| Marketing | `landing_pages`, `landing_page_sections`, `campaigns`, `ab_experiments`, `ab_experiment_landing_pages`, conversion goals/events |
| Media | `media_assets`, direct media links, media collections |

## Search And Cache

- `offering_search_documents` is the canonical offering search read model.
- Search sync should be idempotent by `offering_id`.
- Search indexing must exclude payment state, permissions, inventory internals,
  and analytics payloads.
- Stable cache tags are `offering:{id}`, `provider:{id}`, `template:{id}`, and
  `wedding_site:{id}`.
- Cache invalidation events such as `offering.updated`, `template.updated`,
  `provider.updated`, and `site.published` should resolve to stable tags before
  falling back to broad route refresh.

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

## Implemented Architecture

### Catalog

- Keep `offerings` as the catalog root. Everything sellable is an offering.
- Keep `offering_types`, `offering_type_fields`, and
  `offering_type_field_groups`.
- New catalog work must extend `offerings` and offering type metadata instead
  of creating another sellable-item root.

### Provider Marketplace

- Keep the current provider ecosystem tables.
- Do not rename providers to organizations. Organizations remain a separate
  ownership/team concept.
- `vendor_leads` and `vendor_quotes` own the lead-to-quote flow before a
  customer accepts a quote and creates a booking.
- `provider_search_documents` owns the denormalized provider search document.

### Commerce And Booking

- Keep ecommerce orders separate from bookings.
- Order lifecycle and booking lifecycle must not merge.
- Commerce owns `commerce_*`; booking owns `bookings`, `booking_items`,
  `booking_payments`, `booking_status_logs`, availability, and time slots.

### Website Builder

- `pages` is the reusable page root for builder-managed surfaces.
- `page_sections` stores reusable section content and targeting metadata.
- `pages` supports `owner_type`, `owner_id`, and `page_type`.
- `page_sections` supports `visibility_rules`, `display_conditions`, and
  `ab_variant_key`.
- The builder supports wedding sites, landing pages, provider pages, campaign
  pages, and SEO pages.

### Wedding Planning

- Keep `wedding_sites` as the wedding planning aggregate name. Do not rename it
  to `wedding_projects`.
- Expand `wedding_sites` with planning fields: `project_status`, `budget`,
  `event_date`, and `guest_target`.
- Guest groups, RSVP details, seating tables, checklist tasks, and timeline
  items belong under the Wedding Planning context.

### Media

- Keep `media_asset_links` for direct asset relations.
- `media_collections` and `media_collection_items` own ordered wedding albums,
  provider portfolios, and galleries.
- Media Collections may be linked to provider deliverables only as lightweight
  preview, cover, thumbnail, or curated gallery records. They must not become
  the source of truth for full-resolution post-shoot file delivery.
- Full-resolution wedding photo/video handoff belongs to a Provider
  Deliverables workflow tied to `bookings`, `wedding_sites`, and the provider
  account/entity. Store external delivery links and metadata there; keep heavy
  files in Google Drive, Dropbox, Pixieset, Pic-Time, YouTube/Vimeo, or an
  equivalent provider-owned storage system.

### Marketing And Analytics

- Keep `landing_pages`, `landing_page_sections`, `campaigns`,
  `ab_experiments`, and `ab_experiment_landing_pages`.
- Landing/campaign experiments own campaign variants.
- `conversion_goals` and `conversion_events` own business-level conversion
  tracking for RSVP, lead, contact, booking, and checkout flows.

### Explicitly Not In Scope

Marketplace billing and ads are not part of the current architecture. Do not
create ad, subscription, premium listing, provider billing, marketplace billing,
or sponsored listing tables until an approved product workflow defines ownership.

## Product Completion Gaps

These are product gaps, not unused database tables:

- Expose customer booking creation through a polished UI flow.
- Add admin/provider screens for booking status and booking payment management.
- Expand provider pricing/region/review management beyond service-level helpers.
- Add organization management UI if multi-user provider teams become active.
- Design Provider Deliverables for photography, videography, planning, and
  other service bookings that need post-event handoff links, customer notes,
  delivery deadlines, revision requests, and received/accepted states.
- Add admin surface for field-level audit log inspection when needed.

## Operating Rules

- Keep PinkLove as a modular monolith until a concrete scale bottleneck exists.
- Do not introduce microservices, Kafka, RabbitMQ, broad CQRS, or a distributed
  event bus without a measured need.
- Template discovery belongs to offerings, landing pages, template attributes,
  analytics, and search documents.
- Catalog, builder, and marketing changes must extend the approved domain
  tables instead of creating parallel roots.
- When schema changes, update `web/src/lib/database.ts`, `docs/schema.md`, and
  `web/scripts/audit-schema.mjs` together.
- When a feature workflow changes, update the matching area doc in the same
  change.
