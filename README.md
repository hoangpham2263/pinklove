# PinkLove

**An online wedding invitation platform** — couples pick a ready-made template or design their own invitation in a visual editor, publish it as a personal wedding website, and share it with guests.

> Portfolio project by [Hoang Pham](https://hoangpham2263.github.io). Built as a full-stack Next.js monolith with role-based portals for customers, admins, service providers and affiliates.

## Features

**Customers**
- Browse the invitation catalog: ready-made templates and design-it-yourself starters
- Visual invitation builder with drag-and-drop editing (Konva), asset library, live preview and publish settings
- Personal wedding sites with draft / published states and a shareable public link
- Wishlist, checkout, orders and payment history

**Admins**
- Dashboard to manage offerings, orders, payments, users and roles
- Built-in CMS for managed pages, menus, media and custom fields
- Affiliate approval and provider assignment
- Database + media backup with checksum verification and guarded restore

**Service providers**
- Provider portal to receive and process assigned orders, with realtime updates

**Affiliates**
- Application flow, referral links, and click / referral-cookie tracking

**Accounts & security**
- Roles: `ADMIN`, `CUSTOMER`, `PROVIDER`, `AFFILIATE` (the first registered account becomes `ADMIN`)
- Cookie-based authentication with optional Google OAuth

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS 4**
- **PostgreSQL** (`pg`)
- **Konva / react-konva** for the visual builder
- **Docker Compose** for local and production services

## Project structure

```text
web/        Next.js application (routes, features, server services)
docker/     Docker Compose files for development and production
docs/       Architecture, conventions, roles, schema and feature docs
scripts/    Backup and restore helpers
```

Code is organised by feature (`web/src/features/*`), each owning its UI, server service and data access.

## Getting started

Requirements: Node.js 20+, Docker Desktop.

```bash
cp .env.example .env
./web/setup up          # start PostgreSQL in Docker
cd web
npm install
npm run dev             # http://localhost:3000
```

Load demo data (offerings, sample sites, comments):

```bash
cd web
npm run seed:data
```

The first account you register becomes the administrator.

### Useful commands

| Command | Description |
|---|---|
| `./web/setup up` / `down` | Start / stop the database containers |
| `./web/setup logs` | Stream database logs |
| `cd web && npm run dev` | Start the development server |
| `cd web && npm run build` | Production build |
| `cd web && npm run lint` | Lint the codebase |

## Documentation

Detailed docs live in [`docs/`](./docs/index.md):

- [Architecture](./docs/architecture.md) · [Structure](./docs/structure.md) · [Conventions](./docs/conventions.md)
- Portals: [Guest](./docs/guest.md) · [Customer](./docs/customer.md) · [Admin](./docs/admin.md) · [Provider](./docs/provider.md)
- [E-commerce](./docs/ecommerce.md) · [Database schema](./docs/schema.md) · [Realtime](./docs/realtime.md)
- [Security](./docs/security.md) · [Backup & restore](./docs/backup.md)
- [Development notes](./docs/development-notes.md)

## Author

**Hoang Pham** — Full-Stack Developer
[Portfolio](https://hoangpham2263.github.io) · [LinkedIn](https://www.linkedin.com/in/hoangpham2263/) · [GitHub](https://github.com/hoangpham2263)

## License

© 2026 Hoang Pham. All rights reserved. Shared publicly as a portfolio project; please contact the author before reusing the code.
