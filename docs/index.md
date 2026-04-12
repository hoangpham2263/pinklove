# Docs Index

Use this file as the entrypoint for project documentation.

## Purpose

- `docs/index.md` is the navigation map and ownership map for project documentation.
- Put project-wide high-level rules here only.
- Put feature-specific or system-specific rules in dedicated docs such as `fields.md`, `schema.md`, `realtime.md`, `admin.md`, `guest.md`, `customer.md`, and `partner.md`.

## Project Snapshot

- App: monolithic Next.js App Router project in `web/`
- Core stack: Next.js, React, PostgreSQL, local auth, optional Google OAuth
- Shared toast system: `sonner`
- Main areas: guest site, customer workspace, admin management, ecommerce flows, invitation flows, shared SEO/config systems

## Read Order

1. [conventions](./conventions.md)
2. [structure](./structure.md)
3. [schema](./schema.md)
4. [fields](./fields.md)
5. [realtime](./realtime.md)
6. Area docs as needed:
   - [guest](./guest.md)
   - [customer](./customer.md)
   - [admin](./admin.md)
   - [partner](./partner.md)

## Doc Ownership

- `docs/index.md`
  Project-level navigation, doc ownership, and high-level shared standards only.
- `docs/conventions.md`
  Repo workflow, naming, routing, import/export, runtime, and cross-cutting engineering rules.
- `docs/structure.md`
  Folder structure, route groups, architecture layout, and implemented feature map.
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
- `docs/partner.md`
  Partner/vendor portal ownership, assignment flow, vendor order collaboration, and dedicated partner route rules.

## Shared Standards

- Use `sonner` for toast notifications across the project.
- Use the shared mutation flow built around `web/src/lib/client-mutation.ts` and `web/src/lib/action-response.ts`.
- Use the shared realtime core in `web/src/features/realtime/*` for SSE client/server behavior instead of feature-level copy-paste loops.
- For admin/vendor operational screens, prefer `toast + partial JSON refresh` over redirect-driven saves or full-route reloads.
- Use `web/src/lib/page-paths.ts` as the source of truth for managed-page public paths.
- Use `web/src/lib/public-paths.ts` as the source of truth for blog, product, builder, and invitation public paths.
- Use explicit route handlers for `robots.txt` and `sitemap*.xml` when SEO output needs plain-text or XML control.
- Use the standard admin/customer/editor 12-column layout language for protected screens.
- Show human-facing order and vendor status labels in Vietnamese on management screens when that improves operational clarity.

## Update Rules

- When a rule is project-wide, update `docs/index.md` first, then update the owned doc if the rule needs implementation detail.
- When a rule belongs to a specific concern, update the owned doc directly:
  - workflow/routing/imports/runtime: `conventions.md`
  - folders/routes/feature map: `structure.md`
  - database/storage: `schema.md`
  - fields/rich text/editor contract: `fields.md`
  - shared realtime/event transport: `realtime.md`
  - public site: `guest.md`
  - customer area: `customer.md`
  - admin area: `admin.md`
  - partner area: `partner.md`
- If code and docs conflict, update docs in the same task.
- Keep all files in `docs/` lowercase.

## Verification Baseline

- Minimum project verification for structural or shared-component changes:
  - `npm run build` in `web/`
  - `npm run lint -- .` in `web/`
- If a task changes behavior in auth, admin, customer, media, SEO, or editor flows, also verify the affected route or screen directly when runtime config is available.
