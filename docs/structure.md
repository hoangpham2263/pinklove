# Project Structure

This document describes the current repository structure and implemented feature areas.

## Current app structure

```text
web/
  src/
    app/
      layout.tsx
      globals.css
      (guest)/
        layout.tsx
        page.tsx
        checkout/
          page.tsx
          cart/page.tsx
          success/[orderNumber]/page.tsx
        (marketing)/
          about/page.tsx
          contact/page.tsx
          services/page.tsx
        (catalog)/
          builder/page.tsx
          builder/[slug]/page.tsx
          sites/[slug]/page.tsx
          templates/page.tsx
          templates/[slug]/page.tsx
        (content)/
          blog/page.tsx
          blog/[slug]/page.tsx
          blog/post/[slug]/page.tsx
      tools/
        page.tsx
        qr-builder/page.tsx
        wedding-budget/page.tsx
      admin/
        page.tsx
        (auth)/
          layout.tsx
          login/page.tsx
        (protected)/
          layout.tsx
          (overview)/
            dashboard/page.tsx
          (commerce)/
            orders/page.tsx
            orders/[id]/page.tsx
            payments/page.tsx
            shipments/page.tsx
          (content)/
            menus/page.tsx
            menus/[id]/page.tsx
            pages/page.tsx
            pages/[...slug]/page.tsx
            seo-guide/page.tsx
          (catalog)/
            products/page.tsx
            products/list/page.tsx
            products/[slug]/page.tsx
          (accounts)/
            affiliates/page.tsx
            affiliate-users/page.tsx
            affiliate-users/create/page.tsx
            customers/page.tsx
            customers/create/page.tsx
            users/page.tsx
            users/create/page.tsx
            users/[id]/page.tsx
            internal-accounts/page.tsx
            vendors/page.tsx
            vendors/create/page.tsx
          (system)/
            media/page.tsx
            config/page.tsx
            config/breadcrumbs/page.tsx
            config/permalinks/page.tsx
            config/sitemap/page.tsx
            config/commerce/page.tsx
      customer/
        page.tsx
        (auth)/
          layout.tsx
          login/page.tsx
          register/page.tsx
        (protected)/
          layout.tsx
          (workspace)/
            dashboard/page.tsx
            invitations/page.tsx
            invitations/[id]/page.tsx
            design/[id]/page.tsx
            orders/page.tsx
            orders/[id]/page.tsx
          (account)/
            profile/page.tsx
            settings/page.tsx
          (growth)/
            affiliate/page.tsx
            vendor/page.tsx
      (seo)/
        robots.txt/route.ts
        sitemap.xml/route.ts
        sitemap-pages.xml/route.ts
        sitemap-products.xml/route.ts
        sitemap-invitations.xml/route.ts
        sitemap-blog-categories.xml/route.ts
        sitemap-blog-posts.xml/route.ts
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
        customer/
          affiliate/apply/route.ts
          cart/add/route.ts
          cart/remove/route.ts
          cart/update/route.ts
          checkout/route.ts
          profile/route.ts
          invitations/create-builder/route.ts
          invitations/create-from-product/route.ts
          invitations/update/route.ts
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
        auth-page-loader.ts
        page-registry.ts
      media/
        components/
        server/
        types.ts
      pages/
        registry.ts
      invitations/
        builder/
        components/
        server/
      products/
        components/
        server/
        types.ts
      customer/components/
      commerce/
        server/
        types.ts
    lib/
      auth.ts
      cms.ts
      cms-fields.ts
      database.ts
      google-oauth.ts
      media.ts
      menu.ts
      routes.ts
      utils.ts
```

## High-level architecture

- The app is a monolithic Next.js application inside `web/`.
- Route handlers and Server Components call shared infra in `src/lib/*` and feature-owned server services in `src/features/*/server/*`.
- Database access is raw SQL through `src/lib/database.ts`.
- `database.ts` also performs limited auto-migrations and seed steps on first use.
- Media files are stored on disk, not in PostgreSQL.

## Public Guest Area

- The public website uses the `(guest)` route group.
- Public content pages are explicit route files in `src/app/(guest)`.
- Current public catalog flows:
  - `src/app/(guest)/(catalog)/templates/page.tsx`
  - `src/app/(guest)/(catalog)/templates/[slug]/page.tsx`
  - `src/app/(guest)/(catalog)/builder/page.tsx`
  - `src/app/(guest)/(catalog)/builder/[slug]/page.tsx`
- Public invitation rendering lives at `src/app/(guest)/(catalog)/invitations/[slug]/page.tsx`.

## Customer Area

- The customer shell lives under `src/app/customer`.
- Protected customer flows include dashboard, profile, settings, affiliate, orders, and site management.
- Customer invitation flows live at:
  - `src/app/customer/(protected)/(workspace)/invitations/page.tsx`
  - `src/app/customer/(protected)/(workspace)/invitations/[id]/page.tsx`
- Builder editing for customer-owned builder invitations lives at:
  - `src/app/customer/(protected)/(workspace)/design/[id]/page.tsx`

## Admin area

- The admin shell lives under `src/app/admin/(protected)`.
- Implemented admin sections include dashboard, users, pages, menus, media, affiliates, vendors, products, commerce operations, SEO, blog management, and config.
- Admin product management works at the catalog level, while order/payment/shipment operations live in the dedicated commerce section.

## Feature map

- `src/features/pages`: managed content page registry and schema
- `src/features/auth`: auth page fields, registry, and shared loader logic
- `src/features/media`: media library UI and server storage
- `src/features/affiliate`: affiliate flows for customer and admin
- `src/features/commerce`: cart, checkout, orders, payments, shipments, and entitlement services
- `src/features/products`: invitation catalog products
- `src/features/invitations`: per-customer invitation instances, renderers, and builder editor

## Current implementation notes

- Public content pages are code-managed routes, not admin-created arbitrary routes.
- Admin `Pages` edits only managed content and system pages already registered in code.
- `home`, `login`, and `register` are system managed pages seeded by `src/lib/database.ts`.
- The current builder editor does not support dragging/resizing element height yet.
- The current builder editor does not support grouping selected elements yet.
- Checkout, order creation, entitlement grant, and admin order/payment/shipment management are now implemented in-app.
- Commerce table foreign keys must remain compatible with environments that still use legacy numeric IDs on `users` or `products`.
