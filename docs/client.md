# Client Convention

This file covers the public `(client)` area.

## Scope

- `src/app/(client)/*`
- Public-facing invitation catalog routes
- Public wedding invitation rendering at `src/app/(client)/(catalog)/invitations/[slug]/page.tsx`

## Rules

- Public content pages are explicit code-managed routes, not admin-created arbitrary routes.
- Keep page-specific UI close to the route under `src/app/(client)`.
- Use managed-page fields only where the page is already registered in the content registry.
- `Thiếp mẫu sẵn` routes should show only `coded_template` products.
- `Tự tạo thiệp` routes should show only `builder_template` products.
- Public invitation rendering should read from published invitation records. The current table name is still `wedding_sites`.
- Client heading convention:
  - `h1`: `text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl font-semibold`
  - `h2`: `text-xl sm:text-2xl lg:text-3xl 2xl:text-4xl font-semibold`
  - `p`: `text-sm md:text-base lg:text-lg`
- Section layout convention:
  - `section`: `pt-10 lg:pt-15 2xl:pt-20`
  - inner `div`: `container px-4 mx-auto`
- Client radius convention:
  - default interactive and panel radius: `rounded-xl lg:rounded-2xl`

## Current routes

- `src/app/(client)/page.tsx`
- `src/app/(client)/(marketing)/about/page.tsx`
- `src/app/(client)/(marketing)/contact/page.tsx`
- `src/app/(client)/(marketing)/services/page.tsx`
- `src/app/(client)/(catalog)/templates/page.tsx`
- `src/app/(client)/(catalog)/templates/[slug]/page.tsx`
- `src/app/(client)/(catalog)/builder/page.tsx`
- `src/app/(client)/(catalog)/builder/[slug]/page.tsx`
- `src/app/(client)/(catalog)/invitations/[slug]/page.tsx`
- `src/app/(client)/(content)/blog/page.tsx`
- `src/app/(client)/(content)/blog/[slug]/page.tsx`
- `src/app/(client)/(content)/blog/post/[slug]/page.tsx`
- `src/app/(client)/tools/page.tsx`
- `src/app/(client)/tools/qr-builder/page.tsx`
- `src/app/(client)/tools/wedding-budget/page.tsx`
