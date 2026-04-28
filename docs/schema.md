# Database Schema

This document describes the tables the current code uses or expects.

## Important compatibility note

- The current bootstrap code in `src/lib/database.ts` creates new tables with `text` primary keys using `app_random_id()`.
- Some existing environments may still contain older `bigserial` and `bigint` IDs from an earlier schema version.
- When changing queries, write them defensively so they do not assume every environment already uses the new text-based IDs.

## Auto-created by `src/lib/database.ts`

### `users`

- `id`: `text` in the current bootstrap, may be `bigserial` in older databases
- `username`: `text`, unique
- `password_hash`: `text`
- `role`: `text`, one of `ADMIN`, `CUSTOMER`, `AFFILIATE`, or `VENDOR`
- `wishlist_product_ids`: `jsonb`, ordered list of favorited `products.id` values stored as strings
- `created_at`: `timestamptz`

### `user_sessions`

- `id`: `text`
- `user_id`: FK to `users.id`
- `token_hash`: `text`, unique
- `expires_at`: `timestamptz`
- `created_at`: `timestamptz`

Index:

- `user_sessions_token_hash_idx` on `token_hash`

### `user_settings`

- `user_id`: PK and FK to `users.id`
- `ui_density`: `text`, `small`, `medium`, or `large`
- `updated_at`: `timestamptz`

### `notifications`

- `id`: `text`
- `title`: `text`
- `body`: `text`
- `link_url`: `text`, optional internal destination opened from the notice
- `audience_type`: `text`, one of `all`, `role`, or `users`
- `created_by_user_id`: nullable FK to `users.id`
- `status`: `text`, one of `draft`, `scheduled`, `sent`, or `archived`
- `scheduled_at`: nullable `timestamptz`, future send time for scheduled notices
- `metadata`: `jsonb`
- `created_at`: `timestamptz`
- `updated_at`: `timestamptz`

Related notification tables:

- `notification_target_roles`: target roles for role-scoped notices
- `notification_target_users`: target user ids for personal notices
- `notification_user_states`: per-user read/dismissed state for every visible notice

Notes:

- All-role and role notices do not fan out rows per user at creation time; visibility is resolved at read time and read state is stored separately.
- Notification realtime uses the shared `app_realtime` channel with a per-user resource id.
- Scheduled notices stay hidden until they are promoted to `sent`; user inbox API calls and admin management refreshes publish due scheduled rows and emit realtime notices.

### `app_settings`

- `id`: `integer`, fixed to row `1`
- `theme`: `text`
- `seo_permalink`: `jsonb`
- `seo_breadcrumb`: `jsonb`
- `seo_sitemap`: `jsonb`
- `seo_indexing`: `jsonb`
- `seo_branding`: `jsonb`
- `seo_opengraph`: `jsonb`
- `seo_favicon`: `jsonb`
- `global_fields_config`: `jsonb`
- `commerce_config`: `jsonb`
- `internal_api_config`: `jsonb`
- `email_config`: `jsonb`
- `updated_at`: `timestamptz`

Notes:

- Currently used for centralized SEO/system settings such as permalink, breadcrumb, and sitemap config.
- Also stores site-wide indexing / robots settings.
- Also stores whole-site shared global fields in `global_fields_config`.
- Also stores reusable email sender settings in `email_config`.

### `internal_accounts`

- `id`: `text`
- `platform`: `text`
- `label`: `text`
- `login_username`: `text`
- `login_password`: `text`
- `login_url`: `text`
- `notes`: `text`
- `sort_order`: `int`
- `created_at`: `timestamptz`
- `updated_at`: `timestamptz`

### `user_profiles`

- `user_id`: PK and FK to `users.id`
- `full_name`: `text`
- `display_name`: `text`
- `phone`: `text`
- `bio`: `text`
- `updated_at`: `timestamptz`

### `user_addresses`

- `id`: `text`
- `user_id`: FK to `users.id`
- `label`: `text`
- `recipient_name`: `text`
- `phone`: `text`
- `line1`, `line2`, `ward`, `district`, `city`, `postal_code`, `country`: address fields
- `is_default`: `boolean`; only one default address per user
- `created_at`: `timestamptz`
- `updated_at`: `timestamptz`

Indexes:

- `user_addresses_user_id_idx` on `(user_id, is_default DESC, updated_at DESC)`
- `user_addresses_one_default_uidx` unique partial index on `user_id` where `is_default = true`

### `user_oauth_accounts`

- `id`: `text` in current bootstrap, may be numeric in older databases
- `user_id`: FK to `users.id`
- `provider`: `text`
- `provider_user_id`: `text`
- `email`: `text`
- `created_at`: `timestamptz`

Constraint:

- unique `(provider, provider_user_id)`

### `managed_pages`

- `id`: `text` in current bootstrap, may be numeric in older databases
- `slug`: `text`, unique
- `name`: `text`
- `title`: `text`
- `excerpt`: `text`
- `body`: `text`
- `status`: `text`
- `template`: `text`
- `seo_title`: `text`
- `seo_description`: `text`
- `seo_keywords`: `text`
- `canonical_url`: `text`
- `permalink`: `text`, unique
- `breadcrumb_title`: `text`
- `breadcrumb_parent_slug`: `text`
- `og_title`: `text`
- `og_description`: `text`
- `og_image`: `text`
- `noindex`: `boolean`
- `nofollow`: `boolean`
- `custom_fields`: `jsonb`
- `created_at`: `timestamptz`
- `updated_at`: `timestamptz`

Notes:

- `src/lib/database.ts` seeds the built-in `home`, `login`, and `register` rows if missing.

### `navigation_menus`

- `id`: `text` in current bootstrap, may be numeric in older databases
- `name`: `text`, unique
- `label`: `text`
- `created_at`: `timestamptz`
- `updated_at`: `timestamptz`

### `navigation_menu_items`

- `id`: `text` in current bootstrap, may be numeric in older databases
- `menu_id`: FK to `navigation_menus.id`
- `label`: `text`
- `type`: `text`, `page` or `custom`
- `page_slug`: `text`, nullable
- `url`: `text`, nullable
- `position`: `int`
- `created_at`: `timestamptz`
- `updated_at`: `timestamptz`

### `affiliate_accounts`

- `user_id`: PK and FK to `users.id`
- `code`: `text`, unique
- `status`: `text`, `pending`, `active`, `rejected`, or `blocked`
- `commission_type`: `text`, `percent` or `fixed`
- `commission_value`: `numeric(12,2)`
- `notes`: `text`, nullable
- `approved_by`: FK to `users.id`, nullable
- `approved_at`: `timestamptz`, nullable
- `created_at`: `timestamptz`
- `updated_at`: `timestamptz`

### `affiliate_clicks`

- `id`: `text` in current bootstrap, may be numeric in older databases
- `affiliate_user_id`: FK to `affiliate_accounts.user_id`
- `affiliate_code`: `text`
- `landing_path`: `text`
- `referrer`: `text`, nullable
- `visitor_token`: `text`, nullable
- `user_agent`: `text`, nullable
- `created_at`: `timestamptz`

Index:

- `affiliate_clicks_affiliate_user_id_idx` on `affiliate_user_id`

### `affiliate_conversions`

- `id`: `text` in current bootstrap, may be numeric in older databases
- `affiliate_user_id`: FK to `affiliate_accounts.user_id`
- `affiliate_code`: `text`
- `external_order_ref`: `text`, nullable, unique
- `order_value`: `numeric(12,2)`
- `commission_amount`: `numeric(12,2)`
- `status`: `text`, `pending`, `approved`, `rejected`, or `paid`
- `metadata`: `jsonb`
- `created_at`: `timestamptz`
- `updated_at`: `timestamptz`

### `products`

- `id`: `text` in current bootstrap, may be numeric in older databases
- `slug`: `text`, unique
- `name`: `text`
- `excerpt`: `text`, nullable
- `description`: `text`, nullable
- `status`: `text`, `draft` or `published`
- `product_type`: `text`, `coded_template` or `builder_template`
- `template_key`: `text`
- `thumbnail_url`: `text`, nullable
- `price`: `numeric(12,2)`
- `config`: `jsonb`
- `created_at`: `timestamptz`
- `updated_at`: `timestamptz`

Business rule:

- Each `(product_type, template_key)` pair should map to exactly one catalog product. In practice this means one coded template source has one product gốc, and one builder starter source has one product gốc.

### `wedding_sites`

Current business meaning: invitation instances created by users and published at `/invitations/[slug]`.

Business rule:

- A `wedding_site` is a customer-specific copy created from a catalog product or from the system blank builder flow. It is not itself the catalog product.

- `id`: `text` in current bootstrap, may be numeric in older databases
- `user_id`: FK to `users.id`
- `product_id`: FK to `products.id`, nullable
- `title`: `text`
- `slug`: `text`, unique
- `site_type`: `text`, `coded_template` or `builder_template`
- `template_key`: `text`
- `status`: `text`, `draft` or `published`
- `custom_data`: `jsonb`
- `created_at`: `timestamptz`
- `updated_at`: `timestamptz`

Index:

- `wedding_sites_user_id_idx` on `user_id`

### Ecommerce tables

- `shopping_cart_items`
  - `id`: `text`
  - `user_id`: matches the live SQL type of `users.id`
  - `product_id`: matches the live SQL type of `products.id`
  - `quantity`: `int`
  - `metadata`: `jsonb`
  - `created_at`: `timestamptz`
  - `updated_at`: `timestamptz`
- `commerce_orders`
  - `id`: `text`
  - `order_number`: `text`, unique
  - `user_id`: matches the live SQL type of `users.id`
  - `status`: `text`
  - `payment_status`: `text`
  - `fulfillment_status`: `text`
  - customer, shipping, pricing, affiliate, and metadata fields are stored inline on the order row
  - `affiliate_user_id`: matches the live SQL type of `affiliate_accounts.user_id`
  - `created_at`: `timestamptz`
  - `updated_at`: `timestamptz`
- `commerce_order_items`
  - `id`: `text`
  - `order_id`: FK to `commerce_orders.id`
  - `product_id`: matches the live SQL type of `products.id`, nullable
  - product snapshot fields and pricing are stored per line item
- `commerce_payments`
  - `id`: `text`
  - `order_id`: FK to `commerce_orders.id`
  - `method`: `text`
  - `provider`: `text`, copied from the admin payment method configuration at order creation time
  - `amount`: `numeric(12,2)`
  - `status`: `text`
  - `external_ref`: `text`, nullable
  - `metadata`: `jsonb`
- `commerce_shipments`
  - `id`: `text`
  - `order_id`: FK to `commerce_orders.id`, unique
  - `carrier`: `text`
  - `tracking_number`: `text`
  - `status`: `text`
  - `notes`: `text`
  - `metadata`: `jsonb`
- `commerce_entitlements`
  - `id`: `text`
  - `user_id`: matches the live SQL type of `users.id`
  - `product_id`: matches the live SQL type of `products.id`
  - `order_id`: FK to `commerce_orders.id`
  - `order_item_id`: FK to `commerce_order_items.id`, nullable
  - `status`: `text`
  - `metadata`: `jsonb`

Compatibility note:

- The ecommerce bootstrap derives the SQL type for `users.id`, `products.id`, and `affiliate_accounts.user_id` from the live database before creating the legacy `commerce_*` tables.

### Ecommerce settings storage

- `app_settings.commerce_config`: `jsonb`
  - `enabled`: global checkout toggle
  - currency, shipping, bank transfer, and cash instruction settings
  - `paymentMethods`: ordered array of admin-managed payment method configs
    - `code`: stable checkout/payment method identifier
    - `label`: customer-facing label
    - `description`: checkout description
    - `instructions`: post-selection or post-order guidance
    - `enabled`: availability toggle
    - `provider`: gateway/provider identifier copied into `commerce_payments.provider`
    - `type`: `manual`, `offline`, `redirect`, `embedded`, or `mock`
    - `requiresShipping`: `true`, `false`, or `null`
    - method-specific instructions and optional bank/VietQR account fields for manual payment methods

### Email settings storage

- `app_settings.email_config`: `jsonb`
  - `enabled`: global email sending toggle
  - `transport`: `log` for demo/local logging or `smtp` for SMTP delivery
  - `fromName`, `fromEmail`, and optional `replyTo`: default sender identity
  - `smtpHost`, `smtpPort`, `smtpSecure`, `smtpUsername`, `smtpPassword`: SMTP transport fields
  - `demoRecipient`: default recipient used by the admin email demo card

Email template rendering:

- Shared shortcode rendering lives in `src/lib/email-template.ts`.
- The admin email demo supports raw HTML, plain text fallback, preview rendering, and click-to-copy shortcode tokens.

## Non-database storage

### Uploaded files

- Directory: `web/public/uploads/YYYY/MM`

### Media metadata

- File: `web/storage/media.json`
