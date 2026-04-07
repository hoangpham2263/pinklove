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
- Keep shared infra/helpers in `src/lib`.
- Prefer feature-owned `server/*` modules for domain services.

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
- The first registered account becomes `admin`.
- Admins are allowed to access public pages and user pages.
- Logged-in non-admin users should be redirected away from `user` auth pages back to the user dashboard.
- Logged-in admins should only be redirected away from the admin login page, not from normal public/user pages.
- Non-admin users must not access the admin area.

## 8) CMS conventions

- CMS page content is stored in `cms_pages`.
- Public content routes are code-managed through explicit files under `src/app/(client)`.
- Managed content-page config lives in `src/features/pages/registry.ts`.
- Auth-page config lives in `src/features/auth/page-registry.ts`.
- Public page UI should live with the route in `src/app/(client)` rather than behind a separate template layer.
- Template-specific fields are stored in `cms_pages.custom_fields`.
- Use `getFields(page)` from `src/lib/cms-fields.ts` when a page object is already available.
- Use `getFieldsBySlug(slug)` from `src/lib/cms.ts` only in server routes/pages that need to load fields by slug.
- Protected/system slugs currently include:
  - `home`
  - `login`
  - `register`
- Content pages such as `about-us` and `contact` are also code-managed and seeded if missing.
- These system pages are seeded by `src/lib/db.ts` if missing.
- User-facing auth-page route controllers should stay in `src/app/**/page.tsx`, but shared auth-page loading logic should live in `src/features/auth/page-loader.ts`.
- `login` and `register` only keep the auth fields currently used by the UI:
  - `heading`
  - `subheading`
  - `sideImage`
- Auth field definitions live in `src/features/auth/fields.ts`.
- System-page status must still be respected publicly: `draft` pages are only previewable by admins.
- Admin should edit only managed content/system pages that already exist in code; creating a new page means adding a new route file and registering it in the content-page registry.

## 8.1) ACF layout conventions

- In the admin page editor, `Template Custom Fields` use a two-column grid by default on `md+`.
- Standard text/media fields stay in one grid column.
- `textarea` fields span both columns.
- Media fields should be laid out by grid column rules, not by width hacks.
- Media preview should fill the media field container itself, while the field still occupies a normal grid column unless intentionally spanned.
- Media field values should be resolved through `resolveMediaUrl()` from `src/lib/media.ts` before rendering on the site.
- `SEO Settings` in the page editor should be collapsible and default closed.

## 9) Menu conventions

- Menu admin pages live under:
  - `src/app/(admin)/admin/(protected)/menus/page.tsx`
  - `src/app/(admin)/admin/(protected)/menus/[id]/page.tsx`
- Menu code expects `cms_menus` and `cms_menu_items`.
- Menu tables are auto-created by `src/lib/db.ts`.
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

## 10.1) Affiliate conventions

- Affiliate server logic lives in `src/features/affiliate/server/service.ts`.
- Affiliate UI lives under:
  - `src/features/affiliate/*`
  - `src/app/(user)/user/(protected)/affiliate/page.tsx`
  - `src/app/(admin)/admin/(protected)/affiliates/page.tsx`
- Affiliate tracking API lives at `src/app/api/affiliate/track/route.ts`.
- User application API lives at `src/app/api/user/affiliate/apply/route.ts`.
- Admin approval/update API lives at `src/app/api/admin/affiliates/update/route.ts`.
- Affiliate is currently a program layered on top of normal accounts, not a third user role.
- Current statuses are:
  - `pending`
  - `active`
  - `rejected`
  - `blocked`
- Tracking currently covers referral links, click logging, and referral cookies.
- Conversion attribution and payout settlement are intentionally not wired yet because the current repo still does not have checkout or order completion.

## 10.2) Wedding product conventions

- Product catalog logic lives in `src/features/products/server/service.ts`.
- Per-customer invitation/site logic lives in `src/features/sites/server/service.ts`.
- Wedding template definitions live in:
  - `src/features/sites/templates/registry.ts`
  - `src/features/sites/templates/renderers.tsx`
  - `src/features/sites/templates/index.ts`
- Builder implementation lives under `src/features/sites/builder/*`.
- `products` is the source catalog for invitation offerings.
- `wedding_sites` is the per-user site instance created from a coded template or a builder starter.
- Wedding templates should follow the same structural pattern used by CMS pages:
  - registry definition
  - field schema
  - shared field rendering
- Public catalog flows live at:
  - `src/app/(client)/templates/page.tsx`
  - `src/app/(client)/templates/[slug]/page.tsx`
  - `src/app/(client)/builder/page.tsx`
  - `src/app/(client)/builder/[slug]/page.tsx`
- User site flows live at:
  - `src/app/(user)/user/(protected)/sites/page.tsx`
  - `src/app/(user)/user/(protected)/sites/[id]/page.tsx`
  - `src/app/(designer)/user/design/[id]/page.tsx`
- Admin product flows live at:
  - `src/app/(admin)/admin/(protected)/products/page.tsx`
  - `src/app/(admin)/admin/(protected)/products/[slug]/page.tsx`
- Admin product APIs live at:
  - `src/app/api/admin/products/create/route.ts`
  - `src/app/api/admin/products/update/route.ts`
  - `src/app/api/admin/products/delete/route.ts`
- Public invitation rendering lives at `src/app/(client)/w/[slug]/page.tsx`.
- Product/site types are currently:
  - `coded_template`
  - `builder_template`
- `Thiếp mẫu sẵn` should point only to `coded_template` products.
- `Tự tạo thiệp` should point only to `builder_template` products.
- Builder editing now uses a Konva-backed visual editor for text, shape, and image blocks.
- Builder-template sites should be edited through `src/app/(designer)/user/design/[id]/page.tsx`, not through the generic site form route.
- The current builder editor layout is:
  - top property/action controls
  - left asset library
  - center live editor
  - right publish/settings sidebar
- Full Canva-class features such as layers panel and advanced asset workflows are not implemented yet.
- Current create flows bypass checkout and create draft `wedding_sites` directly so the product/site editing flow can be tested end to end.

## 11) Styling conventions

- Global styles live in `src/app/globals.css`.
- The project uses a px-first scale. Prefer px-backed Tailwind tokens and px arbitrary values over rem-based arbitrary values.
- Global spacing, text sizes, container widths, and breakpoints are defined from px tokens in `src/app/globals.css`.
- The app uses the root design tokens defined in `src/app/globals.css`.
- Current defaults follow the repo's shadcn-style `rose` token palette rather than per-layout runtime theme switching.
- Global select styling is defined in `globals.css`.

## 12) Runtime and startup

- Use `./docker/setup` for common Docker workflows.
- `./docker/setup` supports `up`, `rebuild`, `down`, and `logs`.
- Development stack configuration lives in `docker/compose.yml`.
- Production-style stack lives in `docker/compose.prod.yml`.
- The dev web service bind-mounts `./web` into the container.
- The dev stack does not keep a dedicated `.next` volume.
- Default values in `.env.example` are currently:
  - `WEB_PORT=3000`
  - `POSTGRES_PORT=5433`

## 13) Database conventions

- Check `src/lib/db.ts` before adding schema changes.
- Follow the existing sequential migration/helper pattern if extending the bootstrap logic.
- CMS system pages, menu tables, affiliate tables, product tables, and seeded starter products are currently bootstrapped from `src/lib/db.ts`.
