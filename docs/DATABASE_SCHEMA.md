# Database Schema

This document describes the PostgreSQL database tables used in the PinkLove project.

## 1) Core Identity & Sessions

### `users`
Stores the main user account information.
- `id` (BIGSERIAL): Primary key.
- `username` (TEXT): Unique login name.
- `password_hash` (TEXT): Hashed password (scrypt).
- `role` (TEXT): User role (`admin` or `user`). Default is `user`.
- `created_at` (TIMESTAMPTZ): Timestamp of account creation.

### `user_sessions`
Manages active login sessions.
- `id` (TEXT): Primary key (random UUID/ID).
- `user_id` (BIGINT): FK to `users.id`.
- `token_hash` (TEXT): Unique SHA-256 hash of the session token.
- `expires_at` (TIMESTAMPTZ): When the session becomes invalid.
- `created_at` (TIMESTAMPTZ): When the session was created.

### `user_oauth_accounts`
Links local users to external providers.
- `id` (BIGSERIAL): Primary key.
- `user_id` (BIGINT): FK to `users.id`.
- `provider` (TEXT): Provider name (e.g., `google`).
- `provider_user_id` (TEXT): Unique ID from the provider.
- `email` (TEXT): Verified email from the provider.
- `created_at` (TIMESTAMPTZ): When the link was established.

## 2) User Profile

### `user_profiles`
Extended profile information.
- `user_id` (BIGINT): Primary key, FK to `users.id`.
- `full_name` (TEXT): User's real name.
- `display_name` (TEXT): Publicly visible name.
- `phone` (TEXT): Contact number.
- `bio` (TEXT): Short biography.
- `updated_at` (TIMESTAMPTZ): Last update timestamp.

### `user_settings`
User-specific application settings.
- `user_id` (BIGINT): Primary key, FK to `users.id` (ON DELETE CASCADE).
- `ui_density` (TEXT): UI density preference (`small`, `medium`, `large`). Default is `medium`.
- `updated_at` (TIMESTAMPTZ): Last update timestamp.

## 3) CMS & Navigation

### `cms_pages`
Stores content for dynamic website pages.
- `id` (BIGSERIAL): Primary key.
- `slug` (TEXT): Unique URL identifier (e.g., `about-us`).
- `name` (TEXT): Internal label for admin.
- `title` (TEXT): Main page heading.
- `excerpt` (TEXT): Short summary.
- `body` (TEXT): Full page content (HTML/Markdown).
- `status` (TEXT): Visibility (`draft` or `published`).
- **SEO Fields:** `seo_title`, `seo_description`, `seo_keywords`, `canonical_url`.
- **Open Graph:** `og_title`, `og_description`, `og_image`.
- **Indexing:** `noindex`, `nofollow` (BOOLEAN).
- `custom_fields` (JSONB): Dynamic page template properties (similar to ACF).
- `created_at`, `updated_at` (TIMESTAMPTZ).

### `cms_menus`
Defines navigation menu containers (Header, Footer, etc.).
- `id` (BIGSERIAL): Primary key.
- `name` (TEXT): Unique system identifier (e.g., `header`).
- `label` (TEXT): Display name for admin.
- `created_at`, `updated_at` (TIMESTAMPTZ).

### `cms_menu_items`
Individual links within a menu.
- `id` (BIGSERIAL): Primary key.
- `menu_id` (BIGINT): FK to `cms_menus.id`.
- `label` (TEXT): Link text visible to users.
- `type` (TEXT): Link source (`page` or `custom`).
- `page_slug` (TEXT): Slug of the linked CMS page (if type is `page`).
- `url` (TEXT): Manual URL (if type is `custom`).
- `position` (INT): Sorting order.
- `created_at`, `updated_at` (TIMESTAMPTZ).

## 4) System Configuration

### `app_settings`
Global website configuration.
- `id` (INTEGER): Primary key, restricted to `1` (single row).
- `theme` (TEXT): Global theme preset (`pink`, `black`).
- `updated_at` (TIMESTAMPTZ).
