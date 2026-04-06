# Project Structure and Current Features

This document describes the project as it exists now in the repository.

## 1) Current app structure

```text
web/
  src/
    app/
      layout.tsx
      globals.css
      (client)/
        layout.tsx
        [[...slug]]/page.tsx
      (admin)/
        admin/
          page.tsx
          (auth)/
            layout.tsx
            login/page.tsx
          (protected)/
            layout.tsx
            dashboard/page.tsx
            media/page.tsx
            menus/page.tsx
            menus/[id]/page.tsx
            pages/page.tsx
            pages/[slug]/page.tsx
            settings/page.tsx
            user/page.tsx
            user/[id]/page.tsx
      (user)/
        user/
          page.tsx
          (auth)/
            layout.tsx
            login/page.tsx
            register/page.tsx
          (protected)/
            layout.tsx
            dashboard/page.tsx
            profile/page.tsx
            settings/page.tsx
      api/
        admin/
          auth/login/route.ts
          menus/update/route.ts
          pages/{create,delete,update}/route.ts
          users/{create,delete,role,update}/route.ts
        auth/
          login/route.ts
          logout/route.ts
          register/route.ts
          google/{login,callback}/route.ts
        media/route.ts
        settings/ui-density/route.ts
        user/profile/route.ts
    components/
      common/
      ui/
    features/
      admin/components/
      auth/components/
      client/
        PageRenderer.tsx
        templates/
      media/
        components/
        server/
        types.ts
      user/components/
    lib/
      auth.ts
      cms.ts
      db.ts
      google-oauth.ts
      system-pages.ts
      menu.ts
      routes.ts
      utils.ts
```

## 2) High-level architecture

- The app is a monolithic Next.js application inside `web/`.
- Route handlers and server components call helpers in `src/lib/*`.
- Database access is raw SQL through `src/lib/db.ts`.
- `db.ts` also performs a limited set of auto-migrations on first use.
- Media files are stored on disk, not in PostgreSQL.

## 2.1) Structure review

Overall, the repository is reasonably organized for its current size:

- `src/app` contains routing, layouts, and API entry points
- `src/features` contains feature-specific UI and behavior
- `src/lib` contains shared server/helpers and low-level app services
- `src/components` contains shared UI building blocks

The main structure is good enough to keep, but it is not fully normalized yet.

Current cleanup opportunities:

- There is still some route naming asymmetry such as singular `user` and `page` path segments alongside plural `users` and `pages` API groups.
- Some areas are placeholders rather than full features, especially admin settings and parts of the user area.
- There are a few leftover empty directories under `src/app/api`, such as `admin/settings/theme` and `api/test-url`, which make the route tree look more complete than it really is.
- Menu persistence lives in `src/lib/menu.ts`, but the underlying menu tables are still not auto-created by `src/lib/db.ts`.
- The public shell still uses hardcoded navigation links even though menu management exists in admin.

## 3) Public site

- The public website uses the `(client)` route group.
- Public page rendering is handled by `src/app/(client)/[[...slug]]/page.tsx`.
- Missing slug resolves to `home` through `normalizeSlug()` in `src/lib/cms.ts`.
- Only pages with `status = 'published'` render publicly.
- `PageRenderer` selects a template from `src/features/client/templates`.

### Current public templates

- `default`
- `home`
- `about`
- `contact`

### System pages

These slugs are treated specially in admin:

- `home`
- `login`
- `register`

`home`, `login`, and `register` are guaranteed system pages. The CMS layer auto-creates them in the database if they are missing.

`login` and `register` are editable CMS-backed system pages, but they are rendered by dedicated auth page components instead of `PageRenderer`.

## 4) Authentication and authorization

- Local username/password authentication is implemented.
- Sessions use the httpOnly cookie `pinklove_session`.
- Passwords are hashed with `scrypt`.
- Google OAuth is implemented through:
  - `src/app/api/auth/google/login/route.ts`
  - `src/app/api/auth/google/callback/route.ts`
- Roles:
  - `admin`
  - `user`
- Main guards:
  - `requireUser()`
  - `requireAdmin()`
  - `requireAppUser()`

### Important current behavior

- The first registered account becomes `admin`.
- Admins are allowed to access public pages and user pages, including `/user/login` and `/user/register`.
- The normal `/user/login` and `/user/register` flows redirect only logged-in non-admin users back to the user dashboard.
- The `/admin/login` flow rejects non-admins.
- Google OAuth currently signs users into the normal user area only.

## 5) Admin area

The admin shell lives under `src/app/(admin)/admin/(protected)`.

### Implemented admin sections

- Dashboard
  - Present, but mostly placeholder UI/cards.
- Users
  - List users
  - Create users
  - Edit username, password, role, and profile fields
  - Delete users
  - Prevent deleting yourself
  - Prevent removing the last admin
- Pages
  - List CMS pages
  - Quick-create page
  - Edit body, excerpt, SEO metadata, Open Graph data
  - Edit template-specific custom fields
  - Delete non-protected pages
- Menus
  - List menus
  - Edit menu label and items
  - Support `page` and `custom` menu items
- Media
  - Upload images
  - Preview images
  - Delete images
  - Copy asset URLs
- Settings
  - Page exists, but currently only displays static explanatory content

### Important current limitations

- Admin settings do not currently expose working runtime configuration.
- Menu management code exists, but menu tables are not auto-created by `src/lib/db.ts`.
- The route tree still contains a few leftover empty API directories that should eventually be removed or implemented.

## 6) User area

The user shell lives under `src/app/(user)/user/(protected)`.

### Current user features

- Dashboard page exists but is effectively empty.
- Profile page is implemented and saves:
  - `fullName`
  - `displayName`
  - `phone`
  - `bio`
- Settings page exists but is effectively empty.

### Important current behavior

- `/api/user/profile` rejects admins.
- There is a UI-density API route, but it currently only allows admins and is not wired into the UI shells.
- Route naming inside the user/admin areas is functional but not fully normalized yet.

## 7) CMS

CMS page data is stored in `cms_pages`.

The CMS layer ensures these built-in system pages exist before list/read operations:

- `home`
- `login`
- `register`

### Current page fields

- `slug`
- `name`
- `title`
- `excerpt`
- `body`
- `status`
- `template`
- SEO metadata
- Open Graph metadata
- `noindex`
- `nofollow`
- `custom_fields` JSONB

### Template custom fields

Template-specific fields are defined in `src/features/client/templates/index.ts` and rendered automatically in the admin page editor.

Examples:

- `home`: hero title, descriptions, CTA labels/links
- `about`: banner image, intro heading/text
- `contact`: email, phone, address, Google Maps embed URL
- `login` and `register`: heading, subheading, side image, quote content

## 8) Menus

Menu code expects:

- `cms_menus`
- `cms_menu_items`

Current code supports:

- listing menus
- editing one menu by id
- replacing all menu items on save

Important current state:

- The public client layout still uses hardcoded `Home`, `About Us`, and `Contact` links.
- Menu data is currently used by admin tooling, but not rendered in the public shell.
- `src/lib/db.ts` does not currently auto-create menu tables.

## 9) Media storage

Media is stored locally:

- Files: `web/public/uploads/YYYY/MM/*`
- Metadata: `web/storage/media.json`

Supported upload types:

- JPEG
- PNG
- WEBP
- GIF

Current size limit:

- `5MB` per file

Important current behavior:

- The UI exposes page-size controls and pagination state.
- The current `/api/media` GET handler returns all items and does not implement server-side pagination yet.

## 10) Database bootstrap

`src/lib/db.ts` currently auto-creates or migrates:

- `users`
- `user_sessions`
- `user_settings`
- `user_profiles`
- `user_oauth_accounts`
- `cms_pages`

It does not currently auto-create:

- `cms_menus`
- `cms_menu_items`

## 11) Runtime and startup

- Development stack is defined in `docker-compose.yml`.
- Production-style stack is defined in `docker-compose.prod.yml`.
- The helper script is `./setup`.

### Development defaults from the repo

- `WEB_PORT=3000` in `.env.example`
- `POSTGRES_PORT=5433` in `.env.example`

### Container behavior

- Dev web container runs `npm ci` automatically when `package-lock.json` changes.
- Dev app runs on container port `3000`.
- Dev stack bind-mounts `./web` into `/app`.
- Dev stack does not keep a dedicated `/app/.next` volume.
- Production build uses Next.js `output: "standalone"`.

## 12) Recommended structural direction

If the project is cleaned up further, the best next steps are:

- remove empty route directories that no longer have handlers
- normalize naming between page routes and API groups where practical
- either wire menu data into the public shell or clearly keep it as admin-only tooling
- either implement the settings area or keep it explicitly documented as placeholder-only

None of those are blockers for the current codebase, but they are the main places where the structure still feels partially transitional.
