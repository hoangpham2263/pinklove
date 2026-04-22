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
          wishlist/page.tsx
          builder/page.tsx
          builder/[slug]/page.tsx
          sites/[slug]/page.tsx
          templates/page.tsx
          templates/[slug]/page.tsx
        (content)/
          blog/page.tsx
          search/page.tsx
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
          (ecommerce)/
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
            vendors/[id]/page.tsx
          (system)/
            global-fields/page.tsx
            media/page.tsx
            config/page.tsx
            config/branding/page.tsx
            config/breadcrumbs/page.tsx
            config/favicon/page.tsx
            config/permalinks/page.tsx
            config/opengraph/page.tsx
            config/sitemap/page.tsx
            config/ecommerce/page.tsx
            config/email/page.tsx
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
      partner/
        page.tsx
        [slug]/page.tsx
        (auth)/
          layout.tsx
          login/page.tsx
        (protected)/
          layout.tsx
          (workspace)/
            dashboard/page.tsx
            orders/page.tsx
            orders/[id]/page.tsx
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
          orders/vendor-assignment/route.ts
          global-fields/update/route.ts
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
          checkout/route.ts
          wishlist/route.ts
          profile/route.ts
          invitations/create-builder/route.ts
          invitations/create-from-product/route.ts
          invitations/update/route.ts
        partner/
          auth/login/route.ts
          orders/update/route.ts
    components/
      common/
      ui/
    features/
      admin/
        components/
        config/
        layout/
      affiliate/
        components/
        server/
      global-fields/
        admin/
        schema.ts
      auth/
        components/
        fields.ts
        auth-page-loader.ts
        page-registry.ts
      blog/
        admin/
        components/
        server/
        types.ts
      customer/components/
      ecommerce/
        server/
        types.ts
      invitations/
        builder/
        components/
        server/
      media/
        components/
        server/
        types.ts
      pages/
        admin/
        config/
        registry.ts
        schema.ts
      products/
        admin/
        components/
        server/
        types.ts
      search/
        server/
      website-hooks/
        catalog.ts
    lib/
      auth.ts
      action-response.ts
      client-mutation.ts
      currency.ts
      database.ts
      global-fields.ts
      google-oauth.ts
      internal-accounts.ts
      managed-pages.ts
      media-resolver.ts
      menu.ts
      navigation.ts
      page-fields.ts
      page-paths.ts
      public-paths.ts
      rich-text.ts
      robots.ts
      routes.ts
      roles.ts
      seo.ts
      sitemap.ts
      status-labels.ts
      system-settings.ts
      utils.ts
```

## High-level architecture

- The app is a monolithic Next.js application inside `web/`.
- Route handlers and Server Components call shared infra in `src/lib/*` and feature-owned server services in `src/features/*/server/*`.
- Database access is raw SQL through `src/lib/database.ts`.
- `database.ts` also performs limited auto-migrations and seed steps on first use.
- Media files are stored on disk, not in PostgreSQL.
- Shared custom-field architecture uses code-registered schemas.
  Managed-page field schemas live under `src/features/pages/*`.
  Whole-site global field schemas live under `src/features/global-fields/*`.

## Public Guest Area

- The public website uses the `(guest)` route group.
- Public content pages are explicit route files in `src/app/(guest)`.
- Current public catalog flows:
  - `src/app/(guest)/(catalog)/wishlist/page.tsx`
  - `src/app/(guest)/(catalog)/templates/page.tsx`
  - `src/app/(guest)/(catalog)/templates/[slug]/page.tsx`
  - `src/app/(guest)/(catalog)/builder/page.tsx`
  - `src/app/(guest)/(catalog)/builder/[slug]/page.tsx`
- Public content search lives at `src/app/(guest)/(content)/search/page.tsx`.
- Public invitation rendering lives at `src/app/(guest)/(catalog)/invitations/[slug]/page.tsx`.

## Customer Area

- The customer shell lives under `src/app/customer`.
- Protected customer flows include dashboard, profile, settings, affiliate, orders, and site management.
- Customer invitation flows live at:
  - `src/app/customer/(protected)/(workspace)/invitations/page.tsx`
  - `src/app/customer/(protected)/(workspace)/invitations/[id]/page.tsx`
- Builder editing for customer-owned builder invitations lives at:
  - `src/app/customer/(protected)/(workspace)/design/[id]/page.tsx`

## Partner Area

- The partner shell lives under `src/app/partner`.
- `src/app/partner/[slug]/page.tsx` is the canonical vendor portal route:
  - signed out: landing + login
  - signed in as that vendor: assigned-order working surface
- `src/app/partner/(protected)/(workspace)/orders/[id]/page.tsx` serves the public URL `/partner/orders/[id]` for per-assignment collaboration detail.
- `src/app/partner/dashboard/page.tsx` and `src/app/partner/orders/page.tsx` are legacy redirect-only aliases back to the canonical vendor portal route.

## Admin area

- The admin shell lives under `src/app/admin/(protected)`.
- Implemented admin sections include dashboard, users, pages, menus, media, affiliates, vendors, products, ecommerce operations, SEO, blog management, and config.
- Admin product management works at the catalog level, while order/payment/shipment operations live in the dedicated ecommerce section.

## Feature map

- `src/features/admin`: shared admin shell layout, navigation, route metadata, and admin-only modules that are not owned by a business domain
- `src/features/pages`: managed content page registry, managed-page config, and admin page editing UI
- `src/features/auth`: auth page fields, registry, and shared loader logic
- `src/features/blog`: public blog renderers/services plus admin blog forms
- `src/features/media`: media library UI and server storage
- `src/features/affiliate`: affiliate flows for customer and admin
- `src/features/ecommerce`: wishlist-backed checkout, orders, payments, shipments, and entitlement services
- `src/features/products`: invitation catalog products plus admin product/category management UI
- `src/features/invitations`: per-customer invitation instances, renderers, and builder editor
- `src/features/search`: guest-facing search services and result aggregation
- `src/features/website-hooks`: outbound website integration/webhook inventory surfaced in admin

## Current implementation notes

- Public content pages are code-managed routes, not admin-created arbitrary routes.
- Admin `Pages` edits only managed content and system pages already registered in code.
- `home`, `login`, and `register` are system managed pages seeded by `src/lib/database.ts`.
- The current builder editor does not support dragging/resizing element height yet.
- The current builder editor does not support grouping selected elements yet.
- Checkout, order creation, entitlement grant, and admin order/payment/shipment management are now implemented in-app.
- Ecommerce table foreign keys must remain compatible with environments that still use legacy numeric IDs on `users` or `products`.
  The persisted SQL table names remain `commerce_*` for legacy compatibility.
