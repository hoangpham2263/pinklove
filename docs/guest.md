# Guest Convention

This file covers the public `GUEST` area.

## Scope

- `src/app/(guest)/*`
- Public-facing invitation catalog routes
- Public wedding invitation rendering at `src/app/(guest)/(catalog)/invitations/[slug]/page.tsx`

## Rules

- Public content pages are explicit code-managed routes, not admin-created arbitrary routes.
- Keep page-specific UI close to the route under `src/app/(guest)`.
- Use managed-page fields only where the page is already registered in the content registry.
- `/mau-thiep` shows `digital_template` offerings with `template_engine = coded`.
- `/tu-tao-thiep` shows `digital_template` offerings with `template_engine = builder`.
- `/thiep-giay` shows `physical_product` offerings.
- Public catalog filtering should apply offering type first, then category/price/sort filters for future expansion. New public catalog sections should read the type key from configuration instead of introducing hardcoded product terminology.
- Public invitation rendering should read from published invitation records. The current table name is still `wedding_sites`.
- Guest wishlist is available at `/wishlist`, requires login, persists on the authenticated `users.wishlist_offering_ids` field, and is the primary customer-facing purchase list in place of a separate cart screen.
- Guest search is available at `/search`; the header search opens a quick search popover and submits to this public result page.
- Guest header shows a public notification bell for signed-out visitors. It reads only sent `all` notifications through `/api/notifications/public` and stores read/unread state in browser localStorage.
- Guest heading convention:
  - `h1`: `text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl font-semibold`
  - `h2`: `text-xl sm:text-2xl lg:text-3xl 2xl:text-4xl font-semibold`
  - `p`: `text-sm md:text-base lg:text-lg`
- Section layout convention:
  - `section`: `pt-10 lg:pt-15 2xl:pt-20`
  - inner `div`: `container px-4 mx-auto`
- Guest radius convention:
  - default interactive and panel radius: `rounded-xl lg:rounded-2xl`

## Current routes

- `src/app/(guest)/page.tsx`
- `src/app/(guest)/(marketing)/about/page.tsx`
- `src/app/(guest)/(marketing)/contact/page.tsx`
- `src/app/(guest)/(marketing)/services/page.tsx`
- `src/app/(guest)/(catalog)/mau-thiep/[slug]/page.tsx`
- `src/app/(guest)/(catalog)/mau-thiep/[slug]/customize/page.tsx`
- `src/app/(guest)/(catalog)/tu-tao-thiep/[slug]/page.tsx`
- `src/app/(guest)/(catalog)/wishlist/page.tsx`
- `src/app/(guest)/(catalog)/invitations/[slug]/page.tsx`
- `src/app/(guest)/(content)/blog/page.tsx`
- `src/app/(guest)/(content)/search/page.tsx`
- `src/app/(guest)/(content)/blog/[slug]/page.tsx`
- `src/app/(guest)/(content)/blog/post/[slug]/page.tsx`
- `src/app/(guest)/tools/page.tsx`
- `src/app/(guest)/tools/qr-builder/page.tsx`
- `src/app/(guest)/tools/wedding-budget/page.tsx`
