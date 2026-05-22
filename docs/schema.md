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

Current database has 50 public tables:

| Area | Tables |
| --- | --- |
| Identity | `users`, `user_sessions`, `user_settings`, `user_profiles`, `user_shipping_profiles`, `user_addresses`, `user_oauth_accounts`, `internal_accounts` |
| CMS | `managed_pages`, `navigation_menus`, `navigation_menu_items`, `media_assets`, `app_settings` |
| Affiliate | `affiliate_accounts`, `affiliate_clicks`, `affiliate_conversions`, `affiliate_applications` |
| Products | `product_categories`, `products`, `coded_template_products`, `builder_products`, `general_products`, `wedding_sites`, `shopping_cart_items` |
| Blog / comments | `blog_categories`, `blog_posts`, `content_comments` |
| Commerce | `commerce_orders`, `commerce_order_items`, `commerce_payments`, `commerce_payment_logs`, `commerce_shipments`, `commerce_entitlements` |
| Vendors | `vendor_order_assignments`, `vendor_order_events`, `vendor_product_submissions`, `vendor_product_submission_events`, `product_vendor_suppliers`, `vendor_product_supplier_requests`, `vendor_applications` |
| Chat | `chat_conversations`, `chat_conversation_participants`, `chat_messages`, `chat_message_user_states`, `chat_conversation_user_states`, `chat_typing_states` |
| Notifications | `notifications`, `notification_target_roles`, `notification_target_users`, `notification_user_states` |

## Identity And CMS

```mermaid
erDiagram
  users {
    bigint id PK
    text username UK
    text role
    text account_status
    jsonb wishlist_product_ids
  }

  user_sessions {
    text id PK
    bigint user_id FK
    text token_hash UK
  }

  user_settings {
    bigint user_id PK FK
    text ui_density
  }

  user_profiles {
    bigint user_id PK FK
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

## Product, Catalog, And Public Content

```mermaid
erDiagram
  product_categories {
    text id PK
    text slug UK
    text name
    text status
  }

  products {
    bigint id PK
    text slug UK
    text name
    text product_type
    text template_key
    text category_id FK
    numeric price
    jsonb config
  }

  coded_template_products {
    bigint product_id PK FK
    text template_key
    jsonb site_defaults
  }

  builder_products {
    bigint product_id PK FK
    text template_key
    jsonb site_defaults
  }

  general_products {
    bigint product_id PK FK
    text fulfillment_type
    bigint owner_vendor_user_id FK
    int stock_quantity
    numeric cost_price
  }

  wedding_sites {
    bigint id PK
    bigint user_id FK
    bigint product_id FK
    text slug UK
    text site_type
    jsonb custom_data
  }

  shopping_cart_items {
    text id PK
    bigint user_id FK
    bigint product_id FK
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
  users ||--o{ general_products : owns_vendor_product

  product_categories ||--o{ products : categorizes
  products ||--o| coded_template_products : template_details
  products ||--o| builder_products : builder_details
  products ||--o| general_products : product_details
  products ||--o{ wedding_sites : starts_from
  products ||--o{ shopping_cart_items : in_cart

  blog_categories ||--o{ blog_posts : contains
```

## Commerce, Affiliate, And Vendor Flow

```mermaid
erDiagram
  affiliate_accounts {
    bigint user_id PK FK
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
    bigint product_id FK
    text product_type
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
    bigint product_id FK
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

  vendor_product_submissions {
    text id PK
    bigint vendor_user_id FK
    bigint linked_product_id FK
    text category_id FK
    text review_status
  }

  vendor_product_submission_events {
    text id PK
    text submission_id FK
    bigint actor_user_id FK
    text event_type
  }

  product_vendor_suppliers {
    text id PK
    bigint product_id FK
    bigint vendor_user_id FK
    text status
  }

  vendor_product_supplier_requests {
    text id PK
    bigint product_id FK
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
  users ||--o{ vendor_product_submissions : submits
  users ||--o{ product_vendor_suppliers : supplies
  users ||--o{ vendor_product_supplier_requests : requests

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
  vendor_product_submissions ||--o{ vendor_product_submission_events : records
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
    text conversation_id PK FK
    bigint user_id PK FK
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
    text message_id PK FK
    bigint user_id PK FK
    boolean is_pinned
  }

  chat_conversation_user_states {
    text conversation_id PK FK
    bigint user_id PK FK
    boolean is_pinned
    boolean is_hidden
  }

  chat_typing_states {
    text conversation_id PK FK
    bigint user_id PK FK
  }

  notifications {
    text id PK
    text audience_type
    bigint created_by_user_id FK
    text status
    timestamptz scheduled_at
  }

  notification_target_roles {
    text notification_id PK FK
    text role PK
  }

  notification_target_users {
    text notification_id PK FK
    bigint user_id PK FK
  }

  notification_user_states {
    text notification_id PK FK
    bigint user_id PK FK
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

## Full Foreign Key List

| From | To | On delete |
| --- | --- | --- |
| `affiliate_accounts.approved_by` | `users.id` | SET NULL |
| `affiliate_accounts.user_id` | `users.id` | CASCADE |
| `affiliate_clicks.affiliate_user_id` | `affiliate_accounts.user_id` | CASCADE |
| `affiliate_conversions.affiliate_user_id` | `affiliate_accounts.user_id` | CASCADE |
| `blog_posts.category_id` | `blog_categories.id` | CASCADE |
| `builder_products.product_id` | `products.id` | CASCADE |
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
| `coded_template_products.product_id` | `products.id` | CASCADE |
| `commerce_entitlements.order_id` | `commerce_orders.id` | CASCADE |
| `commerce_entitlements.order_item_id` | `commerce_order_items.id` | SET NULL |
| `commerce_entitlements.product_id` | `products.id` | CASCADE |
| `commerce_entitlements.user_id` | `users.id` | CASCADE |
| `commerce_order_items.order_id` | `commerce_orders.id` | CASCADE |
| `commerce_order_items.product_id` | `products.id` | SET NULL |
| `commerce_orders.affiliate_user_id` | `affiliate_accounts.user_id` | SET NULL |
| `commerce_orders.user_id` | `users.id` | CASCADE |
| `commerce_payment_logs.order_id` | `commerce_orders.id` | SET NULL |
| `commerce_payment_logs.payment_id` | `commerce_payments.id` | SET NULL |
| `commerce_payments.order_id` | `commerce_orders.id` | CASCADE |
| `commerce_shipments.order_id` | `commerce_orders.id` | CASCADE |
| `content_comments.approved_by` | `users.id` | SET NULL |
| `content_comments.author_user_id` | `users.id` | SET NULL |
| `general_products.owner_vendor_user_id` | `users.id` | SET NULL |
| `general_products.product_id` | `products.id` | CASCADE |
| `navigation_menu_items.menu_id` | `navigation_menus.id` | CASCADE |
| `notification_target_roles.notification_id` | `notifications.id` | CASCADE |
| `notification_target_users.notification_id` | `notifications.id` | CASCADE |
| `notification_target_users.user_id` | `users.id` | CASCADE |
| `notification_user_states.notification_id` | `notifications.id` | CASCADE |
| `notification_user_states.user_id` | `users.id` | CASCADE |
| `notifications.created_by_user_id` | `users.id` | SET NULL |
| `product_vendor_suppliers.approved_by` | `users.id` | SET NULL |
| `product_vendor_suppliers.product_id` | `products.id` | CASCADE |
| `product_vendor_suppliers.vendor_user_id` | `users.id` | CASCADE |
| `products.category_id` | `product_categories.id` | SET NULL |
| `shopping_cart_items.product_id` | `products.id` | CASCADE |
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
| `vendor_product_submission_events.actor_user_id` | `users.id` | SET NULL |
| `vendor_product_submission_events.submission_id` | `vendor_product_submissions.id` | CASCADE |
| `vendor_product_submissions.category_id` | `product_categories.id` | SET NULL |
| `vendor_product_submissions.linked_product_id` | `products.id` | SET NULL |
| `vendor_product_submissions.reviewed_by` | `users.id` | SET NULL |
| `vendor_product_submissions.vendor_user_id` | `users.id` | CASCADE |
| `vendor_product_supplier_requests.product_id` | `products.id` | CASCADE |
| `vendor_product_supplier_requests.reviewed_by` | `users.id` | SET NULL |
| `vendor_product_supplier_requests.vendor_user_id` | `users.id` | CASCADE |
| `wedding_sites.product_id` | `products.id` | SET NULL |
| `wedding_sites.user_id` | `users.id` | CASCADE |

## Refresh Commands

Use these commands when the runtime DB changes and this document needs a manual
refresh:

```bash
docker compose exec db psql -U app -d app -P pager=off -c \
  "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by table_name;"

docker compose exec db psql -U app -d app -P pager=off -c \
  "select tc.table_name, kcu.column_name, ccu.table_name as foreign_table_name, ccu.column_name as foreign_column_name, rc.delete_rule from information_schema.table_constraints tc join information_schema.key_column_usage kcu on tc.constraint_name=kcu.constraint_name and tc.table_schema=kcu.table_schema join information_schema.constraint_column_usage ccu on ccu.constraint_name=tc.constraint_name and ccu.table_schema=tc.table_schema join information_schema.referential_constraints rc on rc.constraint_name=tc.constraint_name and rc.constraint_schema=tc.table_schema where tc.constraint_type='FOREIGN KEY' and tc.table_schema='public' order by tc.table_name,kcu.column_name;"
```
