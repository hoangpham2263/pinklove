# Docs Index

Use this file as the entrypoint for project documentation.

## Purpose

- `docs/index.md` is the navigation map and ownership map for project documentation.
- Put project-wide high-level rules here only.
- Put feature-specific or system-specific rules in dedicated docs such as `fields.md`, `schema.md`, `realtime.md`, `admin.md`, `ecommerce.md`, `guest.md`, `customer.md`, and `provider.md`.

## Project Snapshot

- App: monolithic Next.js App Router project in `web/`
- Core stack: Next.js, React, PostgreSQL, local auth, optional Google OAuth
- Shared toast system: `sonner`
- Main areas: guest site, customer workspace, admin management, ecommerce flows, invitation flows, shared SEO/config systems

## Read Order

1. [conventions](./conventions.md)
2. [structure](./structure.md)
3. [architecture](./architecture.md)
4. [schema](./schema.md)
5. [fields](./fields.md)
6. [realtime](./realtime.md)
7. Area docs as needed:
   - [guest](./guest.md)
   - [customer](./customer.md)
   - [admin](./admin.md)
   - [ecommerce](./ecommerce.md)
   - [provider](./provider.md)

## Doc Ownership

- `docs/index.md`
  Project-level navigation, doc ownership, and high-level shared standards only.
- `docs/conventions.md`
  Repo workflow, naming, routing, import/export, runtime, and cross-cutting engineering rules.
- `docs/structure.md`
  Folder structure, route groups, architecture layout, and implemented feature map.
- `docs/architecture.md`
  Current architecture, domain boundaries, and remaining product gaps.
- `docs/schema.md`
  Database tables, storage shape, and persistence compatibility notes.
- `docs/fields.md`
  Field schema contract, shared field editor rules, `wysiwyg` rules, repeater/section rules, and rich-text field standards.
- `docs/realtime.md`
  Shared realtime architecture, SSE/event contracts, client/server core rules, and scale path for transport upgrades.
- `docs/guest.md`
  Public site conventions, guest typography/layout rules, and guest route expectations.
- `docs/customer.md`
  Customer workspace, account area, and customer-owned invitation flow rules.
- `docs/admin.md`
  Admin-only workflows, admin screen ownership, and admin config/control conventions.
- `docs/ecommerce.md`
  Checkout, payment method settings, gateway integration workflow, and order/payment state rules.
- `docs/provider.md`
  Provider portal ownership, assignment flow, provider order collaboration, and dedicated provider route rules.

## Shared Standards

- Use `sonner` for toast notifications across the project.
- Use the shared mutation flow built around `web/src/lib/client-mutation.ts` and `web/src/lib/action-response.ts`.
- Use the shared realtime core in `web/src/features/realtime/*` for SSE client/server behavior instead of feature-level copy-paste loops.
- Use shared `FieldsEditor` media fields for image selection; when a field stores a media gallery, model it as `type: "media"` with `multiple: true` instead of raw textarea URL input.
- Media Library upload surfaces should allow batch uploads into the shared library even when the consuming field stores only one selected asset.
- Product/media search-select surfaces should use the shared fixed-size dialog picker pattern so selected items stay visible in the form and long option lists scroll inside the popup.
- For admin/provider operational screens, prefer `toast + partial JSON refresh` over redirect-driven saves or full-route reloads.
- Use `web/src/lib/page-paths.ts` as the source of truth for managed-page public paths.
- Use `web/src/lib/public-paths.ts` as the source of truth for blog, offering, builder, and invitation public paths.
- Use explicit route handlers for `robots.txt` and `sitemap*.xml` when SEO output needs plain-text or XML control.
- Keep PinkLove as a modular monolith. Do not introduce microservices, Kafka,
  RabbitMQ, broad CQRS, or distributed event buses without a concrete bottleneck.
- Respect module ownership from `docs/architecture.md`; cross-module mutations go
  through owning services, public APIs, or domain events.
- Use the standard admin/customer/editor 12-column layout language for protected screens.
- Show human-facing status labels in English consistently across the project.

## Update Rules

- When a rule is project-wide, update `docs/index.md` first, then update the owned doc if the rule needs implementation detail.
- When a rule belongs to a specific concern, update the owned doc directly:
  - workflow/routing/imports/runtime: `conventions.md`
  - folders/routes/feature map: `structure.md`
  - architecture and domain boundaries: `architecture.md`
  - database/storage: `schema.md`
  - fields/rich text/editor contract: `fields.md`
  - shared realtime/event transport: `realtime.md`
  - public site: `guest.md`
  - customer area: `customer.md`
  - admin area: `admin.md`
  - checkout/payment/order workflow: `ecommerce.md`
  - provider area: `provider.md`
- If code and docs conflict, update docs in the same task.
- Keep new files in `docs/` lowercase.

## Verification Baseline

- Minimum project verification for structural or shared-component changes:
  - `npm run build` in `web/`
  - `npm run lint -- .` in `web/`
- If a task changes behavior in auth, admin, customer, media, SEO, or editor flows, also verify the affected route or screen directly when runtime config is available.
