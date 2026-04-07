# AI Agent Instructions

This file summarizes repo-specific facts for coding agents.

## Core mandates

1. The web app lives in `web/`.
2. The project currently uses Next.js `16.2.2` and React `19.2.4`.
3. Check `web/src/lib/db.ts` before introducing new database tables or migrations.
4. Use `NativeForm` for POST forms that should follow browser redirects normally.
5. Treat the current docs as describing the repository as-is, including incomplete features.

## Important repo facts

- Database access is raw SQL through `web/src/lib/db.ts`.
- Auto-created tables currently cover users, sessions, profiles, settings, OAuth accounts, CMS pages, menus, affiliate tables, products, and wedding sites.
- Menu tables are also auto-created by `db.ts`.
- Media metadata is stored in `web/storage/media.json`.
- Uploaded files are stored in `web/public/uploads/...`.
- Public content-page config lives in `web/src/features/pages/registry.ts`.
- Auth-page config and shared loading logic live in:
  - `web/src/features/auth/page-registry.ts`
  - `web/src/features/auth/page-loader.ts`
- Affiliate foundation lives in `web/src/features/affiliate/`, with server logic in `web/src/features/affiliate/server/service.ts`.
- Wedding product foundation lives in:
  - `web/src/features/products/`
  - `web/src/features/sites/`
  - `web/src/features/products/server/service.ts`
  - `web/src/features/sites/server/service.ts`
- Public content pages render from route-local UI under `web/src/app/(client)`, with slug-based field config in `web/src/features/pages/registry.ts`.
- Builder uses `konva` + `react-konva`.

## Current product behavior to remember

- Public content pages are code-managed route files under `web/src/app/(client)/`.
- Admin `Pages` edits managed content/system pages that already exist in code, rather than creating arbitrary new routes.
- `home`, `login`, and `register` are CMS-backed system pages and are auto-created if missing.
- `home`, `login`, and `register` are seeded from `web/src/lib/db.ts`, not lazily created during read operations.
- `login` and `register` use dedicated page components, but their editable content still comes from CMS custom fields.
- `login` and `register` only keep the auth fields currently used by the UI: heading, subheading, and side image.
- Use `web/src/lib/cms-fields.ts` for `getFields(page)` and `web/src/lib/media.ts` for resolving media field values.
- Public header links are currently hardcoded in `web/src/app/(client)/layout.tsx`.
- Current roles are only `admin` and `user`; the first registered account becomes `admin`.
- Admins are allowed to access public pages and user pages.
- Affiliate account application, admin approval, referral-link generation, click logging, and referral cookies are implemented.
- Wedding product catalog, user site creation, draft/published invitation rendering, and builder-template editing are implemented.
- Builder-template editing now happens in the dedicated design route `web/src/app/(designer)/user/design/[id]/page.tsx`.
- The current builder editor uses a top property/action card, a left asset library, a center live editor, and a right publish/settings sidebar.
- Admin product create/edit/delete flow is implemented at the catalog level.
- Checkout/payment, real orders, affiliate conversion attribution, and payout settlement are not implemented yet.
- The media API currently returns the full list of media items; UI pagination is only partial.

## Development workflow

- Start dev stack: `./docker/setup up`
- Rebuild: `./docker/setup rebuild`
- View logs: `./docker/setup logs`
- Stop stack: `./docker/setup down`

Default values from `.env.example`:

- web port: `3000`
- postgres port: `5433`

Docker note:

- The dev stack bind-mounts `web/` and does not keep a dedicated `.next` volume.
