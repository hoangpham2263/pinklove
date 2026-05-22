# Database Schema

Current database schema snapshot for the PinkLove project.

This file is meant to be readable directly on GitHub. GitHub renders the Mermaid
ER diagrams below, so the table map can be reviewed without opening a database
client.

Snapshot source:

- Runtime database: local Docker PostgreSQL `app`
- Schema source in code: `web/src/lib/database.ts`
- Last refreshed from DB: 2026-05-22

## Compatibility Note

Some existing local tables still use older `bigint` ids, while the current
bootstrap code creates newer tables with `text` ids via `app_random_id()`.
Application queries should keep using the existing helpers and avoid assuming
all ids are the same physical type across every environment.

## Table Count

Current database has 100 public tables:

| Area | Tables |
| --- | --- |
| Identity | `users`, `user_sessions`, `user_settings`, `user_profiles`, `user_shipping_profiles`, `user_addresses`, `user_oauth_accounts`, `internal_accounts` |
| CMS | `managed_pages`, `navigation_menus`, `navigation_menu_items`, `media_assets`, `app_settings` |
| Affiliate | `affiliate_accounts`, `affiliate_clicks`, `affiliate_conversions`, `affiliate_applications` |
| Offerings | `offering_types`, `offering_type_fields`, `offering_categories`, `offerings`, `digital_template_offerings`, `physical_offerings`, `wedding_sites`, `shopping_cart_items` |
| Blog / comments | `blog_categories`, `blog_posts`, `content_comments` |
| Commerce | `commerce_orders`, `commerce_order_items`, `commerce_payments`, `commerce_payment_logs`, `commerce_shipments`, `commerce_entitlements` |
| Vendors | `vendor_order_assignments`, `vendor_order_events`, `vendor_offering_submissions`, `vendor_offering_submission_events`, `offering_vendor_suppliers`, `vendor_offering_supplier_requests`, `vendor_applications` |
| Chat | `chat_conversations`, `chat_conversation_participants`, `chat_messages`, `chat_message_user_states`, `chat_conversation_user_states`, `chat_typing_states` |
| Notifications | `notifications`, `notification_target_roles`, `notification_target_users`, `notification_user_states` |
| Offering domain extensions | `digital_template_offerings`, `physical_offerings`, `wedding_site_offerings`, `service_offerings`, `creator_service_offerings`, `experience_offerings`, `subscription_offerings` |
| Universal media | `media_asset_links` |
| Wedding experience | `wedding_site_pages`, `wedding_site_sections`, `wedding_site_guests`, `wedding_site_rsvps`, `wedding_site_events`, `wedding_site_galleries` |
| Creator ecosystem | `creator_profiles`, `creator_services`, `creator_portfolios`, `creator_reviews`, `creator_orders` |
| Vendor ecosystem | `vendors`, `vendor_profiles`, `vendor_services`, `vendor_regions`, `vendor_reviews`, `vendor_pricing`, `vendor_fulfillments` |
| Service booking | `bookings`, `booking_items`, `booking_status_logs`, `booking_payments` |
| Digital access | `digital_access_grants`, `subscription_access`, `feature_access` |
| Template discovery | `template_collections`, `template_variants`, `template_tags`, `template_styles`, `template_categories`, `template_analytics`, `template_views`, `template_shares`, `template_conversions` |
| Taxonomy / activity / regions | `tags`, `tag_relations`, `activities`, `activity_actors`, `activity_targets`, `regions`, `shipping_regions`, `service_regions` |

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
  inventory/vendor flags, and the admin field schema.
- Custom type-specific values are stored under `offerings.config.customFields`.
- A new type such as `video_invitation` or `creator_service` can be created from
  `/admin/offerings/types` without adding a new table or hardcoded union.
- Add a dedicated subtype table only when a domain needs strongly queried,
  relational columns at scale.

Runtime now uses business-domain offering tables. Implementation-based subtype
tables have been removed. Coded/builder behavior is stored as rendering strategy
through `template_engine` and `template_mode`, not as product type.

Current domain tables:

- `digital_template_offerings`
- `physical_offerings`
- `service_offerings`
- `creator_service_offerings`
- `experience_offerings`
- `subscription_offerings`

Current offering type keys:

- `digital_template`
- `physical_product`
- `service`
- `creator_service`
- `experience`
- `subscription`
- `addon`

Field definitions are now available as relational `offering_type_fields` rows.

Current runtime seed data:

| Type key | Label | Status | Fulfillment | Template key | Inventory | Vendor supply | System | Fields |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: |
| `addon` | Addon | active | digital | `addon` | no | no | yes | 0 |
| `creator_service` | Creator Service | active | service | `creator_service` | no | yes | yes | 0 |
| `digital_template` | Digital Template | active | digital | `digital_template` | no | no | yes | 0 |
| `experience` | Experience | active | service | `experience` | no | yes | yes | 0 |
| `physical_product` | Physical Product | active | physical | `physical_product` | yes | yes | yes | 0 |
| `service` | Service | active | service | `service` | no | yes | yes | 0 |
| `subscription` | Subscription | active | digital | `subscription` | no | no | yes | 0 |

Current runtime offering data:

| Offering type | Template engine | Rows |
| --- | --- | ---: |
| `digital_template` | `builder` | 6 |
| `digital_template` | `coded` | 6 |
| `physical_product` | none | 6 |

## Overview

```mermaid
erDiagram
  users ||--o{ user_sessions : owns
  users ||--o{ user_profiles : has
  users ||--o{ offerings : vendor_owns
  users ||--o{ offerings : owns
  users ||--o{ wedding_sites : creates
  users ||--o{ commerce_orders : places
  users ||--o| affiliate_accounts : can_have
  users ||--o{ chat_conversations : participates
  users ||--o{ notifications : receives

  offering_categories ||--o{ offerings : categorizes
  offering_types ||--o{ offerings : defines
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
  commerce_orders ||--o| vendor_order_assignments : assigned_to

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
    boolean supports_inventory
    boolean supports_vendor_supply
    boolean is_system
    jsonb field_schema
  }

  digital_template_offerings {
    text offering_id PK, FK
    text template_key
    text template_engine
    jsonb site_defaults
  }

  wedding_site_offerings {
    text offering_id PK, FK
    text template_key
    jsonb builder_defaults
  }

  physical_offerings {
    text offering_id PK, FK
    text sku
    boolean track_inventory
    int stock_quantity
    numeric cost_price
  }

  service_offerings {
    text offering_id PK, FK
    text service_kind
    int duration_minutes
    boolean requires_consultation
  }

  creator_service_offerings {
    text offering_id PK, FK
    bigint creator_user_id FK
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

  media_asset_links {
    text id PK
    text media_asset_id FK
    text target_type
    text target_id
    text role
    int sort_order
  }

  users ||--o{ creator_service_offerings : provides
  offering_types ||--o{ offerings : defines
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
    bigint id PK
    bigint user_id FK
    text offering_id FK
    text slug UK
    jsonb custom_data
  }

  wedding_site_pages {
    text id PK
    bigint wedding_site_id FK
    text slug
    text title
  }

  wedding_site_sections {
    text id PK
    bigint wedding_site_id FK
    text page_id FK
    text section_type
    jsonb content
  }

  wedding_site_guests {
    text id PK
    bigint wedding_site_id FK
    text full_name
    text invite_code
  }

  wedding_site_rsvps {
    text id PK
    bigint wedding_site_id FK
    text guest_id FK
    text response_status
  }

  wedding_site_events {
    text id PK
    bigint wedding_site_id FK
    text title
    timestamptz starts_at
  }

  wedding_site_galleries {
    text id PK
    bigint wedding_site_id FK
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

## Ecosystem Extensions

```mermaid
erDiagram
  vendors {
    text id PK
    bigint user_id FK
    text slug UK
    text display_name
    text vendor_type
  }

  creator_profiles {
    text id PK
    bigint user_id FK
    text slug UK
    text display_name
  }

  bookings {
    text id PK
    bigint user_id FK
    text booking_number UK
    text status
    numeric total_amount
  }

  booking_items {
    text id PK
    text booking_id FK
    text offering_id FK
    text vendor_id FK
    text creator_profile_id FK
  }

  digital_access_grants {
    text id PK
    bigint user_id FK
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

  users ||--o{ vendors : owns
  users ||--o{ creator_profiles : owns
  users ||--o{ bookings : creates
  vendors ||--o{ booking_items : fulfills
  creator_profiles ||--o{ booking_items : fulfills
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
    bigint id PK
    text username UK
    text role
    text account_status
    jsonb wishlist_offering_ids
  }

  user_sessions {
    text id PK
    bigint user_id FK
    text token_hash UK
  }

  user_settings {
    bigint user_id PK, FK
    text ui_density
  }

  user_profiles {
    bigint user_id PK, FK
    text display_name
    text vendor_portal_slug
  }

  user_shipping_profiles {
    text id PK
    bigint user_id FK
    text profile_type
  }

  user_addresses {
    text id PK
    bigint user_id FK
    boolean is_default
  }

  user_oauth_accounts {
    bigint id PK
    bigint user_id FK
    text provider
    text provider_user_id
  }

  internal_accounts {
    text id PK
    text platform
    text label
  }

  managed_pages {
    bigint id PK
    text slug UK
    text status
    text template
    jsonb custom_fields
  }

  navigation_menus {
    bigint id PK
    text name UK
    text label
  }

  navigation_menu_items {
    bigint id PK
    bigint menu_id FK
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
    int id PK
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
    boolean supports_inventory
    boolean supports_vendor_supply
    boolean is_system
    jsonb field_schema
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
    bigint owner_vendor_user_id FK
    int stock_quantity
    numeric cost_price
  }

  wedding_sites {
    bigint id PK
    bigint user_id FK
    text offering_id FK
    text slug UK
    text site_type
    jsonb custom_data
  }

  shopping_cart_items {
    text id PK
    bigint user_id FK
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
    bigint author_user_id FK
    bigint approved_by FK
    text status
  }

  users ||--o{ wedding_sites : creates
  users ||--o{ shopping_cart_items : owns
  users ||--o{ content_comments : writes
  users ||--o{ content_comments : approves
  users ||--o{ physical_offerings : owns_vendor_offering

  offering_categories ||--o{ offerings : categorizes
  offering_types ||--o{ offerings : defines
  offerings ||--o| digital_template_offerings : template_details
  offerings ||--o| physical_offerings : physical_details
  offerings ||--o{ wedding_sites : starts_from
  offerings ||--o{ shopping_cart_items : in_cart

  blog_categories ||--o{ blog_posts : contains
```

## Commerce, Affiliate, And Vendor Flow

```mermaid
erDiagram
  affiliate_accounts {
    bigint user_id PK, FK
    text code UK
    text status
    text commission_type
    numeric commission_value
  }

  affiliate_clicks {
    bigint id PK
    bigint affiliate_user_id FK
    text affiliate_code
    text landing_path
  }

  affiliate_conversions {
    bigint id PK
    bigint affiliate_user_id FK
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
    bigint user_id FK
    bigint affiliate_user_id FK
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
    bigint user_id FK
    text offering_id FK
    text order_id FK
    text order_item_id FK
    text status
  }

  vendor_order_assignments {
    text id PK
    text order_id FK
    bigint vendor_user_id FK
    text status
  }

  vendor_order_events {
    text id PK
    text assignment_id FK
    bigint actor_user_id FK
    text event_type
  }

  vendor_offering_submissions {
    text id PK
    bigint vendor_user_id FK
    text linked_offering_id FK
    text category_id FK
    text review_status
  }

  vendor_offering_submission_events {
    text id PK
    text submission_id FK
    bigint actor_user_id FK
    text event_type
  }

  offering_vendor_suppliers {
    text id PK
    text offering_id FK
    bigint vendor_user_id FK
    text status
  }

  vendor_offering_supplier_requests {
    text id PK
    text offering_id FK
    bigint vendor_user_id FK
    text review_status
  }

  vendor_applications {
    text id PK
    text email
    text review_status
  }

  users ||--o| affiliate_accounts : can_have
  users ||--o{ commerce_orders : places
  users ||--o{ commerce_entitlements : receives
  users ||--o{ vendor_order_assignments : fulfills
  users ||--o{ vendor_offering_submissions : submits
  users ||--o{ offering_vendor_suppliers : supplies
  users ||--o{ vendor_offering_supplier_requests : requests

  affiliate_accounts ||--o{ affiliate_clicks : tracks
  affiliate_accounts ||--o{ affiliate_conversions : earns
  affiliate_accounts ||--o{ commerce_orders : attributes

  commerce_orders ||--o{ commerce_order_items : contains
  commerce_orders ||--o{ commerce_payments : paid_by
  commerce_orders ||--o{ commerce_payment_logs : logs
  commerce_orders ||--o| commerce_shipments : ships
  commerce_orders ||--o{ commerce_entitlements : grants
  commerce_orders ||--o| vendor_order_assignments : assigned_to

  commerce_order_items ||--o{ commerce_entitlements : grants
  commerce_payments ||--o{ commerce_payment_logs : logs
  vendor_order_assignments ||--o{ vendor_order_events : records
  vendor_offering_submissions ||--o{ vendor_offering_submission_events : records
```

## Chat And Notifications

```mermaid
erDiagram
  chat_conversations {
    text id PK
    text kind
    bigint created_by_user_id FK
    bigint owner_user_id FK
    bigint requester_user_id FK
    text status
    text priority
  }

  chat_conversation_participants {
    text conversation_id PK, FK
    bigint user_id PK, FK
    timestamptz last_read_at
  }

  chat_messages {
    text id PK
    text conversation_id FK
    bigint sender_user_id FK
    text visibility
    text reply_to_message_id FK
  }

  chat_message_user_states {
    text message_id PK, FK
    bigint user_id PK, FK
    boolean is_pinned
  }

  chat_conversation_user_states {
    text conversation_id PK, FK
    bigint user_id PK, FK
    boolean is_pinned
    boolean is_hidden
  }

  chat_typing_states {
    text conversation_id PK, FK
    bigint user_id PK, FK
  }

  notifications {
    text id PK
    text audience_type
    bigint created_by_user_id FK
    text status
    timestamptz scheduled_at
  }

  notification_target_roles {
    text notification_id PK, FK
    text role PK
  }

  notification_target_users {
    text notification_id PK, FK
    bigint user_id PK, FK
  }

  notification_user_states {
    text notification_id PK, FK
    bigint user_id PK, FK
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

## Legacy Foreign Key List

This list covers the operational tables with database-level foreign keys.
`offering_types.key` is intentionally referenced by application logic rather
than a hard FK so type definitions can be managed as configuration data and
archived without breaking existing catalog rows.

| From | To | On delete |
| --- | --- | --- |
| `affiliate_accounts.approved_by` | `users.id` | SET NULL |
| `affiliate_accounts.user_id` | `users.id` | CASCADE |
| `affiliate_clicks.affiliate_user_id` | `affiliate_accounts.user_id` | CASCADE |
| `affiliate_conversions.affiliate_user_id` | `affiliate_accounts.user_id` | CASCADE |
| `blog_posts.category_id` | `blog_categories.id` | CASCADE |
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
| `physical_offerings.owner_vendor_user_id` | `users.id` | SET NULL |
| `physical_offerings.offering_id` | `offerings.id` | CASCADE |
| `navigation_menu_items.menu_id` | `navigation_menus.id` | CASCADE |
| `notification_target_roles.notification_id` | `notifications.id` | CASCADE |
| `notification_target_users.notification_id` | `notifications.id` | CASCADE |
| `notification_target_users.user_id` | `users.id` | CASCADE |
| `notification_user_states.notification_id` | `notifications.id` | CASCADE |
| `notification_user_states.user_id` | `users.id` | CASCADE |
| `notifications.created_by_user_id` | `users.id` | SET NULL |
| `offering_vendor_suppliers.approved_by` | `users.id` | SET NULL |
| `offering_vendor_suppliers.offering_id` | `offerings.id` | CASCADE |
| `offering_vendor_suppliers.vendor_user_id` | `users.id` | CASCADE |
| `offerings.category_id` | `offering_categories.id` | SET NULL |
| `shopping_cart_items.offering_id` | `offerings.id` | CASCADE |
| `shopping_cart_items.user_id` | `users.id` | CASCADE |
| `user_addresses.user_id` | `users.id` | CASCADE |
| `user_oauth_accounts.user_id` | `users.id` | CASCADE |
| `user_profiles.user_id` | `users.id` | CASCADE |
| `user_sessions.user_id` | `users.id` | CASCADE |
| `user_settings.user_id` | `users.id` | CASCADE |
| `user_shipping_profiles.user_id` | `users.id` | CASCADE |
| `users.account_status_updated_by` | `users.id` | SET NULL |
| `vendor_order_assignments.order_id` | `commerce_orders.id` | CASCADE |
| `vendor_order_assignments.vendor_user_id` | `users.id` | CASCADE |
| `vendor_order_events.actor_user_id` | `users.id` | SET NULL |
| `vendor_order_events.assignment_id` | `vendor_order_assignments.id` | CASCADE |
| `vendor_offering_submission_events.actor_user_id` | `users.id` | SET NULL |
| `vendor_offering_submission_events.submission_id` | `vendor_offering_submissions.id` | CASCADE |
| `vendor_offering_submissions.category_id` | `offering_categories.id` | SET NULL |
| `vendor_offering_submissions.linked_offering_id` | `offerings.id` | SET NULL |
| `vendor_offering_submissions.reviewed_by` | `users.id` | SET NULL |
| `vendor_offering_submissions.vendor_user_id` | `users.id` | CASCADE |
| `vendor_offering_supplier_requests.offering_id` | `offerings.id` | CASCADE |
| `vendor_offering_supplier_requests.reviewed_by` | `users.id` | SET NULL |
| `vendor_offering_supplier_requests.vendor_user_id` | `users.id` | CASCADE |
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
  "select key,label,status,fulfillment_type,template_key,supports_inventory,supports_vendor_supply,is_system,jsonb_array_length(field_schema) as fields from offering_types order by is_system desc, key;"

docker compose exec db psql -U app -d app -P pager=off -c \
  "select offering_type,count(*) from offerings group by offering_type order by offering_type;"
```
