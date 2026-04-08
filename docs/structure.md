# Project Structure

This document describes the current repository structure and implemented feature areas.

## Current app structure

```text
web/
  src/
    app/
      layout.tsx
      globals.css
      (client)/
        layout.tsx
        page.tsx
        about-us/page.tsx
        builder/page.tsx
        builder/[slug]/page.tsx
        contact/page.tsx
        templates/page.tsx
        templates/[slug]/page.tsx
        w/[slug]/page.tsx
      (admin)/
        admin/
          page.tsx
          (auth)/
            layout.tsx
            login/page.tsx
          (protected)/
            layout.tsx
            dashboard/page.tsx
            affiliates/page.tsx
            media/page.tsx
            menus/page.tsx
            menus/[id]/page.tsx
            pages/page.tsx
            pages/[slug]/page.tsx
            products/page.tsx
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
            affiliate/page.tsx
            dashboard/page.tsx
            profile/page.tsx
            settings/page.tsx
            sites/page.tsx
            sites/[id]/page.tsx
      (designer)/
        user/
          design/[id]/page.tsx
      api/
        admin/
          affiliates/update/route.ts
          auth/login/route.ts
          menus/update/route.ts
          pages/update/route.ts
          products/{create,delete,update}/route.ts
          users/{create,delete,role,update}/route.ts
        affiliate/track/route.ts
        auth/
          google/{callback,login}/route.ts
          login/route.ts
          logout/route.ts
          register/route.ts
        media/route.ts
        user/
          affiliate/apply/route.ts
          profile/route.ts
          sites/create-builder/route.ts
          sites/create-from-product/route.ts
          sites/update/route.ts
    components/
      common/
      ui/
    features/
      admin/components/
      affiliate/
        components/
        server/
      auth/
        components/
        fields.ts
        page-loader.ts
        page-registry.ts
      media/
        components/
        server/
        types.ts
      pages/
        registry.ts
        schema.ts
      products/
        components/
        server/
        types.ts
      sites/
        builder/
        components/
        server/
        templates/
        types.ts
      user/components/
    lib/
      auth.ts
      cms.ts
      cms-fields.ts
      db.ts
      google-oauth.ts
      media.ts
      menu.ts
      routes.ts
      utils.ts
```

## High-level architecture

- The app is a monolithic Next.js application inside `web/`.
- Route handlers and Server Components call shared infra in `src/lib/*` and feature-owned server services in `src/features/*/server/*`.
- Database access is raw SQL through `src/lib/db.ts`.
- `db.ts` also performs limited auto-migrations and seed steps on first use.
- Media files are stored on disk, not in PostgreSQL.

## Public client area

- The public website uses the `(client)` route group.
- Public content pages are explicit route files in `src/app/(client)`.
- Current public catalog flows:
  - `src/app/(client)/templates/page.tsx`
  - `src/app/(client)/templates/[slug]/page.tsx`
  - `src/app/(client)/builder/page.tsx`
  - `src/app/(client)/builder/[slug]/page.tsx`
- Public invitation rendering lives at `src/app/(client)/w/[slug]/page.tsx`.

## User area

- The user shell lives under `src/app/(user)/user`.
- Protected user flows include dashboard, profile, settings, affiliate, and site management.
- User site flows live at:
  - `src/app/(user)/user/(protected)/sites/page.tsx`
  - `src/app/(user)/user/(protected)/sites/[id]/page.tsx`
- Builder editing for user-owned builder sites is handled in the dedicated designer route:
  - `src/app/(designer)/user/design/[id]/page.tsx`

## Admin area

- The admin shell lives under `src/app/(admin)/admin/(protected)`.
- Implemented admin sections include dashboard, users, pages, menus, media, affiliates, products, and settings.
- Admin product management works at the catalog level, not at a commerce or entitlement level.

## Feature map

- `src/features/pages`: managed content page registry and schema
- `src/features/auth`: auth page fields, registry, and shared loader logic
- `src/features/media`: media library UI and server storage
- `src/features/affiliate`: affiliate flows for user and admin
- `src/features/products`: wedding invitation catalog products
- `src/features/sites`: per-user wedding site instances, renderers, and builder editor

## Current implementation notes

- Public content pages are code-managed routes, not admin-created arbitrary routes.
- Admin `Pages` edits only managed content and system pages already registered in code.
- `home`, `login`, and `register` are system CMS pages seeded by `src/lib/db.ts`.
- The current builder editor does not support dragging/resizing element height yet.
- The current builder editor does not support grouping selected elements yet.
- Checkout, order completion, affiliate conversion settlement, and payout settlement are intentionally not implemented yet.
