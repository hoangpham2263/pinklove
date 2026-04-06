# Project File Convention (Next.js App Router)

## 0) Convention source of truth

- `docs/CONVENTIONS.md` is the source of truth for project conventions.
- The Next.js app lives in `web/`. Paths in this document are relative to `web/` unless stated otherwise.
- If code and docs conflict, update the docs in the same change that updates the code.

## 1) Folder structure

- Keep routing concerns in `src/app` only.
- Use route groups for concern separation:
  - `src/app/(client)`
  - `src/app/(admin)`
  - `src/app/(user)`
- Keep domain logic in `src/features/<feature>`.
- Keep shared UI in `src/components/ui`.
- Keep shared app-level components in `src/components/common`.
- Keep shared server/helpers in `src/lib`.

## 2) Routing

- The central route registry is `src/lib/routes.ts`.
- Prefer `ROUTES.*` for internal navigation and redirects.
- Existing code still contains some hardcoded paths. New code should prefer `ROUTES`.

## 3) Naming

- Use `kebab-case` for folders and non-component files.
- Use `PascalCase` for component filenames.
- Use `camelCase` for variables and functions.
- Use `UPPER_SNAKE_CASE` for constants.

## 4) Server and client boundaries

- Default to Server Components.
- Add `"use client"` only when required.
- Do not import server-only modules into client files.
- Keep route handlers under `src/app/api/**/route.ts`.

## 5) Imports and exports

- Use the `@/*` alias from `tsconfig.json`.
- Route entry files should default export the route component.
- Prefer named exports elsewhere.
- Avoid deep relative imports when `@/` works.

## 6) Forms

- Use `NativeForm` from `src/components/common/native-form.tsx` for POST forms that rely on redirect responses.
- `NativeForm` forces native browser submission instead of React/Next interception.

## 7) Auth conventions

- User login page: `src/app/(user)/user/(auth)/login/page.tsx`
- User register page: `src/app/(user)/user/(auth)/register/page.tsx`
- Admin login page: `src/app/(admin)/admin/(auth)/login/page.tsx`
- Auth APIs live under:
  - `src/app/api/auth/*`
  - `src/app/api/admin/auth/*`
- Session cookie name: `pinklove_session`
- Roles: `admin` and `user`
- Admins are allowed to access public pages and user pages.
- Logged-in non-admin users should be redirected away from `user` auth pages back to the user dashboard.
- Logged-in admins should only be redirected away from the admin login page, not from normal public/user pages.

## 8) CMS conventions

- CMS pages are stored in `cms_pages`.
- Public rendering is CMS-driven through `src/app/(client)/[[...slug]]/page.tsx`.
- Page template registry lives in `src/features/client/templates/index.ts`.
- System page registry lives in `src/lib/system-pages.ts`.
- Template-specific fields are stored in `cms_pages.custom_fields`.
- Protected/system slugs currently include:
  - `home`
  - `login`
  - `register`
- These system pages are auto-created by the CMS layer if missing.

## 9) Menu conventions

- Menu admin pages live under:
  - `src/app/(admin)/admin/(protected)/menus/page.tsx`
  - `src/app/(admin)/admin/(protected)/menus/[id]/page.tsx`
- Menu code expects `cms_menus` and `cms_menu_items`.
- Current public client layout is still hardcoded and does not yet render DB menus.

## 10) Media conventions

- Media API: `src/app/api/media/route.ts`
- Media admin page: `src/app/(admin)/admin/(protected)/media/page.tsx`
- Reusable picker: `src/features/media/components/media-selector.tsx`
- Files are stored under `public/uploads/YYYY/MM`.
- Metadata is stored in `storage/media.json`.
- Allowed types:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/gif`
- Maximum upload size: `5MB`

## 11) Styling conventions

- Global styles live in `src/app/globals.css`.
- The project uses a px-first scale. Prefer px-backed Tailwind tokens and px arbitrary values over rem-based arbitrary values.
- Global spacing, text sizes, container widths, and breakpoints are defined from px tokens in `src/app/globals.css`.
- The app uses the root design tokens defined in `src/app/globals.css`.
- Current defaults follow the repo's shadcn-style `rose` token palette rather than per-layout runtime theme switching.
- Global select styling and UI-density utility rules are defined in `globals.css`.

## 12) Runtime and startup

- Use `./setup` at repo root for common Docker workflows.
- `./setup` supports `up`, `rebuild`, `down`, and `logs`.
- Development stack configuration lives in `docker-compose.yml`.
- Production-style stack lives in `docker-compose.prod.yml`.
- The dev web service bind-mounts `./web` into the container.
- The dev stack does not keep a dedicated `.next` volume.
- Default values in `.env.example` are currently:
  - `WEB_PORT=3000`
  - `POSTGRES_PORT=5433`

## 13) Database conventions

- Check `src/lib/db.ts` before adding schema changes.
- Follow the existing sequential migration/helper pattern if extending the bootstrap logic.
- Note that menu tables are not currently created by the bootstrap code.
