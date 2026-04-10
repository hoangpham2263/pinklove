# Database Schema

This document describes the tables the current code uses or expects.

## Important compatibility note

- The current bootstrap code in `src/lib/db.ts` creates new tables with `text` primary keys using `app_random_id()`.
- Some existing environments may still contain older `bigserial` and `bigint` IDs from an earlier schema version.
- When changing queries, write them defensively so they do not assume every environment already uses the new text-based IDs.

## Auto-created by `src/lib/db.ts`

### `users`

- `id`: `text` in the current bootstrap, may be `bigserial` in older databases
- `username`: `text`, unique
- `password_hash`: `text`
- `role`: `text`, `admin` or `user`
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

### `app_settings`

- `key`: `text`, primary key
- `value`: `jsonb`
- `updated_at`: `timestamptz`

Notes:

- Currently used for centralized SEO/system settings such as permalink, breadcrumb, and sitemap config.
- Also stores site-wide indexing / robots settings.

### `user_profiles`

- `user_id`: PK and FK to `users.id`
- `full_name`: `text`
- `display_name`: `text`
- `phone`: `text`
- `bio`: `text`
- `updated_at`: `timestamptz`

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

- `src/lib/db.ts` seeds the built-in `home`, `login`, and `register` rows if missing.

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

### `wedding_sites`

Current business meaning: invitation instances created by users and published at `/invitations/[slug]`.

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

## Non-database storage

### Uploaded files

- Directory: `web/public/uploads/YYYY/MM`

### Media metadata

- File: `web/storage/media.json`
