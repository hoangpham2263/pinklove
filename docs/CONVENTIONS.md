# Project File Convention (Next.js App Router)

## 0) Convention source of truth

- `docs/CONVENTIONS.md` is the single source of truth for project conventions.
- **Directory Note:** The Next.js application is located in the `web/` directory. All paths mentioned in this document (e.g., `src/`, `public/`, `storage/`, `tsconfig.json`) are relative to the `web/` directory unless otherwise specified.
- Any new or updated standard must be written here in the same change.
- If code and this document conflict, update this file first, then align code.

## 1) Folder structure

- Keep routing concerns in `src/app` only (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`).
- Use route group `src/app/(client)` for public/client pages.
- Keep admin pages directly under `src/app/admin/*` for cleaner tree and stable URLs.
- Keep business/domain code in `src/features/<feature-name>`.
- Keep shared UI in `src/components/ui` and shared app widgets in `src/components/common`.
- Keep cross-cutting helpers in `src/lib` (`env`, `db`, `auth`, `utils`, `routes`, constants).
- Keep reusable types in `src/types`.

## 1.1) Centralized Routing

- All internal links (e.g., `<Link href="...">`) and redirects (e.g., `redirect(...)`, `NextResponse.redirect(...)`) MUST use the centralized `ROUTES` object.
- The source of truth for all application paths is `src/lib/routes.ts`.
- Do not hardcode paths like `"/user/login"` or `"/admin/dashboard"` anywhere in the codebase. Use `ROUTES.AUTH.LOGIN` or `ROUTES.ADMIN.DASHBOARD` instead.

## 2) Naming convention

- Use `kebab-case` for folders and non-component files (`user-profile`, `auth-service.ts`).
- Use `PascalCase` for React component file names (`UserCard.tsx`).
- Use `camelCase` for variables/functions and `UPPER_SNAKE_CASE` for constants.
- Prefer singular feature names in `src/features` (`auth`, `product`, `order`).

## 3) Route segment rules (App Router)

- Use route groups for concerns, not URL changes: `(client)`.
- Use dynamic segments only when needed: `[id]`, `[slug]`, `[...rest]`.
- Co-locate route-specific subcomponents inside each route folder as `_components`.
- Keep API handlers under `src/app/api/**/route.ts`.

Recommended app tree:

- `src/app/layout.tsx`: root providers, fonts, global wrappers only.
- `src/app/(client)/layout.tsx`: client/public shell.
- `src/app/(client)/page.tsx`: homepage for client.
- `src/app/(admin)/admin/(protected)/layout.tsx`: admin shell/sidebar/topbar.
- `src/app/(admin)/admin/page.tsx`: admin index (redirect to dashboard).
- `src/app/(admin)/admin/(auth)/login/page.tsx`: admin login page.
- `src/app/(user)/user/(auth)/login/page.tsx`: user login page.
- `src/app/(user)/user/(auth)/register/page.tsx`: user register page.

## 4) Server vs Client boundary

- Default to Server Components; add `"use client"` only when required.
- Put server actions in `actions.ts` under route or feature scope.
- Keep browser-only hooks in `src/hooks` and client components.
- Do not import server-only modules into client files.

## 5) Standard files per feature

Recommended inside `src/features/<feature-name>/`:

- `components/`: feature UI components
- `actions.ts`: server actions
- `service.ts`: business logic and data access orchestration
- `schema.ts`: zod validation schemas
- `types.ts`: feature-local TypeScript types

## 6) Imports and style

- Use absolute import alias `@/*` (configured in `tsconfig.json`).
- Keep one default export for route entry files, prefer named exports elsewhere.
- Avoid deep relative imports like `../../../`; prefer `@/`.
- Keep files focused: one major responsibility per file.
- Section spacing standard for UI blocks:
  - outer section: `section.pt-10.lg:pt-15.2xl:pt-20`
  - inner container: `div.container.mx-auto.px-4`
  - prefer shared wrappers from `src/components/common/section.tsx` (`Section`, `SectionContainer`) instead of repeating classes manually.
- **Main Content Structure:**
  - The `<main>` tag must only be used once within the shell layout (e.g., `src/app/(client)/layout.tsx`, `src/app/admin/layout.tsx`) as the primary container for page content.
  - Page components (`page.tsx`) must not use the `<main>` tag. Instead, they should use one or more `<section>` tags as their top-level wrappers.
  - Hierarchy should be: `body` -> `main` (in layout) -> `section` (in page) -> `div` (inner containers).

## 7) Media library standard (WordPress-like)

- Media management UI lives at `src/app/admin/media/page.tsx`.
- Media API lives at `src/app/api/media/route.ts` (`GET`, `POST`, `DELETE`).
- **Auto-upload:** UI supports immediate background upload upon file selection or drag-and-drop. No manual "Upload" button.
- **Preview:** Clickable images open a high-resolution preview modal with backdrop-blur.
- **Grid Layout:** Desktop view uses a 5-column grid for better image density.
- **Pagination:** Supports 100, 200, 500, and 1000 items per page with client-side state and Prev/Next navigation.
- Preferred drag-and-drop library: `react-dropzone`.
- Uploaded files are stored locally under `public/uploads/YYYY/MM/*`.
- Media metadata is stored in `storage/media.json` for local development.
- Public URL format is `/uploads/YYYY/MM/<file-name>`.
- Reuse media by storing `mediaId` (preferred) or media URL in feature records.
- Do not re-upload the same image per module; select from media library whenever possible.
- Allowed image types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
- Default max upload size: `5MB` per image.

## 8) Runtime and startup convention

- Use `./setup` at repo root as the default startup instruction entrypoint (manages build and detached start).
- Project is configured to **auto-start** in detached mode (`-d`) when Docker daemon starts (restart: unless-stopped).
- Default host ports are `WEB_PORT=3001` and `POSTGRES_PORT=5433` to avoid common conflicts.
- Keep port values in `.env` and `.env.example` aligned with `docker-compose.yml`.
- Start stack with `docker compose up -d --build`; stop with `docker compose down`.
- Use `./setup logs` to watch web compile logs.
- For local (non-docker web) run, use the same web port standard (`3001`) when possible.
- Dev container must reinstall dependencies automatically when `package-lock.json` changes.

## 9) Authentication and UI styling convention



- Use database-backed auth only (no localStorage-based auth state).

- Login route is `src/app/(user)/user/(auth)/login/page.tsx` (accessible at `/user/login`).

- Register route is `src/app/(user)/user/(auth)/register/page.tsx` (accessible at `/user/register`).

- Admin Login route is `src/app/(admin)/admin/(auth)/login/page.tsx` (accessible at `/admin/login`).

- Auth APIs live in `src/app/api/auth/*` (`login`, `logout`, `register`).

- Google OAuth APIs live in:

  - `src/app/api/auth/google/login/route.ts`

  - `src/app/api/auth/google/callback/route.ts`

  - These routes must use `export const dynamic = "force-dynamic"` to avoid static caching of OAuth state.

- Admin account management APIs live in `src/app/api/admin/users/*`.

- Session is stored in secure httpOnly cookie `pinklove_session`.

- User role is stored in DB (`users.role`) with values `admin` or `user`.

- Account and role management UI is in `src/app/(admin)/admin/(protected)/user/page.tsx`.

- **Text Color Standard:** Unified global text color. `muted-foreground` and other variants should inherit from `foreground` for maximum consistency and high contrast. Do not use explicit `text-muted-foreground` in components unless strictly necessary.

- **Global Label Style:** All `<label>` elements are `display: block` with a default `margin-bottom: 0.5rem` via `globals.css`.

- **Global Select Style:** HTML `<select>` elements use a custom SVG chevron icon and fixed adjusted padding/height.

- Theme settings standard:

  - global app theme is stored in `app_settings.theme`.

  - default preset: `pink`.

  - root layout applies current theme via `data-theme` on `<body>`.



## 10) Admin and User Sidebar convention



- Admin shell is defined in `src/app/(admin)/admin/(protected)/layout.tsx`. User shell in `src/app/(user)/user/(protected)/layout.tsx`.

- **Sidebar Grouping:** Links must be grouped into logical categories (e.g., Overview, Content, System / Tài khoản, Cấu hình).

- **Icons:** Use Lucide icons for all main navigation items.

- **Styling:** Use a consistent `navItemClasses` for hover states and padding. Use default text colors.

- Desktop sidebar is fixed on the left with width `w-64`.

- Admin top header uses a fixed position in the content area (`md:left-64`, `top-0`).



## 11) Client header and footer convention



- In `src/app/(client)/layout.tsx`, navigation is **fully dynamic** based on the DB menu system.

- Hardcoded fallback links should be avoided.

- **Footer:** Rendered dynamically using the `footer` menu from Admin.

- Account trigger text: current `username` (logged-in) or `Login` (logged-out).

- Account actions (Dashboard, Settings, Logout) are handled via a popup menu.



## 12) User profile convention



- User profile page lives at `src/app/(user)/user/(protected)/profile/page.tsx`.

- Profile update API lives at `src/app/api/user/profile/route.ts` (`POST`).

- Use server-side auth guard: `requireAppUser(ROUTES.AUTH.LOGIN)`.



## 13) CMS page + SEO convention (WordPress-style)







- Page management UI: `src/app/(admin)/admin/(protected)/pages/page.tsx` and `src/app/(admin)/admin/(protected)/pages/[slug]/page.tsx`.



- CMS data is stored in `cms_pages`.



- Normalization: Slug format should be normalized as lowercase kebab-case before saving.



- **Custom Fields (ACF-style):** Templates can define their own specific custom fields (like `heading`, `sideImage`, etc.) in `src/features/client/templates/index.ts`. These fields are automatically rendered in the Admin Page Editor and saved as JSONB in `cms_pages.custom_fields`.



- **Special Pages:** Pages like `login` and `register` also act as CMS pages to allow admin to edit their custom fields visually without touching code.



## 14) Menu management convention (WordPress-style)



- Menu management UI lives in:

  - `src/app/(admin)/admin/(protected)/menus/page.tsx` (menu list)

  - `src/app/(admin)/admin/(protected)/menus/[id]/page.tsx` (edit menu items)

- Menu data is stored in `cms_menus` and `cms_menu_items`.

- Support two item types: `page` (links to existing CMS page) and `custom` (external/manual URL).

- **Smart Labels:** When selecting a page in the menu editor, the navigation label should automatically populate with the page's name as a default.

- Menus are identified by unique system names like `header` or `footer`.



## 15) Native Form convention



- **Problem:** React 19/Next.js 15 intercepts standard `<form>` submissions with `fetch`, which can cause issues with 303 redirects to external domains or absolute URLs in Docker (0.0.0.0).

- **Convention:** For all forms performing POST actions that result in a redirect, use the `NativeForm` component from `@/components/common/native-form`.

- `NativeForm` forces a traditional browser submission by calling `e.currentTarget.submit()` in the `onSubmit` handler.

- For redirection in API routes, prefer `request.url` as the base (e.g., `new URL("/target", request.url)`) instead of hardcoded hostnames or `getBaseUrl`, to ensure reliability across Docker port mappings.
