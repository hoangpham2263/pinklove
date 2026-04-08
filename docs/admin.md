# Admin Convention

This file covers the admin area and admin-controlled workflows.

## Scope

- `src/app/(admin)/admin/*`
- `src/app/api/admin/*`
- `src/features/admin/*`

## Rules

- Non-admin users must not access the admin area.
- The admin shell lives under `src/app/(admin)/admin/(protected)`.
- Admin `Pages` edits only managed content and system pages already registered in code.
- Admin product flows operate on catalog entries in `products`, not on orders or entitlements.
- Menu management expects `cms_menus` and `cms_menu_items`.
- Current public client navigation is still hardcoded even though menu management exists in admin.

## Current admin sections

- dashboard
- user management
- pages
- menus
- media
- affiliates
- products
- settings
