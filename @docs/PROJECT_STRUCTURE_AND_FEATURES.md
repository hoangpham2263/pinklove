# Project Structure and Current Features

## 1) Current app structure

```text
web/
  src/
    app/
      (client)/
        layout.tsx
        page.tsx
        [[...slug]]/page.tsx
      (admin)/
        admin/
          page.tsx
          (auth)/
            login/page.tsx
          (protected)/
            layout.tsx
            dashboard/page.tsx
            user/page.tsx
            settings/page.tsx
            media/page.tsx
            menus/page.tsx
            menus/[id]/page.tsx
            pages/page.tsx
            pages/[slug]/page.tsx
      (user)/
        user/
          page.tsx
          (auth)/
            login/page.tsx
            register/page.tsx
          (protected)/
            layout.tsx
            dashboard/page.tsx
            profile/page.tsx
            settings/page.tsx
      api/
        auth/{login,logout,register}/route.ts
        auth/google/{login,callback}/route.ts
        admin/users/{create,role,delete}/route.ts
        admin/settings/theme/route.ts
        admin/pages/{create,update}/route.ts
        admin/menus/update/route.ts
        user/profile/route.ts
        media/route.ts
    components/
      ui/
      common/
        native-form.tsx
    features/
      auth/components/
        login-forms.tsx
      admin/components/
        admin-top-header.tsx
        menu-editor.tsx
      user/components/
        user-top-header.tsx
      media/
        components/
          media-library-manager.tsx
          media-selector.tsx
        server/
          media-store.ts
        types.ts
      client/
        PageRenderer.tsx
        templates.tsx
    lib/
      auth.ts
      db.ts
      cms.ts
      menu.ts
      google-oauth.ts
      server-utils.ts
      utils.ts
```

## 2) Authentication and authorization

- Local username/password authentication with DB-backed users.
- Google OAuth login support.
- Session via secure httpOnly cookie: `pinklove_session`.
- Roles:
  - `admin`: full access to `/admin/*`.
  - `user`: access to `/user/*`.
- Guards: `requireAdmin()` and `requireAppUser()`.

## 3) Admin features

- Dashboard (`/admin/dashboard`).
- User management (`/admin/user`): CRUD for accounts and roles.
- Content management:
  - **Pages** (`/admin/pages`): Manage CMS pages and SEO metadata.
  - **Menus** (`/admin/menus`): WordPress-like menu management for Header/Footer.
  - **Media library** (`/admin/media`): Auto-upload, preview modal, grid view, pagination (100-1000 items).
- Settings (`/admin/settings`):
  - global theme control

## 4) User features

- Dashboard (`/user/dashboard`).
- Profile (`/user/profile`): Edit `fullName`, `displayName`, `phone`, `bio`.
- Settings (`/user/settings`): Account preferences.

## 5) Data/storage

- PostgreSQL tables:
  - `users`, `user_sessions`, `user_settings`, `user_profiles`, `user_oauth_accounts`.
  - `app_settings` (Global config).
  - `cms_pages` (Content).
  - `cms_menus`, `cms_menu_items` (Navigation).
- Media files:
  - binary files in `web/public/uploads/YYYY/MM`
  - metadata in `web/storage/media.json`

## 6) UI system

- shadcn-style architecture.
- **Dynamic Menus:** Client Header and Footer are built dynamically from the database.
- **UI Density:** Global support for small/medium/large scaling via CSS variables.
- **Native Forms:** Specialized handling for reliable form submissions in Docker/Redirect scenarios.

## 7) Runtime and startup

- Docker Compose for full stack.
- Startup helper: `./setup` (detached mode by default).
- Auto-start configured for Docker daemon.