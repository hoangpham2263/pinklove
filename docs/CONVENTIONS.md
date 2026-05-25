# Conventions

This file is the repo-wide source of truth.

## Documentation workflow

- `docs/index.md` is the docs entrypoint.
- `docs/CONVENTIONS.md` is the repo-wide rules file.
- Prefer lowercase filenames for new documentation files in `docs/`. The existing `CONVENTIONS.md` filename remains the workspace-compatible exception.
- If code changes affect structure, roles, routes, schema, or workflows, update the matching doc files in the same change.
- If a change affects more than one app area, update every affected convention file instead of leaving the rule only in one place.
- If code and docs conflict, update the docs in the same task so they stay aligned with the repository.

## Project scope

- The Next.js app lives in `web/`.
- Paths in documentation are relative to `web/` unless a path starts with `docs/`.
- The project is a monolithic Next.js App Router app with PostgreSQL, local auth, optional Google OAuth, managed pages, affiliate tracking, and invitation offering flows.

## Folder structure

- Keep routing concerns in `src/app` only.
- Use route groups for concern separation:
  - `src/app/(guest)`
  - `src/app/(seo)` for `robots.txt` and sitemap routes
  - direct URL segments like `src/app/admin` and `src/app/customer` when the folder name already matches the public path
- Prefer nested route groups inside each area when they clarify responsibility without changing URL paths.
  Public examples: `(marketing)`, `(catalog)`, `(content)`, `(tools)`.
  Admin examples: `(overview)`, `(content)`, `(catalog)`, `(accounts)`, `(system)`.
  Customer examples: `(workspace)`, `(account)`, `(growth)`.
- Keep domain logic in `src/features/<feature>`.
- Keep shared UI in `src/components/ui`.
- Keep shared app-level components in `src/components/common`.
- Keep shared infra and helpers in `src/lib`.
- Prefer feature-owned `server/*` modules for domain services.
- Keep shared admin shell, navigation, and platform-wide admin utilities in `src/features/admin`. Keep domain-owned admin forms/tables close to their domain feature under `src/features/<feature>/admin`.
- Use `src/features/website-hooks` for outbound website integration catalogs; reserve `hooks` for actual React-hook semantics.

## Routing

- The central route registry is `src/lib/routes.ts`.
- Prefer `ROUTES.*` for internal navigation and redirects.
- Keep route handlers under `src/app/api/**/route.ts`.
- Public URLs must use descriptive, self-explanatory path bases. Avoid opaque short aliases like `/w` for primary public content routes.
- When a public route base changes, keep the old route as a redirect-only legacy alias instead of serving two canonical public paths long-term.
- Managed-page public paths must resolve from `src/lib/page-paths.ts`.
- Blog, category, offering, builder, and invitation public paths must resolve from `src/lib/public-paths.ts`.
- Permalink settings should be per content type with a constrained whitelist of supported patterns, not a free-form global token engine.

## SEO routes

- Keep `robots.txt` and `sitemap*.xml` under `src/app/(seo)` so route-level SEO files stay grouped without changing their public URLs.
- `sitemap.xml` must be generated automatically from the project registry and publishable data sources. Do not maintain sitemap URLs as a manual hardcoded list.
- When a managed page, offering, blog post, category, or public site is added or published, the relevant sitemap output should update automatically.
- `robots.txt` may start from a safe automatic baseline, but it must support controlled manual rules for crawl budget and private paths.
- Typical `robots.txt` manual rules should cover admin, account, checkout, cart, internal search, and other non-indexable routes when those areas exist in the offering.
- Never hardcode the production domain inside sitemap or robots output. Always resolve the live domain from the current request context.

## Naming

- Use lowercase filenames in `docs/`.
- Use `kebab-case` for folders and app code filenames, including component files.
- Keep React component symbols in `PascalCase` even when the file name is `kebab-case`.
- Use `camelCase` for variables and functions.
- Use `UPPER_SNAKE_CASE` for constants.

## Server and client boundaries

- Default to Server Components.
- Add `"use client"` only when required.
- Do not import server-only modules into client files.

## Imports and exports

- Use the `@/*` alias from `tsconfig.json`.
- Route entry files should default export the route component.
- Prefer named exports elsewhere.
- Avoid deep relative imports when `@/` works.

## API client layering

- Keep `src/lib/api.ts` as the only shared low-level HTTP wrapper for UI calls.
- Use role-based client API modules for browser/UI code:
  - `src/lib/api-client.admin.ts`
  - `src/lib/api-client.customer.ts`
  - `src/lib/api-client.provider.ts`
  - `src/lib/api-client.public.ts`
- Client components should import API methods from the matching role file directly.
- Do not add new feature-local UI wrappers like `src/features/*/api/client.ts`.
- Do not call `fetch("/api/...")`, `apiFetch(...)`, `apiJson(...)`, or `postForm(...)` directly from feature UI components when the call belongs in a role API file.
- If a client component uses a JS submit handler and still needs a native `action=` fallback, prefer an exported `*ApiActions` constant from the same role API file instead of duplicating `ROUTES.API.*` in the component.
- Realtime stream URLs are the main exception: it is acceptable for UI components to consume `ROUTES.API.*` directly for SSE/realtime endpoints.

## Forms

- Use `NativeForm` from `src/components/common/native-form.tsx` for POST forms that rely on redirect responses.
- `NativeForm` should be preferred for browser-native submissions that need server redirects to behave predictably.
- For client-managed mutation forms, keep the submit logic and fallback action aligned through the same role API module whenever possible.

## Managed Pages and content

- Managed page content is stored in `managed_pages`.
- Public content routes are code-managed explicit files under `src/app/(guest)`.
- Managed content-page config lives in `src/features/pages/registry.ts`.
- Auth-page config lives in `src/features/auth/page-registry.ts`.
- Keep `src/app/(guest)/[...slug]/page.tsx` thin by delegating public content resolution to helpers under `src/features/pages/server/`.
- When a managed page is registered in the page registries, CMS seeding and sitemap inclusion must update automatically from that registry data rather than requiring a second hardcoded sitemap edit.
- Template-specific fields are stored in `managed_pages.custom_fields`.
- Use `getPageFields(page)` from `src/lib/page-fields.ts` when a page object is already loaded.
- Use `getPageFieldsBySlug(slug)` from `src/lib/managed-pages.ts` only in server routes or pages that need to load by slug.
- Public managed pages must load through `getAccessiblePageBySlug()` from `src/lib/managed-pages.ts`.
- Do not use `getPageBySlug()` directly in public route rendering for managed pages.
- `draft` managed pages must not render publicly.
- Unpublished managed pages are accessible only to logged-in admins.
- For public preview links, require `?preview=1` and an authenticated admin session.
- For auth system pages like `login` and `register`, draft access is allowed only for logged-in admins through the shared helper path.
- Protected system slugs currently include `home`, `login`, and `register`.
- System-page status must still be respected publicly. Draft pages are previewable only by admins.

## Invitation offering model

- Treat `offerings` as the sellable catalog layer shown to guests.
- Treat `wedding_sites` as customer-specific invitation instances cloned from a offering.
- Treat `offering_types` as the runtime registry for catalog types. New offering
  types should be created through data/admin configuration before adding code.
- Store custom type-specific fields in `offerings.config.customFields` according
  to relational `offering_type_fields` definitions.
- Keep `offerings.config` limited to UI configuration, lightweight metadata, and
  flexible display data. Move inventory, pricing rules, booking logic,
  permissions, analytics, and relationships into dedicated relational tables.
- The runtime strips and rejects business-domain keys in `offerings.config`,
  including `inventory`, `pricing_rules`, `permissions`, `analytics`,
  `booking_logic`, `relational_data`, `siteDefaults`, `generalOffering`, and
  legacy config supply key.
- `offerings.config` must stay small. Runtime enforces
  `pg_column_size(config) <= 32768`; move growing workflows into relational
  tables before they approach that limit.
- Marketplace ownership must use `providers.id`. Do not add new marketplace,
  discovery, booking, profile, pricing, or service ownership columns that point
  directly at `users`.
- Provider account workflow tables may point at `users.id` only when the actor
  is an authenticated provider account in an operational moderation or
  fulfillment flow. Those columns must be named `provider_user_id`; reserve
  `provider_id` for `providers.id`. Provider entities use `owner_user_id` for
  their auth/account owner.
- Run `npm run audit:schema` after DB architecture changes. The audit must pass
  before considering ID, offering config, search index, SEO table, or enum-like
  config cleanup complete.
- `digital_template` offerings represent online templates, motion/video templates,
  and builder starters.
- `physical_product` offerings represent regular shop/provider/API products such
  as paper invitations and add-ons.
- Coded/builder behavior belongs to `template_engine`, not `offering_type`.
- Guest catalog pages should use the configured offering type scope first, then category/price/sort filters.
- Each coded invitation `template_key` should belong to only one catalog offering. Do not create multiple offerings that reuse the same coded template identity.
- Add a dedicated subtype table only when the type needs relational querying or
  workflow-specific columns that do not fit the generic custom field model.

## Media

- Media API: `src/app/api/media/route.ts`
- Reusable picker: `src/features/media/components/media-selector.tsx`
- Media picker UI uses the shared fixed-size dialog picker pattern, not a route-local Sheet or custom inline search panel.
- Files are stored under `public/uploads/YYYY/MM`.
- Metadata is stored in PostgreSQL table `media_assets`; do not add file-backed JSON storage for media records.
- The upload API currently accepts any browser `File` up to `20MB`; add explicit server-side MIME validation in `src/features/media/server/media-store.ts` before documenting a restricted allowlist.
- Media listing uses paginated DB queries. Keep admin/library callers on `GET /api/media?page=...&limit=...` instead of loading every asset.

## Search Selects

- Reusable search-select UI should render selected values in the form and open a fixed-size dialog for search, scroll, and selection.
- Do not add new inline two-column search selectors or route-local Sheet selectors for product/media selection.
- Existing product search-select surfaces are `src/features/offerings/admin/offering-search-select.tsx` and `type: "offering-select"` inside `src/components/common/fields-editor.tsx`.

## Styling

- Global styles live in `src/app/globals.css`.
- Prefer the project token system already defined in `globals.css`.
- The project uses a px-first scale. Prefer px-backed Tailwind tokens and px arbitrary values over rem-based arbitrary values.
- Public guest typography and section layout rules are defined in `docs/guest.md` and should be reused consistently.
- Public guest border radius rule is `rounded-xl lg:rounded-2xl` unless a truly different shape is intentional.

## Runtime and startup

- Use `./web/setup` for common Docker workflows.
- `./web/setup` supports `up`, `down`, and `logs`.
- Development database configuration lives in `docker/compose.yml`.
- Production-style stack lives in `docker/compose.prod.yml`.
- Next.js development runs on the host through `npm run dev` in `web/`.

## Database change rule

- Check `src/lib/database.ts` before adding tables or migrations.
- Follow the existing bootstrap and migration helper pattern if extending schema initialization.

## Agent workflow

- When `docs/index.md` is referenced, read `docs/CONVENTIONS.md` first, then `docs/structure.md` and `docs/schema.md`, then the area docs affected by the task.
- Treat the docs as describing the repository as it exists now, including incomplete offering areas.
- If a code change affects documented behavior, update the docs in the same task.
- Database access is raw SQL through `web/src/lib/database.ts`.
- Media metadata is stored in PostgreSQL table `media_assets`.
- Uploaded files are stored in `web/public/uploads/YYYY/MM/...`.
- Public content-page config lives in `web/src/features/pages/registry.ts`.
- Auth-page config and shared loading logic live in:
  - `web/src/features/auth/page-registry.ts`
  - `web/src/features/auth/auth-page-loader.ts`
- Affiliate foundation lives in `web/src/features/affiliate/`.
- Website integration catalog lives in `web/src/features/website-hooks/`.
- Wedding offering foundation lives in:
  - `web/src/features/offerings/`
  - `web/src/features/invitations/`
- Builder editing lives in `web/src/app/customer/(protected)/(workspace)/design/[id]/page.tsx`.
