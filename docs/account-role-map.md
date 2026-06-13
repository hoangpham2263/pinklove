# Account, Customer, Provider Map

This note explains why the project has `users`, customer routes, provider
routes, and the `providers` marketplace entity at the same time.

Verified against:

- Runtime PostgreSQL metadata on local `app` database.
- Source schema in `web/src/lib/database.ts`.
- Auth and role code in `web/src/lib/auth.ts` and `web/src/lib/roles.ts`.

## Short Version

- `users` is the shared login/account table.
- `users.role` decides the primary portal role: `ADMIN`, `CUSTOMER`,
  `AFFILIATE`, or `PROVIDER`.
- `customer/*` is a customer workspace, not a separate account system.
- `provider/*` is a provider workspace, not a separate account system.
- `providers.id` is the marketplace/provider business entity.
- `provider_user_id` means a provider account in `users.id`.
- `provider_id` means a marketplace provider entity in `providers.id`.

## Identity And Role Flow

```mermaid
flowchart TD
  Guest["GUEST\nnot stored in users"]
  Users["users\nid, username, password_hash,\nrole, account_status"]
  Role{"users.role"}

  Admin["ADMIN\n/admin/*\nrequireAdmin()"]
  Customer["CUSTOMER\n/customer/*\nrequireUser()"]
  Affiliate["AFFILIATE\n/customer/* + affiliate\nrequireUser()"]
  ProviderUser["PROVIDER\n/provider/*\nrequireProvider()"]

  Guest --> Public["public routes\nshop, content, offerings"]
  Users --> Role
  Role --> Admin
  Role --> Customer
  Role --> Affiliate
  Role --> ProviderUser
```

There is one shared login identity. The project then routes that account into
the correct protected area.

## Database Relationship Map

```mermaid
erDiagram
  users {
    text id PK
    text username
    text role
    text account_status
  }

  user_profiles {
    text user_id PK,FK
    text full_name
    text display_name
    text provider_portal_slug
  }

  affiliate_accounts {
    text user_id PK,FK
  }

  wedding_sites {
    text id PK
    text user_id FK
    text offering_id FK
  }

  commerce_orders {
    text id PK
    text user_id FK
    text affiliate_user_id FK
  }

  bookings {
    text id PK
    text user_id FK
  }

  providers {
    text id PK
    text owner_user_id FK
    text organization_id FK
    text slug
    text display_name
    text provider_type
    text status
  }

  provider_profiles {
    text provider_id PK,FK
  }

  provider_services {
    text id PK
    text provider_id FK
    text offering_id FK
  }

  provider_order_assignments {
    text id PK
    text order_id FK
    text provider_user_id FK
  }

  provider_offering_submissions {
    text id PK
    text provider_user_id FK
    text linked_offering_id FK
  }

  offering_provider_suppliers {
    text id PK
    text offering_id FK
    text provider_user_id FK
  }

  provider_offering_supplier_requests {
    text id PK
    text offering_id FK
    text provider_user_id FK
  }

  users ||--|| user_profiles : "profile"
  users ||--o| affiliate_accounts : "affiliate account"
  users ||--o{ wedding_sites : "customer-owned sites"
  users ||--o{ commerce_orders : "customer orders"
  users ||--o{ bookings : "customer bookings"

  users ||--o{ providers : "owner_user_id"
  providers ||--|| provider_profiles : "marketplace profile"
  providers ||--o{ provider_services : "marketplace services"

  users ||--o{ provider_order_assignments : "provider_user_id"
  users ||--o{ provider_offering_submissions : "provider_user_id"
  users ||--o{ offering_provider_suppliers : "provider_user_id"
  users ||--o{ provider_offering_supplier_requests : "provider_user_id"
```

## Why Both `provider_user_id` And `provider_id` Exist

They are intentionally different.

| Name | Points to | Meaning | Used for |
| --- | --- | --- | --- |
| `user_id` | `users.id` | Any login account/customer owner | customer data, orders, bookings, profiles |
| `provider_user_id` | `users.id` | Authenticated provider account actor | provider portal workflows, supplier requests, assignments |
| `provider_id` | `providers.id` | Marketplace provider business entity | public profile, services, pricing, regions, reviews, search |
| `owner_user_id` | `users.id` | Account that owns a provider entity | link from provider business entity back to login account |

Rule of thumb:

- If the code asks "who is logged in and allowed to act?", use `users.id`.
- If the code asks "which provider business/profile/service is shown in the
  marketplace?", use `providers.id`.

## Source Routing Map

```mermaid
flowchart LR
  Auth["web/src/lib/auth.ts"]
  Roles["web/src/lib/roles.ts"]

  CustomerRoutes["src/app/customer/*\nsrc/app/api/customer/*"]
  ProviderRoutes["src/app/provider/*\nsrc/app/api/provider/*"]
  AdminRoutes["src/app/admin/*\nsrc/app/api/admin/*"]

  CustomerApi["src/lib/api-client.customer.ts"]
  ProviderApi["src/lib/api-client.provider.ts"]

  Auth -->|"requireUser()"| CustomerRoutes
  Auth -->|"requireProvider()"| ProviderRoutes
  Auth -->|"requireAdmin()"| AdminRoutes
  Roles --> Auth

  CustomerRoutes --> CustomerApi
  ProviderRoutes --> ProviderApi
```

## Practical Examples

- Customer creates a wedding invitation:
  `wedding_sites.user_id -> users.id`.
- Customer checks out:
  `commerce_orders.user_id -> users.id`.
- Admin assigns a physical order to a provider account:
  `provider_order_assignments.provider_user_id -> users.id`.
- Provider submits a service/product for approval:
  `provider_offering_submissions.provider_user_id -> users.id`.
- Approved provider service appears in marketplace:
  `provider_services.provider_id -> providers.id`.
- Public provider profile, pricing, regions, reviews:
  use `providers.id`.

## What Not To Do

- Do not create another account table for customers or providers.
- Do not use `provider_id` when the column stores a `users.id`.
- Do not point marketplace profile/service/pricing/review ownership directly at
  `users.id`; use `providers.id`.
- Do not mix provider operational screens into `/customer/*`; provider work
  belongs in `/provider/*`.
