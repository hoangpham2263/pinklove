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
- Auto-created tables currently cover users, sessions, profiles, settings, OAuth accounts, and CMS pages.
- Menu tables are also auto-created by `db.ts`.
- Media metadata is stored in `web/storage/media.json`.
- Uploaded files are stored in `web/public/uploads/...`.
- Public page-template config lives in `web/src/features/pages/registry.ts`.
- System-page config and auth system-page loaders/views live in `web/src/features/system-pages/`.

## Current product behavior to remember

- Public page routing is CMS-driven through `web/src/app/(client)/[[...slug]]/page.tsx`.
- `home`, `login`, and `register` are CMS-backed system pages and are auto-created if missing.
- `home`, `login`, and `register` are seeded from `web/src/lib/db.ts`, not lazily created during read operations.
- `login` and `register` use dedicated page components, but their editable content still comes from CMS custom fields.
- `login` and `register` only keep the auth fields currently used by the UI: heading, subheading, and side image.
- Use `web/src/lib/cms-fields.ts` for `getFields(page)` and `web/src/lib/media.ts` for resolving media field values.
- Public header links are currently hardcoded in `web/src/app/(client)/layout.tsx`.
- Current roles are only `admin` and `user`; the first registered account becomes `admin`.
- Admins are allowed to access public pages and user pages.
- The media API currently returns the full list of media items; UI pagination is only partial.

## Development workflow

- Start dev stack: `./setup up`
- Rebuild: `./setup rebuild`
- View logs: `./setup logs`
- Stop stack: `./setup down`

Default values from `.env.example`:

- web port: `3000`
- postgres port: `5433`

Docker note:

- The dev stack bind-mounts `web/` and does not keep a dedicated `.next` volume.
