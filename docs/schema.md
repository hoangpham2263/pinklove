# Database Schema

Current database schema snapshot for the PinkLove project.

This file is meant to be readable directly on GitHub. GitHub renders the Mermaid
ER diagrams below, so the table map can be reviewed without opening a database
client.

Snapshot source:

- Runtime database: local Docker PostgreSQL `app`
- Schema source in code: `web/src/lib/database.ts`
- Last refreshed from DB: 2026-05-23

## ID Policy

The clean runtime schema uses `text` primary keys and foreign keys. The current
ID generator is `app_random_id()`, a nanoid-compatible 24 character text
generator. The latest DB audit returned zero `bigint`/`integer` ID columns.

## Table Count

Current database has 120 public tables after final physical offering cleanup:

| Area | Tables |
| --- | --- |
| Identity | `users`, `user_sessions`, `user_settings`, `user_profiles`, `user_shipping_profiles`, `user_addresses`, `user_oauth_accounts`, `internal_accounts` |
| CMS | `managed_pages`, `navigation_menus`, `navigation_menu_items`, `media_assets`, `media_asset_links`, `app_settings` |
| Affiliate | `affiliate_accounts`, `affiliate_clicks`, `affiliate_conversions`, `affiliate_applications` |
| Offerings | `offering_types`, `offering_type_field_groups`, `offering_type_fields`, `offering_categories`, `offerings`, `digital_template_offerings`, `physical_offerings`, `offering_bundles`, `offering_bundle_items`, `offering_relationships`, `offering_search_documents`, `shopping_cart_items` |
| Blog / comments | `blog_categories`, `blog_posts`, `content_comments` |
| Commerce | `commerce_orders`, `commerce_order_items`, `commerce_payments`, `commerce_payment_logs`, `commerce_shipments`, `commerce_entitlements` |
| Providers | `provider_order_assignments`, `provider_order_events`, `provider_offering_submissions`, `provider_offering_submission_events`, `offering_provider_suppliers`, `provider_offering_supplier_requests`, `provider_applications` |
| Chat | `chat_conversations`, `chat_conversation_participants`, `chat_messages`, `chat_message_user_states`, `chat_conversation_user_states`, `chat_typing_states` |
| Notifications | `notifications`, `notification_target_roles`, `notification_target_users`, `notification_user_states` |
| Offering domain extensions | `digital_template_offerings`, `physical_offerings`, `wedding_site_offerings`, `service_offerings`, `creator_service_offerings`, `experience_offerings`, `subscription_offerings` |
| Wedding experience | `wedding_sites`, `wedding_site_pages`, `wedding_site_sections`, `wedding_site_guests`, `wedding_site_rsvps`, `wedding_site_events`, `wedding_site_galleries` |
| Provider ecosystem | `providers`, `provider_profiles`, `provider_services`, `provider_regions`, `provider_reviews`, `provider_pricing`, `provider_fulfillments`, `provider_types` |
| Service booking | `bookings`, `booking_items`, `booking_status_logs`, `booking_payments`, `booking_calendars`, `provider_availability`, `provider_time_slots` |
| Digital access | `digital_access_grants`, `subscription_access`, `feature_access` |
| Organizations | `organizations`, `organization_members`, `organization_roles` |
| Template discovery | `template_collections`, `template_variants`, `template_tags`, `template_styles`, `template_categories`, `template_attributes`, `template_attribute_values`, `template_analytics`, `template_views`, `template_shares`, `template_conversions`, `template_engines` |
| Taxonomy / activity / regions | `tags`, `tag_relations`, `activities`, `activity_actors`, `activity_targets`, `domain_events`, `domain_event_types`, `analytics_sessions`, `analytics_page_views`, `analytics_events`, `regions`, `shipping_regions`, `service_regions` |
| System config / constraints | `offering_statuses`, `media_target_types`, `media_roles` |
| SEO / audit | `seo_redirects`, `seo_metadata`, `seo_indexing_rules`, `field_change_logs` |

## Core Refactor Status

The sellable catalog source of truth is `offerings`. The older product naming
has been removed from the application surface and new catalog work should not
create `products` tables, routes, services, or API names.

The final roadmap lives in `docs/architecture-todo.md`. This schema document
tracks the runtime database plus the next target shape when the runtime has
known transitional tables.

Offering types are data-driven through `offering_types`:

- `offerings.offering_type` stores the type key.
- `offering_types.key` defines available type keys, labels, fulfillment behavior,
  and inventory/provider flags.
- Relational `offering_type_fields` rows are the source of truth for admin field
  definitions.
- `offering_types.field_schema` has been removed from the clean runtime schema.
- Custom type-specific values are stored under `offerings.config.customFields`.
- `offerings.config` is guarded as lightweight UI/metadata storage only. The
  database boundary rejects `inventory`, `pricing_rules`, `permissions`,
  `analytics`, `booking_logic`, `relational_data`, `siteDefaults`,
  `generalOffering` and legacy config supply key.
- `offerings.config` also has a soft size guard: `pg_column_size(config) <=
  32768`, so it cannot become a dumping ground.
- Physical inventory, cost, provider ownership, and provider supply flags live in
  `physical_offerings`, not in `offerings.config`.
- A new type such as `video_invitation` or `creator_service` can be created from
  `/admin/offerings/types` without adding a new table or hardcoded union.
- Add a dedicated subtype table only when a domain needs strongly queried,
  relational columns at scale.

Runtime now uses business-domain offering tables for active catalog modeling.
The transitional `physical_product_offerings` table has been migrated into
`physical_offerings` and removed. Coded/builder behavior is stored as rendering
strategy through `template_engine` and `template_mode`, not as product type.

Current domain tables:

- `digital_template_offerings`
- `physical_offerings`
- `wedding_site_offerings`
- `service_offerings`
- `creator_service_offerings`
- `experience_offerings`
- `subscription_offerings`

Current system offering type keys:

- `digital_template`
- `physical_product`
- `wedding_video`
- `wedding_photo`
- `bridal_makeup`
- `wedding_decoration`
- `wedding_planner`
- `wedding_service`
- `wedding_gift`

`digital_template` is reserved for the two fixed invitation flows:
`template_engine = coded` and `template_engine = builder`. All other seeded
types belong to `/admin/offerings/list` and can be connected to providers or
third-party suppliers.

Field definitions are relational `offering_type_fields` rows grouped by
`offering_type_field_groups`. Admin offering create/edit forms read these rows
directly, render grouped dynamic field sections, apply visibility conditions,
and validate custom values before writing `offerings.config.customFields`.

The clean schema includes the provider, bundle, availability, search document,
organization, domain event, template attribute, and analytics tables from the
final architecture checklist.

Config tables seed controlled values for `provider_types`, `template_engines`,
`offering_statuses`, `media_target_types`, `media_roles`, and
`domain_event_types`. This keeps admin forms extensible without allowing random
provider types, media targets, media roles, template engines, or cache
invalidation event names.

Current runtime seed data:

| Type key | Label | Status | Fulfillment | Template key | Inventory | Provider supply | System | Fields |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: |
| `bridal_makeup` | Makeup cô dâu | active | service | `bridal_makeup` | no | yes | yes | 0 |
| `digital_template` | Thiệp cưới online | active | digital | `digital_template` | no | no | yes | 0 |
| `physical_product` | Thiệp giấy | active | physical | `physical_product` | yes | yes | yes | 0 |
| `wedding_decoration` | Trang trí tiệc cưới | active | service | `wedding_decoration` | no | yes | yes | 0 |
| `wedding_gift` | Quà cưới | active | physical | `wedding_gift` | yes | yes | yes | 0 |
| `wedding_photo` | Chụp ảnh cưới | active | service | `wedding_photo` | no | yes | yes | 0 |
| `wedding_planner` | Wedding planner | active | service | `wedding_planner` | no | yes | yes | 0 |
| `wedding_service` | Dịch vụ cưới | active | service | `wedding_service` | no | yes | yes | 0 |
| `wedding_video` | Làm video cưới | active | service | `wedding_video` | no | yes | yes | 0 |

Current runtime offering data:

| Offering type | Template engine | Rows |
| --- | --- | ---: |
| `digital_template` | `builder` | 6 |
| `digital_template` | `coded` | 6 |
| `physical_product` | none | 6 |

## Final Cleanup Runtime Contracts

- ID columns are text-only. User references, menu references, affiliate
  references, chat references, provider fulfillment references, and
  `app_settings.id` have all been migrated away from `bigint`/`integer` IDs.
- Provider types are controlled by `provider_types`; current seeded values are
  `supplier`, `creator`, `studio`, `planner`, `photographer`, `makeup`,
  `florist`, and `videographer`.
- Marketplace and provider ecosystem ownership resolves through `providers.id`.
  Current offering subtype tables that model provider ownership use
  `provider_id` plus `provider_type` against `providers.id`; account-bound
  fulfillment workflow tables use `provider_user_id` against `users.id`.
- Template rendering strategy is controlled by `template_engines`; current
  seeded values are `coded`, `builder`, `hybrid`, `motion`, `video`, and
  `ai_generated`.
- Offering moderation status is controlled by `offering_statuses`; current
  seeded values are `draft`, `pending_review`, `published`, `archived`, and
  `disabled`.
- Media link constraints are backed by `media_target_types` and `media_roles`.
  The runtime accepts targets such as `offering`, `supplier`, `wedding_site`,
  `gallery`, `booking`, `organization`, and `template`.
- `offering_search_documents.search_vector` is a generated PostgreSQL
  `tsvector` with a GIN index for full-text search.
- Search sync event names are registered in `domain_event_types`:
  `offering.search.sync`, `template.search.sync`, and `provider.search.sync`.
- Template ranking columns are available as `trend_score`, `conversion_score`,
  and `quality_score`.
- Bundles support pricing rules through `pricing_strategy`, `discount_type`, and
  `discount_value`.
- `field_change_logs` stores auditable field changes across modules.
- `seo_redirects`, `seo_metadata`, and `seo_indexing_rules` hold SEO domain
  state outside generic JSON settings.
- Admin redirect management and runtime redirect lookup use `seo_redirects`;
  legacy `app_settings.seo_redirects` is only a fallback/backfill source.
- `domain_event_types` declares canonical event names and marks cache
  invalidation events such as `offering.updated`, `template.updated`,
  `provider.updated`, and `site.published`.
- Provider-prefixed fulfillment tables remain intentionally as the physical
  fulfillment domain and use `provider_user_id` where the app workflow is
  account-based. Provider-facing marketplace identity lives in `providers` and
  the provider ecosystem tables.

## Final Architecture Rules

Provider account workflow and provider marketplace identity are intentionally
separate. Use `providers.id` for marketplace identity, discovery, services,
profiles, booking, pricing, reviews, and public provider ecosystem data. Use
`users.id` only through explicitly named `provider_user_id` fields for
authentication, admin moderation, supplier account workflow, and operational
fulfillment screens where the actor is a provider user account. `provider_id`
is reserved for `providers.id`; `providers.owner_user_id` stores the auth owner
of a provider entity.

`physical_offerings` is the only physical subtype table. It stores inventory,
cost, provider SKU, provider supply flags, and optional `provider_id` /
`provider_type`. The removed `owner_type` semantics are now derived from
whether `provider_id` is present.

Template key ownership is strict:

- `offering_types.template_key` is the system preset key for a type.
- `offerings.template_key` is the actual runtime selected template for the
  sellable offering.
- Subtype `template_key` columns are allowed only when rendering/runtime needs a
  subtype-local template identity.

`template_engine` controls rendering, runtime, and editor behavior only. It does
not control business logic, commerce behavior, pricing, permissions, inventory,
or fulfillment.

Dynamic fields are limited to UI metadata, presentation, discovery, and optional
structured fields. Payments, permissions, inventory, critical business
workflows, analytics, and booking core logic must stay relational-first.

Availability is split intentionally:

- `booking_calendars` is the provider-owned calendar container and can be
  distinguished by `key`, `label`, `timezone`, and `config`.
- `provider_availability` stores recurring weekly rules declared by providers.
  Provider-facing rules must link to an approved service via `offering_id` or `provider_service_id` and
  classify the operational purpose with `availability_kind` (`general`,
  `consultation`, `on_site_service`, `provider_site_service`, `handoff`,
  `production`).
- `provider_time_slots` stores concrete dated slots for booking workflows and
  should carry `availability_id`, `provider_service_id`, `offering_id`, and
  `availability_kind` when generated from declared availability.
- Calendar provider category is derived from `providers.provider_type`; do not
  add a separate calendar type for provider categories unless a new booking
  domain requires a relationally queried classification.
- `offerings.fulfillment_type` is handoff/commerce behavior (`digital`,
  `physical`, `service`), not enough to identify what a calendar slot is for.
  Use `availability_kind` plus service/offering linkage for makeup-at-location,
  studio service, consultation, handoff, and production scheduling.
- Provider service requests store `service_kind`, `duration_minutes`, and
  `service_area` on `provider_offering_submissions`. When a service request is
  approved, these values are applied into `service_offerings` and
  `provider_services.metadata`.

## Overview

```mermaid
erDiagram
  users ||--o{ user_sessions : owns
  users ||--o{ user_profiles : has
  users ||--o{ wedding_sites : creates
  users ||--o{ commerce_orders : places
  users ||--o| affiliate_accounts : can_have
  users ||--o{ chat_conversations : participates
  users ||--o{ notifications : receives

  offering_categories ||--o{ offerings : categorizes
  offering_types ||--o{ offerings : defines
  offering_types ||--o{ offering_type_field_groups : field_groups
  offering_types ||--o{ offering_type_fields : fields
  offering_type_field_groups ||--o{ offering_type_fields : groups
  offerings ||--o| digital_template_offerings : has
  offerings ||--o| wedding_site_offerings : has
  offerings ||--o| physical_offerings : has
  offerings ||--o| service_offerings : has
  offerings ||--o| creator_service_offerings : has
  offerings ||--o| subscription_offerings : has
  offerings ||--o| experience_offerings : has
  offerings ||--o{ media_asset_links : media
  offerings ||--o{ wedding_sites : creates
  offerings ||--o{ commerce_order_items : sold_as

  commerce_orders ||--o{ commerce_order_items : contains
  commerce_orders ||--o{ commerce_payments : paid_by
  commerce_orders ||--o{ commerce_entitlements : grants
  commerce_orders ||--o| provider_order_assignments : assigned_to

  navigation_menus ||--o{ navigation_menu_items : contains
  blog_categories ||--o{ blog_posts : contains
  chat_conversations ||--o{ chat_messages : has
  notifications ||--o{ notification_user_states : has
```

## Offerings Core

```mermaid
erDiagram
  offerings {
    text id PK
    text slug UK
    text name
    text offering_type
    text fulfillment_type
    text status
    numeric price
    jsonb config
  }

  offering_types {
    text id PK
    text key UK
    text label
    text status
    text fulfillment_type
    text template_key
    text template_engine
    text template_mode
    boolean supports_inventory
    boolean supports_provider_supply
    boolean is_system
  }

  offering_type_fields {
    text id PK
    text offering_type_id FK
    text group_id FK
    text field_key
    text field_label
    text field_type
    boolean is_required
    jsonb validation_rules
    jsonb ui_config
    jsonb visibility_conditions
    jsonb dependency_conditions
  }

  offering_type_field_groups {
    text id PK
    text offering_type_id FK
    text key
    text label
    int sort_order
    jsonb ui_config
  }

  digital_template_offerings {
    text offering_id PK, FK
    text template_key
    text template_engine
    text template_mode
    jsonb site_defaults
  }

  wedding_site_offerings {
    text offering_id PK, FK
    text template_key
    jsonb builder_defaults
  }

  physical_offerings {
    text offering_id PK, FK
    text fulfillment_type
    boolean track_inventory
    int stock_quantity
    int low_stock_threshold
    boolean allow_backorder
    numeric cost_price
    text provider_sku
    boolean allow_provider_supply
    text provider_type
    text provider_id FK
  }

  service_offerings {
    text offering_id PK, FK
    text service_kind
    int duration_minutes
    boolean requires_consultation
  }

  creator_service_offerings {
    text offering_id PK, FK
    text provider_id FK
    text provider_type
    text service_kind
    int delivery_days
  }

  experience_offerings {
    text offering_id PK, FK
    text experience_kind
    text location_note
  }

  subscription_offerings {
    text offering_id PK, FK
    text billing_period
    jsonb feature_set
  }

  media_assets {
    text id PK
    text url
  }

  providers {
    text id PK
    text slug UK
    text display_name
    text provider_type
  }

  media_asset_links {
    text id PK
    text media_asset_id FK
    text target_type
    text target_id
    text role
    int sort_order
  }

  providers ||--o{ creator_service_offerings : provides
  offering_types ||--o{ offerings : defines
  offering_types ||--o{ offering_type_field_groups : field_groups
  offering_types ||--o{ offering_type_fields : fields
  offering_type_field_groups ||--o{ offering_type_fields : groups
  offerings ||--o| digital_template_offerings : digital_template
  offerings ||--o| wedding_site_offerings : wedding_site
  offerings ||--o| physical_offerings : physical_product
  offerings ||--o| service_offerings : service
  offerings ||--o| creator_service_offerings : creator_service
  offerings ||--o| experience_offerings : experience
  offerings ||--o| subscription_offerings : subscription
  media_assets ||--o{ media_asset_links : linked
```

## Wedding Experience Split

```mermaid
erDiagram
  wedding_sites {
    text id PK
    text user_id FK
    text offering_id FK
    text slug UK
    jsonb custom_data "always empty after bootstrap"
  }

  wedding_site_pages {
    text id PK
    text wedding_site_id FK
    text slug
    text title
  }

  wedding_site_sections {
    text id PK
    text wedding_site_id FK
    text page_id FK
    text section_type
    jsonb content
  }

  wedding_site_guests {
    text id PK
    text wedding_site_id FK
    text full_name
    text invite_code
  }

  wedding_site_rsvps {
    text id PK
    text wedding_site_id FK
    text guest_id FK
    text response_status
  }

  wedding_site_events {
    text id PK
    text wedding_site_id FK
    text title
    timestamptz starts_at
  }

  wedding_site_galleries {
    text id PK
    text wedding_site_id FK
    text title
  }

  wedding_sites ||--o{ wedding_site_pages : has
  wedding_sites ||--o{ wedding_site_sections : has
  wedding_site_pages ||--o{ wedding_site_sections : contains
  wedding_sites ||--o{ wedding_site_guests : invites
  wedding_sites ||--o{ wedding_site_rsvps : receives
  wedding_site_guests ||--o{ wedding_site_rsvps : responds
  wedding_sites ||--o{ wedding_site_events : schedules
  wedding_sites ||--o{ wedding_site_galleries : has
```

Invitation runtime data is persisted through `wedding_site_sections` with
`section_type = template_data`. `wedding_sites.custom_data` is no longer a write
target; bootstrap clears old values and runtime create/update paths keep it as
`{}`. Structured arrays in template data are also synced into
`wedding_site_events`, `wedding_site_guests`, and `wedding_site_rsvps` when
present.

## Ecosystem Extensions

```mermaid
erDiagram
  providers {
    text id PK
    text user_id FK
    text organization_id FK
    text slug UK
    text display_name
    text provider_type
  }

  provider_profiles {
    text provider_id PK
  }

  provider_services {
    text id PK
    text provider_id FK
    text offering_id FK
    jsonb metadata
  }

  bookings {
    text id PK
    text user_id FK
    text booking_number UK
    text status
    numeric total_amount
  }

  booking_items {
    text id PK
    text booking_id FK
    text offering_id FK
    text provider_type
    text provider_id FK
  }

  digital_access_grants {
    text id PK
    text user_id FK
    text offering_id FK
    text source_type
    text status
  }

  tags {
    text id PK
    text slug UK
    text tag_type
  }

  tag_relations {
    text id PK
    text tag_id FK
    text target_type
    text target_id
  }

  activities {
    text id PK
    text activity_type
    text verb
  }

  activity_actors {
    text id PK
    text activity_id FK
    text actor_type
    text actor_id
  }

  activity_targets {
    text id PK
    text activity_id FK
    text target_type
    text target_id
  }

  regions {
    text id PK
    text slug UK
    text region_type
  }

  users ||--o{ providers : owns
  users ||--o{ bookings : creates
  providers ||--o{ provider_profiles : has
  providers ||--o{ provider_services : offers
  providers ||--o{ booking_items : fulfills
  bookings ||--o{ booking_items : contains
  offerings ||--o{ booking_items : booked_as
  offerings ||--o{ digital_access_grants : grants
  tags ||--o{ tag_relations : labels
  activities ||--o{ activity_actors : has
  activities ||--o{ activity_targets : targets
```

## Identity And CMS

```mermaid
erDiagram
  users {
    text id PK
    text username UK
    text role
    text account_status
    jsonb wishlist_offering_ids
  }

  user_sessions {
    text id PK
    text user_id FK
    text token_hash UK
  }

  user_settings {
    text user_id PK, FK
    text ui_density
  }

  user_profiles {
    text user_id PK, FK
    text display_name
    text provider_portal_slug
  }

  user_shipping_profiles {
    text id PK
    text user_id FK
    text profile_type
  }

  user_addresses {
    text id PK
    text user_id FK
    boolean is_default
  }

  user_oauth_accounts {
    text id PK
    text user_id FK
    text provider
    text provider_user_id
  }

  internal_accounts {
    text id PK
    text platform
    text label
  }

  managed_pages {
    text id PK
    text slug UK
    text status
    text template
    jsonb custom_fields
  }

  navigation_menus {
    text id PK
    text name UK
    text label
  }

  navigation_menu_items {
    text id PK
    text menu_id FK
    text parent_id
    text type
    text page_slug
  }

  media_assets {
    text id PK
    text url
    text mime_type
    bigint size_bytes
  }

  app_settings {
    text id PK
    text theme
    jsonb seo_breadcrumb
    jsonb seo_sitemap
    jsonb global_fields_config
  }

  users ||--o{ user_sessions : owns
  users ||--|| user_settings : has
  users ||--|| user_profiles : has
  users ||--o{ user_shipping_profiles : has
  users ||--o{ user_addresses : has
  users ||--o{ user_oauth_accounts : has
  navigation_menus ||--o{ navigation_menu_items : contains
```

## Offering, Catalog, And Public Content

```mermaid
erDiagram
  offering_categories {
    text id PK
    text slug UK
    text name
    text status
  }

  offering_types {
    text id PK
    text key UK
    text label
    text status
    text fulfillment_type
    text template_key
    text template_engine
    text template_mode
    boolean supports_inventory
    boolean supports_provider_supply
    boolean is_system
  }

  offering_type_fields {
    text id PK
    text offering_type_id FK
    text group_id FK
    text field_key
    text field_label
    text field_type
    boolean is_required
    jsonb validation_rules
    jsonb ui_config
    jsonb visibility_conditions
    jsonb dependency_conditions
  }

  offering_type_field_groups {
    text id PK
    text offering_type_id FK
    text key
    text label
    int sort_order
    jsonb ui_config
  }

  offerings {
    text id PK
    text slug UK
    text name
    text offering_type
    text template_key
    text category_id FK
    numeric price
    jsonb config
  }

  physical_offerings {
    text offering_id PK, FK
    text fulfillment_type
    boolean track_inventory
    int stock_quantity
    int low_stock_threshold
    boolean allow_backorder
    numeric cost_price
    text provider_sku
    boolean allow_provider_supply
    text provider_type
    text provider_id FK
  }

  providers {
    text id PK
    text slug UK
    text display_name
    text provider_type
  }

  wedding_sites {
    text id PK
    text user_id FK
    text offering_id FK
    text slug UK
    text site_type
    jsonb custom_data
  }

  shopping_cart_items {
    text id PK
    text user_id FK
    text offering_id FK
    int quantity
  }

  blog_categories {
    text id PK
    text slug UK
    text name
    text status
  }

  blog_posts {
    text id PK
    text category_id FK
    text slug UK
    text title
    text status
  }

  content_comments {
    text id PK
    text target_type
    text target_id
    text author_user_id FK
    text approved_by FK
    text status
  }

  users ||--o{ wedding_sites : creates
  users ||--o{ shopping_cart_items : owns
  users ||--o{ content_comments : writes
  users ||--o{ content_comments : approves
  providers ||--o{ physical_offerings : owns_provider_offering

  offering_categories ||--o{ offerings : categorizes
  offering_types ||--o{ offerings : defines
  offering_types ||--o{ offering_type_field_groups : field_groups
  offering_types ||--o{ offering_type_fields : fields
  offering_type_field_groups ||--o{ offering_type_fields : groups
  offerings ||--o| digital_template_offerings : template_details
  offerings ||--o| physical_offerings : physical_details
  offerings ||--o{ wedding_sites : starts_from
  offerings ||--o{ shopping_cart_items : in_cart

  blog_categories ||--o{ blog_posts : contains
```

## Commerce, Affiliate, And Provider Flow

```mermaid
erDiagram
  affiliate_accounts {
    text user_id PK, FK
    text code UK
    text status
    text commission_type
    numeric commission_value
  }

  affiliate_clicks {
    text id PK
    text affiliate_user_id FK
    text affiliate_code
    text landing_path
  }

  affiliate_conversions {
    text id PK
    text affiliate_user_id FK
    text external_order_ref UK
    numeric order_value
    numeric commission_amount
    text status
  }

  affiliate_applications {
    text id PK
    text email
    text preferred_code
    text review_status
  }

  commerce_orders {
    text id PK
    text order_number UK
    text user_id FK
    text affiliate_user_id FK
    text status
    text payment_status
    numeric total_amount
  }

  commerce_order_items {
    text id PK
    text order_id FK
    text offering_id FK
    text offering_type
    int quantity
    numeric line_total
  }

  commerce_payments {
    text id PK
    text order_id FK
    text provider
    numeric amount
    text status
  }

  commerce_payment_logs {
    text id PK
    text order_id FK
    text payment_id FK
    text provider
    jsonb payload
  }

  commerce_shipments {
    text id PK
    text order_id FK
    text carrier
    text tracking_number
    text status
  }

  commerce_entitlements {
    text id PK
    text user_id FK
    text offering_id FK
    text order_id FK
    text order_item_id FK
    text status
  }

  provider_order_assignments {
    text id PK
    text order_id FK
    text provider_user_id FK
    text status
  }

  provider_order_events {
    text id PK
    text assignment_id FK
    text actor_user_id FK
    text event_type
  }

  provider_offering_submissions {
    text id PK
    text provider_user_id FK
    text linked_offering_id FK
    text category_id FK
    text fulfillment_type
    text service_kind
    int duration_minutes
    text service_area
    text review_status
  }

  provider_offering_submission_events {
    text id PK
    text submission_id FK
    text actor_user_id FK
    text event_type
  }

  offering_provider_suppliers {
    text id PK
    text offering_id FK
    text provider_user_id FK
    text status
  }

  provider_offering_supplier_requests {
    text id PK
    text offering_id FK
    text provider_user_id FK
    text review_status
  }

  provider_applications {
    text id PK
    text email
    text review_status
  }

  users ||--o| affiliate_accounts : can_have
  users ||--o{ commerce_orders : places
  users ||--o{ commerce_entitlements : receives
  users ||--o{ provider_order_assignments : fulfills
  users ||--o{ provider_offering_submissions : submits
  users ||--o{ offering_provider_suppliers : supplies
  users ||--o{ provider_offering_supplier_requests : requests

  affiliate_accounts ||--o{ affiliate_clicks : tracks
  affiliate_accounts ||--o{ affiliate_conversions : earns
  affiliate_accounts ||--o{ commerce_orders : attributes

  commerce_orders ||--o{ commerce_order_items : contains
  commerce_orders ||--o{ commerce_payments : paid_by
  commerce_orders ||--o{ commerce_payment_logs : logs
  commerce_orders ||--o| commerce_shipments : ships
  commerce_orders ||--o{ commerce_entitlements : grants
  commerce_orders ||--o| provider_order_assignments : assigned_to

  commerce_order_items ||--o{ commerce_entitlements : grants
  commerce_payments ||--o{ commerce_payment_logs : logs
  provider_order_assignments ||--o{ provider_order_events : records
  provider_offering_submissions ||--o{ provider_offering_submission_events : records
```

## Chat And Notifications

```mermaid
erDiagram
  chat_conversations {
    text id PK
    text kind
    text created_by_user_id FK
    text owner_user_id FK
    text requester_user_id FK
    text status
    text priority
  }

  chat_conversation_participants {
    text conversation_id PK, FK
    text user_id PK, FK
    timestamptz last_read_at
  }

  chat_messages {
    text id PK
    text conversation_id FK
    text sender_user_id FK
    text visibility
    text reply_to_message_id FK
  }

  chat_message_user_states {
    text message_id PK, FK
    text user_id PK, FK
    boolean is_pinned
  }

  chat_conversation_user_states {
    text conversation_id PK, FK
    text user_id PK, FK
    boolean is_pinned
    boolean is_hidden
  }

  chat_typing_states {
    text conversation_id PK, FK
    text user_id PK, FK
  }

  notifications {
    text id PK
    text audience_type
    text created_by_user_id FK
    text status
    timestamptz scheduled_at
  }

  notification_target_roles {
    text notification_id PK, FK
    text role PK
  }

  notification_target_users {
    text notification_id PK, FK
    text user_id PK, FK
  }

  notification_user_states {
    text notification_id PK, FK
    text user_id PK, FK
    timestamptz read_at
    timestamptz dismissed_at
  }

  users ||--o{ chat_conversations : creates
  users ||--o{ chat_conversations : owns
  users ||--o{ chat_conversations : requests
  users ||--o{ chat_conversation_participants : participates
  users ||--o{ chat_messages : sends
  users ||--o{ chat_message_user_states : message_state
  users ||--o{ chat_conversation_user_states : conversation_state
  users ||--o{ chat_typing_states : typing

  chat_conversations ||--o{ chat_conversation_participants : has
  chat_conversations ||--o{ chat_messages : has
  chat_conversations ||--o{ chat_conversation_user_states : has
  chat_conversations ||--o{ chat_typing_states : has
  chat_messages ||--o{ chat_message_user_states : has
  chat_messages ||--o{ chat_messages : replies

  users ||--o{ notifications : creates
  users ||--o{ notification_target_users : targeted
  users ||--o{ notification_user_states : state
  notifications ||--o{ notification_target_roles : targets
  notifications ||--o{ notification_target_users : targets
  notifications ||--o{ notification_user_states : has
```

## Runtime Foreign Key List

This list covers all runtime database-level foreign keys.
`offering_types.key` is intentionally referenced by application logic rather
than a hard FK so type definitions can be managed as configuration data and
archived without breaking existing catalog rows.

| From | To | On delete |
| --- | --- | --- |
| `activity_actors.activity_id` | `activities.id` | CASCADE |
| `activity_targets.activity_id` | `activities.id` | CASCADE |
| `affiliate_accounts.approved_by` | `users.id` | SET NULL |
| `affiliate_accounts.user_id` | `users.id` | CASCADE |
| `affiliate_clicks.affiliate_user_id` | `affiliate_accounts.user_id` | CASCADE |
| `affiliate_conversions.affiliate_user_id` | `affiliate_accounts.user_id` | CASCADE |
| `analytics_events.page_view_id` | `analytics_page_views.id` | SET NULL |
| `analytics_events.session_id` | `analytics_sessions.id` | SET NULL |
| `analytics_page_views.session_id` | `analytics_sessions.id` | SET NULL |
| `analytics_sessions.user_id` | `users.id` | SET NULL |
| `blog_posts.category_id` | `blog_categories.id` | CASCADE |
| `booking_calendars.provider_id` | `providers.id` | CASCADE |
| `booking_items.booking_id` | `bookings.id` | CASCADE |
| `booking_items.offering_id` | `offerings.id` | SET NULL |
| `booking_items.provider_id` | `providers.id` | SET NULL |
| `booking_payments.booking_id` | `bookings.id` | CASCADE |
| `booking_status_logs.actor_user_id` | `users.id` | SET NULL |
| `booking_status_logs.booking_id` | `bookings.id` | CASCADE |
| `bookings.user_id` | `users.id` | SET NULL |
| `chat_conversation_participants.conversation_id` | `chat_conversations.id` | CASCADE |
| `chat_conversation_participants.user_id` | `users.id` | CASCADE |
| `chat_conversation_user_states.conversation_id` | `chat_conversations.id` | CASCADE |
| `chat_conversation_user_states.user_id` | `users.id` | CASCADE |
| `chat_conversations.created_by_user_id` | `users.id` | SET NULL |
| `chat_conversations.owner_user_id` | `users.id` | SET NULL |
| `chat_conversations.requester_user_id` | `users.id` | SET NULL |
| `chat_message_user_states.message_id` | `chat_messages.id` | CASCADE |
| `chat_message_user_states.user_id` | `users.id` | CASCADE |
| `chat_messages.conversation_id` | `chat_conversations.id` | CASCADE |
| `chat_messages.reply_to_message_id` | `chat_messages.id` | SET NULL |
| `chat_messages.sender_user_id` | `users.id` | CASCADE |
| `chat_typing_states.conversation_id` | `chat_conversations.id` | CASCADE |
| `chat_typing_states.user_id` | `users.id` | CASCADE |
| `commerce_entitlements.order_id` | `commerce_orders.id` | CASCADE |
| `commerce_entitlements.order_item_id` | `commerce_order_items.id` | SET NULL |
| `commerce_entitlements.offering_id` | `offerings.id` | CASCADE |
| `commerce_entitlements.user_id` | `users.id` | CASCADE |
| `commerce_order_items.order_id` | `commerce_orders.id` | CASCADE |
| `commerce_order_items.offering_id` | `offerings.id` | SET NULL |
| `commerce_orders.affiliate_user_id` | `affiliate_accounts.user_id` | SET NULL |
| `commerce_orders.user_id` | `users.id` | CASCADE |
| `commerce_payment_logs.order_id` | `commerce_orders.id` | SET NULL |
| `commerce_payment_logs.payment_id` | `commerce_payments.id` | SET NULL |
| `commerce_payments.order_id` | `commerce_orders.id` | CASCADE |
| `commerce_shipments.order_id` | `commerce_orders.id` | CASCADE |
| `content_comments.approved_by` | `users.id` | SET NULL |
| `content_comments.author_user_id` | `users.id` | SET NULL |
| `creator_service_offerings.offering_id` | `offerings.id` | CASCADE |
| `creator_service_offerings.provider_id` | `providers.id` | SET NULL |
| `digital_access_grants.offering_id` | `offerings.id` | CASCADE |
| `digital_access_grants.user_id` | `users.id` | CASCADE |
| `digital_template_offerings.offering_id` | `offerings.id` | CASCADE |
| `experience_offerings.offering_id` | `offerings.id` | CASCADE |
| `feature_access.user_id` | `users.id` | CASCADE |
| `field_change_logs.actor_id` | `users.id` | SET NULL |
| `media_asset_links.media_asset_id` | `media_assets.id` | CASCADE |
| `physical_offerings.offering_id` | `offerings.id` | CASCADE |
| `physical_offerings.provider_id` | `providers.id` | SET NULL |
| `navigation_menu_items.menu_id` | `navigation_menus.id` | CASCADE |
| `notification_target_roles.notification_id` | `notifications.id` | CASCADE |
| `notification_target_users.notification_id` | `notifications.id` | CASCADE |
| `notification_target_users.user_id` | `users.id` | CASCADE |
| `notification_user_states.notification_id` | `notifications.id` | CASCADE |
| `notification_user_states.user_id` | `users.id` | CASCADE |
| `notifications.created_by_user_id` | `users.id` | SET NULL |
| `offering_bundle_items.bundle_id` | `offering_bundles.id` | CASCADE |
| `offering_bundle_items.offering_id` | `offerings.id` | CASCADE |
| `offering_relationships.source_offering_id` | `offerings.id` | CASCADE |
| `offering_relationships.target_offering_id` | `offerings.id` | CASCADE |
| `offering_provider_suppliers.approved_by` | `users.id` | SET NULL |
| `offering_provider_suppliers.offering_id` | `offerings.id` | CASCADE |
| `offering_provider_suppliers.provider_user_id` | `users.id` | CASCADE |
| `offering_search_documents.offering_id` | `offerings.id` | CASCADE |
| `offering_type_field_groups.offering_type_id` | `offering_types.id` | CASCADE |
| `offering_type_fields.group_id` | `offering_type_field_groups.id` | SET NULL |
| `offering_type_fields.offering_type_id` | `offering_types.id` | CASCADE |
| `offerings.category_id` | `offering_categories.id` | SET NULL |
| `organization_members.organization_id` | `organizations.id` | CASCADE |
| `organization_members.role_id` | `organization_roles.id` | SET NULL |
| `organization_members.user_id` | `users.id` | CASCADE |
| `organization_roles.organization_id` | `organizations.id` | CASCADE |
| `provider_availability.calendar_id` | `booking_calendars.id` | CASCADE |
| `provider_availability.provider_id` | `providers.id` | CASCADE |
| `provider_fulfillments.offering_id` | `offerings.id` | SET NULL |
| `provider_fulfillments.provider_id` | `providers.id` | CASCADE |
| `provider_pricing.offering_id` | `offerings.id` | CASCADE |
| `provider_pricing.provider_id` | `providers.id` | CASCADE |
| `provider_profiles.provider_id` | `providers.id` | CASCADE |
| `provider_regions.provider_id` | `providers.id` | CASCADE |
| `provider_regions.region_id` | `regions.id` | CASCADE |
| `provider_reviews.provider_id` | `providers.id` | CASCADE |
| `provider_reviews.user_id` | `users.id` | SET NULL |
| `provider_services.offering_id` | `offerings.id` | SET NULL |
| `provider_services.provider_id` | `providers.id` | CASCADE |
| `provider_time_slots.calendar_id` | `booking_calendars.id` | CASCADE |
| `provider_time_slots.offering_id` | `offerings.id` | SET NULL |
| `provider_time_slots.provider_id` | `providers.id` | CASCADE |
| `providers.organization_id` | `organizations.id` | SET NULL |
| `providers.owner_user_id` | `users.id` | SET NULL |
| `regions.parent_id` | `regions.id` | SET NULL |
| `service_offerings.offering_id` | `offerings.id` | CASCADE |
| `service_regions.offering_id` | `offerings.id` | CASCADE |
| `service_regions.region_id` | `regions.id` | CASCADE |
| `shipping_regions.region_id` | `regions.id` | CASCADE |
| `shopping_cart_items.offering_id` | `offerings.id` | CASCADE |
| `shopping_cart_items.user_id` | `users.id` | CASCADE |
| `subscription_access.offering_id` | `offerings.id` | SET NULL |
| `subscription_access.user_id` | `users.id` | CASCADE |
| `subscription_offerings.offering_id` | `offerings.id` | CASCADE |
| `tag_relations.tag_id` | `tags.id` | CASCADE |
| `template_analytics.offering_id` | `offerings.id` | CASCADE |
| `template_attribute_values.attribute_id` | `template_attributes.id` | CASCADE |
| `template_attribute_values.offering_id` | `offerings.id` | CASCADE |
| `template_categories.parent_id` | `template_categories.id` | SET NULL |
| `template_conversions.offering_id` | `offerings.id` | CASCADE |
| `template_shares.offering_id` | `offerings.id` | CASCADE |
| `template_variants.offering_id` | `offerings.id` | CASCADE |
| `template_views.offering_id` | `offerings.id` | CASCADE |
| `user_addresses.user_id` | `users.id` | CASCADE |
| `user_oauth_accounts.user_id` | `users.id` | CASCADE |
| `user_profiles.user_id` | `users.id` | CASCADE |
| `user_sessions.user_id` | `users.id` | CASCADE |
| `user_settings.user_id` | `users.id` | CASCADE |
| `user_shipping_profiles.user_id` | `users.id` | CASCADE |
| `users.account_status_updated_by` | `users.id` | SET NULL |
| `provider_order_assignments.order_id` | `commerce_orders.id` | CASCADE |
| `provider_order_assignments.provider_user_id` | `users.id` | CASCADE |
| `provider_order_events.actor_user_id` | `users.id` | SET NULL |
| `provider_order_events.assignment_id` | `provider_order_assignments.id` | CASCADE |
| `provider_offering_submission_events.actor_user_id` | `users.id` | SET NULL |
| `provider_offering_submission_events.submission_id` | `provider_offering_submissions.id` | CASCADE |
| `provider_offering_submissions.category_id` | `offering_categories.id` | SET NULL |
| `provider_offering_submissions.linked_offering_id` | `offerings.id` | SET NULL |
| `provider_offering_submissions.reviewed_by` | `users.id` | SET NULL |
| `provider_offering_submissions.provider_user_id` | `users.id` | CASCADE |
| `provider_offering_supplier_requests.offering_id` | `offerings.id` | CASCADE |
| `provider_offering_supplier_requests.reviewed_by` | `users.id` | SET NULL |
| `provider_offering_supplier_requests.provider_user_id` | `users.id` | CASCADE |
| `wedding_site_events.wedding_site_id` | `wedding_sites.id` | CASCADE |
| `wedding_site_galleries.wedding_site_id` | `wedding_sites.id` | CASCADE |
| `wedding_site_guests.wedding_site_id` | `wedding_sites.id` | CASCADE |
| `wedding_site_offerings.offering_id` | `offerings.id` | CASCADE |
| `wedding_site_pages.wedding_site_id` | `wedding_sites.id` | CASCADE |
| `wedding_site_rsvps.guest_id` | `wedding_site_guests.id` | SET NULL |
| `wedding_site_rsvps.wedding_site_id` | `wedding_sites.id` | CASCADE |
| `wedding_site_sections.page_id` | `wedding_site_pages.id` | CASCADE |
| `wedding_site_sections.wedding_site_id` | `wedding_sites.id` | CASCADE |
| `wedding_sites.offering_id` | `offerings.id` | SET NULL |
| `wedding_sites.user_id` | `users.id` | CASCADE |

## Refresh Commands

Use these commands when the runtime DB changes and this document needs a manual
refresh:

```bash
docker compose exec db psql -U app -d app -P pager=off -c \
  "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by table_name;"

docker compose exec db psql -U app -d app -P pager=off -c \
  "select tc.table_name, kcu.column_name, ccu.table_name as foreign_table_name, ccu.column_name as foreign_column_name, rc.delete_rule from information_schema.table_constraints tc join information_schema.key_column_usage kcu on tc.constraint_name=kcu.constraint_name and tc.table_schema=kcu.table_schema join information_schema.constraint_column_usage ccu on ccu.constraint_name=tc.constraint_name and ccu.table_schema=tc.table_schema join information_schema.referential_constraints rc on rc.constraint_name=tc.constraint_name and rc.constraint_schema=tc.table_schema where tc.constraint_type='FOREIGN KEY' and tc.table_schema='public' order by tc.table_name,kcu.column_name;"

docker compose exec db psql -U app -d app -P pager=off -c \
  "select ot.key,ot.label,ot.status,ot.fulfillment_type,ot.template_key,ot.supports_inventory,ot.supports_provider_supply,ot.is_system,count(otf.id) as fields from offering_types ot left join offering_type_fields otf on otf.offering_type_id=ot.id group by ot.id,ot.key,ot.label,ot.status,ot.fulfillment_type,ot.template_key,ot.supports_inventory,ot.supports_provider_supply,ot.is_system order by ot.is_system desc, ot.key;"

docker compose exec db psql -U app -d app -P pager=off -c \
  "select offering_type,count(*) from offerings group by offering_type order by offering_type;"
```
