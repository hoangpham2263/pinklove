# Docs Index

Use this file as the entrypoint for project documentation.

## Project snapshot

- App: monolithic Next.js App Router project in `web/`
- Core stack: Next.js, React, PostgreSQL, local auth, optional Google OAuth
- Notification standard: `sonner` is the project-wide toast system
- Main product areas: public guest site, customer dashboard, admin management, affiliate flows, commerce flows, invitation templates, and published invitations
- Current admin navigation covers: dashboard, media, pages, menus, blog posts, blog categories, product list, product categories, users, affiliates, vendors, commerce operations, SEO pages/schema/rules, and system settings including commerce configuration.

## Read order

1. [conventions](./conventions.md)
2. [structure](./structure.md)
3. [schema](./schema.md)
4. Read the area docs that match the task:
   - [guest](./guest.md)
   - [customer](./customer.md)
   - [admin](./admin.md)

## Update rules

- Update [conventions](./conventions.md) for repo-wide workflow, routing, naming, or shared implementation rules.
- Update [structure](./structure.md) for route, folder, or architecture changes.
- Update [schema](./schema.md) for database, storage, or migration changes.
- Update [guest](./guest.md) for public site behavior or UI conventions.
- Update [customer](./customer.md) for customer dashboard, auth, profile, affiliate, or site-management changes.
- Update [admin](./admin.md) for admin-only flows and controls.
- Keep all files in `docs/` lowercase.

## Shared UI Rules

- Use `sonner` for all toast notifications across the project.
- Ring standard:
  prefer `ring-1` across the project for selected, focused, highlighted, or active visual states unless a screen has a very specific reason to use another ring width.
- Mutation standard:
  for save, delete, bulk apply, publish, or similar in-page mutations, do not rely on native form redirects.
- Preferred mutation flow:
  client components submit with `fetch` using `Accept: application/json`, show `sonner`, then call `router.refresh()` for same-page updates or `router.push/replace()` only when the UX truly needs navigation.
- Shared helpers:
  use `web/src/lib/client-mutation.ts` on the client and `web/src/lib/action-response.ts` in route handlers so routes can support both JSON responses and legacy redirect fallbacks.
- Managed page permalink standard:
  managed pages use `web/src/lib/page-paths.ts` as the single source of truth for public paths. Do not rebuild page URLs manually from `slug` in menus, sitemap, previews, or breadcrumb code.
- Managed page SEO standard:
  breadcrumb schema, canonical URL, preview URL, and `sitemap.xml` for managed pages should all resolve from the stored permalink, with `slug` kept as the stable internal identifier.
- Public permalink standard:
  blog posts, blog categories, products, builder starters, and invitation sites must resolve through `web/src/lib/public-paths.ts`. Do not hardcode those public URLs directly in sitemap, preview buttons, canonical metadata, or cards.
- Public permalink policy:
  support only a small whitelist of safe blog-post patterns and explicit base fields per content type. Do not implement an unrestricted WordPress-style token engine for every object type.
- Legacy URL policy:
  when a public permalink setting changes, old static routes must either redirect to the canonical path or return `404`. They must not continue rendering duplicate public content under both old and new URLs.
- Robots and sitemap standard:
  prefer explicit route handlers for `robots.txt` and `sitemap*.xml` when the project needs WordPress-like plain-text/XML output, sitemap index files, or multiple child sitemaps.
  Public static pages and managed pages should be grouped together in `sitemap-pages.xml`, not split into a separate `sitemap-routes.xml`.
  SEO automation policy:
  `sitemap.xml` should be automatic by default and must update from registry/data changes without manual URL edits.
  `robots.txt` should ship with a safe automatic baseline, but must allow careful manual override/extension for crawl-control rules such as admin, account, search, cart, checkout, and other non-SEO paths.
  `robots.txt` should always reference the live-domain sitemap URL.
- Redirects are still acceptable for auth/session transitions:
  login, logout, register, OAuth callback, and other flows whose primary purpose is navigation may keep redirect behavior.
- If a route still needs to convert query params into a toast after redirect, prefer the existing `PageToast` helper as a thin bridge to `sonner` rather than introducing another toast system.
- Admin default layout:
  pages should use the standard protected admin shell, page title at the top, and primary actions aligned in the same header row when possible.
- Admin default content style:
  prefer summary cards first, then filters/actions, then the main management surface such as datatables or forms.
- Admin default data-management pattern:
  use shadcn-style datatables for list screens, keep filters/search above the table, and use English for database-facing select/status values even when visible labels are Vietnamese.
- Current reference screens for this pattern:
  `Admin > Products`, `Admin > Pages`, `Admin > Users`, and `Admin > Affiliate`.
- Current content management scope:
  `Admin > Pages` manages registered managed pages.
  `Admin > Blog Posts` and `Admin > Blog Categories` now have dynamic CRUD flows backed by `blog_posts` and `blog_categories`.
  `Admin > Product Categories` now has dynamic CRUD backed by `product_categories`, and products can be assigned to a category in product create/edit flows.
- For admin CRUD areas, prefer:
  list page with top-right create button, dedicated create page, dedicated edit page, row actions, and bulk actions in the same toolbar row as filters when the domain supports it.
- Exception:
  `Admin > Pages` follows the same list/edit/bulk layout pattern, but does not expose create/delete because pages are managed from the code registry.

## Current review notes

- Documentation and route names now use `guest` and `customer` as the primary actor terms in paths and area descriptions.
- Database bootstrapping lives in `web/src/lib/database.ts`.
- Auth page loading lives in `web/src/features/auth/auth-page-loader.ts`.
