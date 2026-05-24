# Platform Architecture

PinkLove is a headless modular wedding commerce platform implemented as a
modular monolith on Next.js, PostgreSQL, database-backed realtime, and durable
domain events.

Do not split this project into microservices, Kafka, RabbitMQ, CQRS everywhere,
or distributed event buses until a concrete operational bottleneck requires it.
The current moat is product quality: SEO, template quality, landing pages,
builder UX, provider onboarding, conversion optimization, analytics, and the
content ecosystem.

## Module Ownership

| Module | Owns |
| --- | --- |
| Offerings | `offerings`, offering type tables, subtype tables, bundles, search documents |
| Providers | `providers`, provider profiles, services, regions, reviews, pricing, availability |
| Commerce | orders, order items, payments, payment logs, shipments, entitlements |
| Wedding | `wedding_sites`, pages, sections, guests, RSVPs, events, galleries |
| Identity | users, sessions, profiles, addresses, OAuth accounts, user settings |
| Notifications | notifications, target roles/users, user notification states |
| Analytics | analytics sessions, page views, events, template views/shares/conversions |
| SEO | redirects, metadata, indexing rules, sitemap/robots output |

No module directly mutates another module's tables. Cross-module work goes
through owning services, public APIs, or domain events. Shared read models are
allowed when they are intentionally query-only.

## Provider Strategy

Use `providers.id` for marketplace identity, provider discovery, services,
profiles, booking, pricing, reviews, and public provider ecosystem data.

Use `users.id` only for authentication, admin moderation, supplier account
workflow, and operational fulfillment screens where the actor is a provider user
account. Account-bound workflow columns must be named `provider_user_id`.
`provider_id` is reserved for columns that reference `providers.id`.
`providers.owner_user_id` is the auth owner of a provider ecosystem entity. In
this architecture, provider account does not equal provider ecosystem entity.

## Template Contract

`offering_types.template_key` is only the system preset key for a type.
`offerings.template_key` is the actual runtime selected template for a sellable
offering. Subtype `template_key` columns are allowed only when rendering or
runtime execution needs a subtype-local template identity.

`template_engine` controls rendering, runtime, and editor behavior. It never
controls business logic, commerce behavior, pricing, permissions, inventory, or
fulfillment.

## Dynamic Fields

Dynamic fields are for UI metadata, presentation, discovery, and optional
structured fields. They must not hold payments, permissions, inventory, critical
business workflows, analytics, or booking core logic.

Freeze these domains as relational-first transactional domains:

- commerce
- payments
- bookings
- inventory
- notifications
- analytics
- permissions
- identity

Content domains stay hybrid. `wedding_site_sections.content`, builder blocks,
and template runtime content can use JSONB because content rendering benefits
from flexibility and schema evolution.

## Domain Events

Business mutations emit durable rows in `domain_events`. Event names are
registered in `domain_event_types`.

Emitters are the owning domain service that performs the state transition.
Consumers include notifications, analytics, search indexing, cache invalidation,
AI processing, and realtime adapters. Consumers must be idempotent by event id
and aggregate version or by a stable idempotency key in the payload.

Retry policy:

- transient failures can retry with exponential backoff
- permanent validation failures must be recorded and skipped
- consumers must tolerate duplicate delivery
- event payloads should be narrow and include IDs, not large denormalized blobs

## Cache Tags

Use stable cache tags for selective invalidation:

- `offering:{id}`
- `provider:{id}`
- `template:{id}`
- `wedding_site:{id}`

Cache invalidation events such as `offering.updated`, `template.updated`,
`provider.updated`, and `site.published` should map to these tags. Use broad
route refresh only when no stable resource tag exists.

## Search Pipeline

`offering_search_documents` is the canonical offering search read model.
Search sync happens after offering create/update/delete, category changes,
template metadata changes, and provider-facing supply changes that alter public
catalog discovery.

Indexed fields include offering name, slug, excerpt, description, category,
offering type, template key, template engine, and safe public custom fields from
`offerings.config.customFields`. Business-only fields, payment state,
permissions, inventory internals, and analytics payloads are not indexed.

Weighting should prioritize title/name, category, public tags/attributes,
template style metadata, and conversion-quality ranking fields over raw JSON
text. Search document updates must be idempotent by `offering_id`.
