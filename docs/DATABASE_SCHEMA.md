# Database Schema

This document describes the tables the current code uses or expects.

## 1) Auto-created by `src/lib/db.ts`

These tables are created automatically on first query.

### `users`

- `id` (`BIGSERIAL`): primary key
- `username` (`TEXT`): unique login name
- `password_hash` (`TEXT`): scrypt hash
- `role` (`TEXT`): `admin` or `user`
- `created_at` (`TIMESTAMPTZ`)

Notes:

- Existing users with `NULL` role are migrated.
- Current migration sets old null roles to `admin`.

### `user_sessions`

- `id` (`TEXT`): primary key
- `user_id` (`BIGINT`): FK to `users.id`
- `token_hash` (`TEXT`): unique SHA-256 token hash
- `expires_at` (`TIMESTAMPTZ`)
- `created_at` (`TIMESTAMPTZ`)

Index:

- `user_sessions_token_hash_idx` on `token_hash`

### `user_settings`

- `user_id` (`BIGINT`): primary key, FK to `users.id`
- `ui_density` (`TEXT`): `small`, `medium`, or `large`
- `updated_at` (`TIMESTAMPTZ`)

### `user_profiles`

- `user_id` (`BIGINT`): primary key, FK to `users.id`
- `full_name` (`TEXT`)
- `display_name` (`TEXT`)
- `phone` (`TEXT`)
- `bio` (`TEXT`)
- `updated_at` (`TIMESTAMPTZ`)

### `user_oauth_accounts`

- `id` (`BIGSERIAL`): primary key
- `user_id` (`BIGINT`): FK to `users.id`
- `provider` (`TEXT`)
- `provider_user_id` (`TEXT`)
- `email` (`TEXT`)
- `created_at` (`TIMESTAMPTZ`)

Constraint:

- unique `(provider, provider_user_id)`

### `cms_pages`

- `id` (`BIGSERIAL`): primary key
- `slug` (`TEXT`): unique slug
- `name` (`TEXT`): internal/admin page name
- `title` (`TEXT`)
- `excerpt` (`TEXT`)
- `body` (`TEXT`)
- `status` (`TEXT`): typically `draft` or `published`
- `template` (`TEXT`)
- `seo_title` (`TEXT`)
- `seo_description` (`TEXT`)
- `seo_keywords` (`TEXT`)
- `canonical_url` (`TEXT`)
- `og_title` (`TEXT`)
- `og_description` (`TEXT`)
- `og_image` (`TEXT`)
- `noindex` (`BOOLEAN`)
- `nofollow` (`BOOLEAN`)
- `custom_fields` (`JSONB`)
- `created_at` (`TIMESTAMPTZ`)
- `updated_at` (`TIMESTAMPTZ`)

Notes:

- `src/lib/db.ts` seeds the built-in `home`, `login`, and `register` rows if missing.
- `custom_fields` is the backing store for template-specific fields.

### `cms_menus`

- `id` (`BIGSERIAL`): primary key
- `name` (`TEXT`): unique internal identifier such as `header` or `footer`
- `label` (`TEXT`): admin-facing display name
- `created_at` (`TIMESTAMPTZ`)
- `updated_at` (`TIMESTAMPTZ`)

### `cms_menu_items`

- `id` (`BIGSERIAL`): primary key
- `menu_id` (`BIGINT`): FK to `cms_menus.id`
- `label` (`TEXT`)
- `type` (`TEXT`): `page` or `custom`
- `page_slug` (`TEXT`, nullable)
- `url` (`TEXT`, nullable)
- `position` (`INT`)
- `created_at` (`TIMESTAMPTZ`)
- `updated_at` (`TIMESTAMPTZ`)

## 2) Non-database storage used by the project

The media library stores files outside PostgreSQL.

### Uploaded files

- Directory: `web/public/uploads/YYYY/MM`

### Media metadata

- File: `web/storage/media.json`

Stored metadata fields include:

- `id`
- `url`
- `fileName`
- `originalName`
- `mimeType`
- `sizeBytes`
- `createdAt`
