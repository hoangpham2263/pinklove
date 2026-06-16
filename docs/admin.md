# Admin Convention

This file covers the admin area and admin-controlled workflows.

## Scope

- `src/app/admin/*`
- `src/app/api/admin/*`
- `src/features/admin/*`

## Rules

- Only the `ADMIN` role may access the admin area.
- The admin shell lives under `src/app/admin/(protected)`.
- Admin desktop and mobile navigation use the same flat feature registry in
  `src/features/admin/config/navigation.ts`.
- The Admin menubar exposes twelve top-level entries ordered by operational
  use: Dashboard, Commerce, Bookings, Providers, Accounts, Affiliates,
  Communication, Analytics, Marketing, Website, Blog and Configuration.
- Related management routes are grouped into sections on each function hub
  instead of nested sidebar menus.
- Group hub pages use `AdminFeatureOverview` and the same registry sections as
  the menubar so routes, permissions, and active prefixes are not duplicated.
- Configuration remains a separate top-level entry and keeps its specialized
  section-based page at `/admin/config`.
- Customer and Provider portal navigation remain independent from the Admin
  navigation registry.
- Account/actor management now uses actor codes `ADMIN`, `CUSTOMER`, `AFFILIATE`, and `PROVIDER` for stored roles; `GUEST` is the public non-authenticated actor only.
- `Admin > Accounts` owns login actors and access: all users, customers,
  internal accounts, and admin access roles.
- `Admin > Affiliates` owns the affiliate program: affiliate users,
  applications, customer affiliate approvals, conversions, and commissions.
- `Admin > Providers` owns provider operations end to end: provider accounts,
  provider directory, leads, reviews, availability, sourcing, and provider
  submissions.
- `Admin > Commerce` owns offerings, offering types, templates, categories,
  bundles, orders, payments, and shipments.
- `Admin > Bookings` owns service bookings and wedding planning operations.
- `Admin > Marketing` owns landing pages, campaigns, A/B experiments, Ads,
  external advertisers, placements, banner creatives, and sponsored provider
  priority. Ads must stay separate from service bookings.
- `Admin > Website` owns managed pages, navigation, SEO, media, and shared
  website data.
- Admin `Pages` edits only managed content and system pages already registered in code.
- Admin `Edit Page` keeps page metadata and body content in `Thông tin trang`,
  managed fields in the `Custom Fields` vertical tab workspace, and SEO in the
  separate `SEO Settings` card.
- Admin `Global Fields` manages code-registered global fields for whole-site shared content.
- Admin offering flows operate on catalog entries in `offerings`.
- `/admin/offerings` is the main offering management table across all offering
  types. Route children such as `/admin/offerings/templates`,
  `/admin/offerings/builder`, and `/admin/offerings/list` keep scoped table
  views for focused operations.
- Offering management screens should keep the same dense table management style
  as the main `/admin/offerings` table.
- Offering type contracts are registered in
  `src/features/offerings/type-registry.ts`. Runtime bootstrap synchronizes
  their metadata to `offering_types` and removes unregistered types and their
  offerings.
- Admin offering type management lives at `/admin/offerings/types`. Admin can
  edit only relational `offering_type_fields`; creating a type or changing its
  renderer, fulfillment, template, and capabilities requires a code change.
- Admin dynamic offering forms should render from relational field groups,
  fields, validation rules, and conditional logic. The expected backing tables
  are `offering_type_field_groups` and `offering_type_fields`.
- Admin commerce flows manage carts indirectly through customer checkout, and directly manage orders, payments, shipments, and fulfillment state.
- `Admin > Bookings > Service bookings` manages service bookings, status changes,
  booking payments, and status logs. Keep this separate from physical commerce
  orders.
- `Admin > Cấu hình > Email` owns the reusable email sender config and template demo. New offering flows should render shortcode templates through `src/lib/email-template.ts`, then send through `src/lib/email.ts` instead of wiring transport-specific logic in feature code.
- `Admin > Cấu hình > Payment Methods` owns payment method settings. Admin users should be able to enable, disable, rename, describe, and configure method provider/type through structured form fields instead of raw JSON.
- Admin order detail should keep operational updates close to the top of the right column. `Cập nhật đơn hàng` is a first-class action surface and should not be buried below long secondary content.
- Menu management expects `navigation_menus` and `navigation_menu_items`.
- Media management includes ordered `media_collections` backed by existing
  `media_assets`; it must not duplicate asset records.
- Admin analytics reads business conversions from `conversion_goals` and
  `conversion_events` through the analytics service layer.
- `Admin > Bookings > Wedding Planning` provides the cross-customer planning
  overview for wedding sites, guests, RSVP, seating, tasks, and timeline.
- `Admin > Providers > Leads & Quotes` provides the marketplace lead and
  quote overview before accepted quotes become bookings.
- `Admin > Providers > Provider Reviews` moderates customer reviews after
  booking completion or confirmation.
- `Admin > System > Audit Logs` reads `field_change_logs`.
- `Admin > Marketing` owns Campaigns, A/B Experiments, and Landing Page
  planning surfaces.
- `Admin > Analytics > Conversion Goals` manages conversion goal metadata used
  by analytics reports.
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
- Provider management may also expose a dedicated public entry link per provider account that routes into the shared provider portal after login.
- Admin order state updates should use client-side mutation panels for operational screens when partial realtime refresh is available, instead of relying on native form redirects.
- Admin-facing status displays must use English labels consistently across the project.
- Admin UI mutations and fetches should go through `src/lib/api-client.admin.ts`.
- If an admin client form needs a native `action=` fallback, prefer `adminApiActions.*` from the same file instead of hardcoding `ROUTES.API.ADMIN.*` inside the component.

## Current admin sections

- dashboard
- commerce
- bookings
- providers
- accounts
- affiliates
- communication
- analytics
- marketing
- website
- blog
- configuration

## Admin Access

- All internal operators use `/admin`; there is no separate Staff portal.
- `users.role = 'ADMIN'` enables the technical Admin portal.
- `users.admin_role_id` assigns one database-managed Admin role.
- `/admin/access/roles` manages module permissions.
- Page navigation and `/api/admin/*` requests use the same permission mapping.
- Detailed HR, internal tasks, time tracking, leave, recruitment, contracts,
  and payroll belong to a separate internal system.
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
  - provider reviews
  - search documents
  - provider availability
- analytics
  - analytics events
  - domain events
  - conversion goals
- marketing
  - campaigns
  - A/B experiments
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
