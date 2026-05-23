# Admin Convention

This file covers the admin area and admin-controlled workflows.

## Scope

- `src/app/admin/*`
- `src/app/api/admin/*`
- `src/features/admin/*`

## Rules

- Only the `ADMIN` role may access the admin area.
- The admin shell lives under `src/app/admin/(protected)`.
- Account/actor management now uses actor codes `ADMIN`, `CUSTOMER`, `AFFILIATE`, and `PROVIDER` for stored roles; `GUEST` is the public non-authenticated actor only.
- Admin `Pages` edits only managed content and system pages already registered in code.
- Admin `Global Fields` manages code-registered global fields for whole-site shared content.
- Admin offering flows operate on catalog entries in `offerings`.
- `/admin/offerings` is the main offering management table across all offering
  types. Route children such as `/admin/offerings/templates`,
  `/admin/offerings/builder`, and `/admin/offerings/list` keep scoped table
  views for focused operations.
- Offering management screens should keep the same dense table management style
  as the main `/admin/offerings` table.
- Admin offering type management lives at `/admin/offerings/types` and writes to
  `offering_types` plus relational `offering_type_fields`. The type management
  UI is also table-first, with preview and create/edit dialogs. Use it to define
  custom fields for new catalog types instead of hardcoding type unions in forms
  or API routes.
- Admin dynamic offering forms should render from relational field groups,
  fields, validation rules, and conditional logic. The expected backing tables
  are `offering_type_field_groups` and `offering_type_fields`.
- Admin ecommerce flows manage carts indirectly through customer checkout, and directly manage orders, payments, shipments, and fulfillment state.
- `Admin > Cấu hình > Email` owns the reusable email sender config and template demo. New offering flows should render shortcode templates through `src/lib/email-template.ts`, then send through `src/lib/email.ts` instead of wiring transport-specific logic in feature code.
- `Admin > Cấu hình > Payment Methods` owns payment method settings. Admin users should be able to enable, disable, rename, describe, and configure method provider/type through structured form fields instead of raw JSON.
- Admin order detail should keep operational updates close to the top of the right column. `Cập nhật đơn hàng` is a first-class action surface and should not be buried below long secondary content.
- Menu management expects `navigation_menus` and `navigation_menu_items`.
- Public guest header/footer navigation is loaded from `navigation_menus`
  (`header` and `footer`) through the guest layout. Admin Menu Management is the
  source of truth for those links.
- `Admin > Cấu hình` is the centralized place for system-wide permalink, breadcrumb, sitemap, and robots behavior.
- Whole-site robots/indexing controls live inside `Admin > Cấu hình > Sitemap`.
- Page-level SEO editor may override per-page permalink/breadcrumb data, but shared defaults and toggles live in admin config.
- Admin blog management now includes dynamic CRUD for `Blog Posts` and `Blog Categories`.
- Admin offering categories now use a dedicated `offering_categories` data model and offerings can be assigned to a category from admin offering forms.
- Actor accounts now have dedicated management screens for `CUSTOMER`, `AFFILIATE`, and `PROVIDER`, in addition to the full account list.
- `Admin > Nhà cung cấp` can expose a dedicated detail page per provider account so operations can review that provider's assigned orders in one place.
- Provider management may also expose a dedicated public entry link per provider account that routes into the shared partner portal after login.
- Admin order state updates should use client-side mutation panels for operational screens when partial realtime refresh is available, instead of relying on native form redirects.
- Admin-facing status displays may keep stored enum values in English internally, but visible management labels should be shown in Vietnamese for clarity.
- Admin UI mutations and fetches should go through `src/lib/api-client.admin.ts`.
- If an admin client form needs a native `action=` fallback, prefer `adminApiActions.*` from the same file instead of hardcoding `ROUTES.API.ADMIN.*` inside the component.

## Current admin sections

- dashboard
- global fields
- blog posts
- blog categories
- customer management
- affiliate actor management
- provider management
- ecommerce operations
  - orders
  - payments
  - shipments
- pages
- menus
- media
- notifications
- internal accounts
- affiliates
- offerings
  - main offering management table
  - offering list
  - offering categories
  - offering types
  - offering type fields and groups
  - template attributes
  - bundles
  - providers
  - search documents
  - provider availability
- analytics
  - analytics events
  - domain events
- seo
  - page seo
  - seo schema
  - seo rules
- cấu hình
  - branding
  - ecommerce
  - payment methods
  - favicon
  - opengraph
  - permalinks
  - breadcrumbs
  - sitemap

## Notifications

- Admin notifications are created from `/admin/notifications` through a modal flow.
- Targeting supports all users, selected stored roles, selected users, immediate send, and scheduled send.
