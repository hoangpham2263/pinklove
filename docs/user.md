# User Convention

This file covers the normal user area and user-owned site flows.

## Scope

- `src/app/(user)/user/*`
- `src/app/(designer)/user/design/[id]/page.tsx`
- `src/app/api/user/*`
- `src/features/user/*`
- user-facing parts of `src/features/sites/*`

## Rules

- The session cookie name is `pinklove_session`.
- Roles are currently `admin` and `user`.
- The first registered account becomes `admin`.
- Logged-in non-admin users should be redirected away from user auth pages back to the user dashboard.
- Admins may access the normal user area for management and preview workflows.
- Builder-template sites should be edited through the dedicated designer route, not the generic site detail form.
- Current create flows bypass checkout and create draft `wedding_sites` directly.
- Current builder limitations:
  - element height is not draggable/resizable yet
  - editor grouping is not implemented yet

## Current user routes

- `src/app/(user)/user/(auth)/login/page.tsx`
- `src/app/(user)/user/(auth)/register/page.tsx`
- `src/app/(user)/user/(protected)/dashboard/page.tsx`
- `src/app/(user)/user/(protected)/profile/page.tsx`
- `src/app/(user)/user/(protected)/settings/page.tsx`
- `src/app/(user)/user/(protected)/affiliate/page.tsx`
- `src/app/(user)/user/(protected)/sites/page.tsx`
- `src/app/(user)/user/(protected)/sites/[id]/page.tsx`
- `src/app/(designer)/user/design/[id]/page.tsx`
