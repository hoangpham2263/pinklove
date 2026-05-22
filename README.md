# PinkLove Next.js Project

PinkLove is a Next.js application with Docker-managed local services:

- Next.js `16.2.2` using the App Router
- React `19.2.4`
- PostgreSQL
- Cookie-based local auth plus optional Google OAuth
- A small CMS for public pages, menus, and media

Current notable behavior:

- `home`, `login`, and `register` are system CMS pages and are seeded by `database.ts` if missing
- `login` and `register` use dedicated auth page components, but their editable content still comes from CMS custom fields
- Admin users can access public pages and customer pages for management and preview flows
- ACF/custom fields are read through shared CMS helpers and media fields are resolved through a shared media URL helper
- Managed content-page config lives in `web/src/features/pages/registry.ts`
- Auth-page config and shared loading logic live in:
  - `web/src/features/auth/page-registry.ts`
  - `web/src/features/auth/auth-page-loader.ts`
- Wedding offering catalog and wedding-site flow live in:
  - `web/src/features/offerings/`
  - `web/src/features/sites/`
- Domain server services now live with their features:
  - `web/src/features/offerings/server/service.ts`
  - `web/src/features/sites/server/service.ts`
  - `web/src/features/affiliate/server/service.ts`
- Public content pages are code-managed routes, not admin-created CMS routes:
  - `web/src/app/(guest)/page.tsx`
  - `web/src/app/(guest)/about-us/page.tsx`
  - `web/src/app/(guest)/contact/page.tsx`
- Public page UI now lives directly alongside those routes inside `web/src/app/(guest)`.
- Admin `Pages` edits only managed content/system pages already registered in code.
- Account roles are `ADMIN`, `CUSTOMER`, `AFFILIATE`, and `VENDOR`; the first registered account becomes `ADMIN`
- Affiliate foundation is implemented: customers can apply, admins can approve, referral links are generated, and click/ref-cookie tracking is in place
- Wedding invitation offering foundation is implemented:
  - `Thiếp mẫu sẵn` for coded templates
  - `Tự tạo thiệp` for builder starters
  - per-customer `wedding_sites` drafts/published sites
- Managed content pages now use page-specific route-local UI plus slug-based field config.
- Admin offering management now includes basic create/edit/delete flow.
- Builder now uses `konva` + `react-konva` for direct visual editing of `builder_template` sites.
- Builder-template sites are edited in a dedicated design route at `/customer/design/[id]` with:
  - top builder property controls
  - left asset library
  - center live editor
  - right publish/settings sidebar
- Checkout, real orders, conversion attribution, and payout settlement are intentionally not implemented yet

## Getting Started

1. Ensure Docker Desktop is running.
2. Run `./web/setup up` to start PostgreSQL.
3. Run `cd web && npm run dev` to start Next.js locally.
4. Open the app in your browser at `http://localhost:3000`.

If `.env` does not exist, `./web/setup` creates it from `.env.example`.

Development note:

- `docker/compose.yml` is for local PostgreSQL only.
- Next.js runs on the host through the default `npm run dev` in `web/`.
- `web/.env.local` points `DATABASE_URL` at the Docker database on `localhost:5433`.
- `./web/setup up` stops the production compose stack first if it is running, then starts the dev database services.

## Main Commands

- `./web/setup up`: start database containers in detached mode
- `cd web && npm run dev`: start the local Next.js dev server
- `./web/setup down`: stop containers
- `./web/setup logs`: stream database logs
- `./web/setup help`: show all supported commands

## Repo Layout

- `web/`: Next.js application
- `docker/`: Docker compose files and helper script
- `docs/`: project documentation

## Documentation

- [index](./docs/index.md)
- [conventions](./docs/conventions.md)
- [guest](./docs/guest.md)
- [customer](./docs/customer.md)
- [admin](./docs/admin.md)
- [structure](./docs/structure.md)
- [database schema / ER diagram](./docs/schema.md)
