# Docs Index

Use this file as the entrypoint for project documentation.

## Project snapshot

- App: monolithic Next.js App Router project in `web/`
- Core stack: Next.js, React, PostgreSQL, local auth, optional Google OAuth
- Main product areas: public marketing site, user dashboard, admin CMS, affiliate flows, wedding templates, builder-based wedding sites

## Read order

1. [conventions](./conventions.md)
2. [structure](./structure.md)
3. [schema](./schema.md)
4. Read the area docs that match the task:
   - [client](./client.md)
   - [user](./user.md)
   - [admin](./admin.md)

## Update rules

- Update [conventions](./conventions.md) for repo-wide workflow, routing, naming, or shared implementation rules.
- Update [structure](./structure.md) for route, folder, or architecture changes.
- Update [schema](./schema.md) for database, storage, or migration changes.
- Update [client](./client.md) for public site behavior or UI conventions.
- Update [user](./user.md) for user dashboard, auth, profile, affiliate, or site-management changes.
- Update [admin](./admin.md) for admin-only flows and controls.
- Keep all files in `docs/` lowercase.

## Current review notes

- `docs/index.md` now uses portable relative links instead of an old machine-specific absolute path.
- Several docs still reference older file names such as `src/lib/db.ts`, `page-loader.ts`, or `media.ts`, while the current code uses `src/lib/database.ts`, `auth-page-loader.ts`, and `media-resolver.ts`.
- `docs/structure.md` does not yet fully reflect newer public routes such as `services`, `tools`, and `blog`.
- `README.md` also still references `web/src/features/auth/page-loader.ts` and should be aligned in a follow-up update.
