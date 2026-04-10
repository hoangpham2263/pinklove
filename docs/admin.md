# Admin Convention

This file covers the admin area and admin-controlled workflows.

## Scope

- `src/app/admin/*`
- `src/app/api/admin/*`
- `src/features/admin/*`

## Rules

- Only the `ADMIN` role may access the admin area.
- The admin shell lives under `src/app/admin/(protected)`.
- Account/actor management now uses actor codes `ADMIN`, `CUSTOMER`, `AFFILIATE`, and `VENDOR` for stored roles; `GUEST` is the public non-authenticated actor only.
- Admin `Pages` edits only managed content and system pages already registered in code.
- Admin `Global Fields` manages code-registered global fields for whole-site shared content.
- Admin product flows operate on catalog entries in `products`.
- Admin ecommerce flows manage carts indirectly through customer checkout, and directly manage orders, payments, shipments, and fulfillment state.
- Menu management expects `navigation_menus` and `navigation_menu_items`.
- Current public guest navigation is still hardcoded even though menu management exists in admin.
- `Admin > Cấu hình` is the centralized place for system-wide permalink, breadcrumb, sitemap, and robots behavior.
- Whole-site robots/indexing controls live inside `Admin > Cấu hình > Sitemap`.
- Page-level SEO editor may override per-page permalink/breadcrumb data, but shared defaults and toggles live in admin config.
- Admin blog management now includes dynamic CRUD for `Blog Posts` and `Blog Categories`.
- Admin product categories now use a dedicated `product_categories` data model and products can be assigned to a category from admin product forms.
- Actor accounts now have dedicated management screens for `CUSTOMER`, `AFFILIATE`, and `VENDOR`, in addition to the full account list.

## Current admin sections

- dashboard
- global fields
- blog posts
- blog categories
- customer management
- affiliate actor management
- vendor management
- ecommerce operations
  - orders
  - payments
  - shipments
- pages
- menus
- media
- internal accounts
- affiliates
- products
  - product list
  - product categories
- seo
  - page seo
  - seo schema
  - seo rules
- cấu hình
  - branding
  - ecommerce
  - favicon
  - opengraph
  - permalinks
  - breadcrumbs
  - sitemap
