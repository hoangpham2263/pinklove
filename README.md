# PinkLove Next.js Project

PinkLove is a Docker-first Next.js application with:

- Next.js `16.2.2` using the App Router
- React `19.2.4`
- PostgreSQL
- Cookie-based local auth plus optional Google OAuth
- A small CMS for public pages, menus, and media

Current notable behavior:

- `home`, `login`, and `register` are system CMS pages and are seeded by `db.ts` if missing
- `login` and `register` use dedicated auth page components, but their editable content still comes from CMS custom fields
- Admin users can access public pages and user pages for management and preview flows
- ACF/custom fields are read through shared CMS helpers and media fields are resolved through a shared media URL helper
- Managed content-page config lives in `web/src/features/pages/registry.ts`
- Auth-page config and shared loading logic live in:
  - `web/src/features/auth/page-registry.ts`
  - `web/src/features/auth/page-loader.ts`
- Wedding product catalog and wedding-site flow live in:
  - `web/src/features/products/`
  - `web/src/features/sites/`
- Domain server services now live with their features:
  - `web/src/features/products/server/service.ts`
  - `web/src/features/sites/server/service.ts`
  - `web/src/features/affiliate/server/service.ts`
- Public content pages are code-managed routes, not admin-created CMS routes:
  - `web/src/app/(client)/page.tsx`
  - `web/src/app/(client)/about-us/page.tsx`
  - `web/src/app/(client)/contact/page.tsx`
- Public page UI now lives directly alongside those routes inside `web/src/app/(client)`.
- Admin `Pages` edits only managed content/system pages already registered in code.
- Account roles are currently only `admin` and `user`; the first registered account becomes `admin`
- Affiliate foundation is implemented: users can apply, admins can approve, referral links are generated, and click/ref-cookie tracking is in place
- Wedding invitation product foundation is implemented:
  - `Thiếp mẫu sẵn` for coded templates
  - `Tự tạo thiệp` for builder starters
  - per-user `wedding_sites` drafts/published sites
- Managed content pages now use page-specific route-local UI plus slug-based field config.
- Admin product management now includes basic create/edit/delete flow.
- Builder now uses `konva` + `react-konva` for direct visual editing of `builder_template` sites.
- Builder-template sites are edited in a dedicated design route at `/user/design/[id]` with:
  - top builder property controls
  - left asset library
  - center live editor
  - right publish/settings sidebar
- Checkout, real orders, conversion attribution, and payout settlement are intentionally not implemented yet

## Getting Started

1. Ensure Docker Desktop is running.
2. Run `./docker/setup up` to build and start the development stack.
3. Open the app in your browser using the `WEB_PORT` value from `.env`.
   Default in `.env.example`: `http://localhost:3000`

If `.env` does not exist, `./docker/setup` creates it from `.env.example`.

Development note:

- `docker/compose.yml` bind-mounts `./web` into the container and does not keep a separate `.next` volume, which reduces stale Next.js dev cache issues.

## Main Commands

- `./docker/setup up`: build and start containers in detached mode
- `./docker/setup rebuild`: stop then rebuild and start
- `./docker/setup down`: stop containers
- `./docker/setup logs`: stream web logs
- `./docker/setup`: open the interactive menu

## Repo Layout

- `web/`: Next.js application
- `docker/`: Docker compose files and helper script
- `docs/`: project documentation

## Documentation

- [Conventions](./docs/CONVENTIONS.md)
- [Project Structure & Features](./docs/PROJECT_STRUCTURE_AND_FEATURES.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [Agent Notes](./docs/AGENTS.md)
