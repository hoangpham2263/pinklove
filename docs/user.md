# User Convention

This file covers the normal user area and user-owned site flows.

## Scope

- `src/app/user/*`
- `src/app/user/(protected)/(workspace)/design/[id]/page.tsx`
- `src/app/api/user/*`
- `src/features/user/*`
- user-facing parts of `src/features/invitations/*`

## Rules

- The session cookie name is `pinklove_session`.
- Roles are currently `admin` and `user`.
- The first registered account becomes `admin`.
- Logged-in non-admin users should be redirected away from user auth pages back to the user dashboard.
- Admins may access the normal user area for management and preview workflows.
- Builder-template sites should be edited through the dedicated designer route, not the generic site detail form.
- Current create flows bypass checkout and create draft invitation records directly. The current table name is still `wedding_sites`.
- Current builder limitations:
  - element height is not draggable/resizable yet
  - editor grouping is not implemented yet

## Current user routes

- `src/app/user/(auth)/login/page.tsx`
- `src/app/user/(auth)/register/page.tsx`
- `src/app/user/(protected)/(workspace)/dashboard/page.tsx`
- `src/app/user/(protected)/(workspace)/invitations/page.tsx`
- `src/app/user/(protected)/(workspace)/invitations/[id]/page.tsx`
- `src/app/user/(protected)/(account)/profile/page.tsx`
- `src/app/user/(protected)/(account)/settings/page.tsx`
- `src/app/user/(protected)/(growth)/affiliate/page.tsx`
- `src/app/user/(protected)/(workspace)/design/[id]/page.tsx`
