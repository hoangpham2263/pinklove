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
- Public page templates live in `web/src/features/pages/registry.ts`
- System-page config and auth system-page views live in `web/src/features/system-pages/`
- Wedding product catalog and wedding-site flow live in:
  - `web/src/lib/products.ts`
  - `web/src/lib/wedding-sites.ts`
  - `web/src/features/products/`
  - `web/src/features/wedding-sites/`
- Account roles are currently only `admin` and `user`; the first registered account becomes `admin`
- Affiliate foundation is implemented: users can apply, admins can approve, referral links are generated, and click/ref-cookie tracking is in place
- Wedding invitation product foundation is implemented:
  - `Thiếp mẫu sẵn` for coded templates
  - `Tự tạo thiệp` for builder starters
  - per-user `wedding_sites` drafts/published sites
- Wedding invitation templates now follow the same registry/schema-driven pattern used by CMS page templates.
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
2. Run `./setup up` to build and start the development stack.
3. Open the app in your browser using the `WEB_PORT` value from `.env`.
   Default in `.env.example`: `http://localhost:3000`

If `.env` does not exist, `./setup` creates it from `.env.example`.

Development note:

- `docker-compose.yml` bind-mounts `./web` into the container and does not keep a separate `.next` volume, which reduces stale Next.js dev cache issues.

## Main Commands

- `./setup up`: build and start containers in detached mode
- `./setup rebuild`: stop then rebuild and start
- `./setup down`: stop containers
- `./setup logs`: stream web logs
- `./setup`: open the interactive menu

## Repo Layout

- `web/`: Next.js application
- `docs/`: project documentation
- `docker-compose.yml`: development stack
- `docker-compose.prod.yml`: production-style stack
- `setup`: helper script for common Docker workflows

## Documentation

- [Conventions](./docs/CONVENTIONS.md)
- [Project Structure & Features](./docs/PROJECT_STRUCTURE_AND_FEATURES.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [Agent Notes](./docs/AGENTS.md)
