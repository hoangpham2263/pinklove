# PinkLove Next.js Project

PinkLove is a Docker-first Next.js application with:

- Next.js `16.2.2` using the App Router
- React `19.2.4`
- PostgreSQL
- Cookie-based local auth plus optional Google OAuth
- A small CMS for public pages, menus, and media

Current notable behavior:

- `home`, `login`, and `register` are system CMS pages and are auto-created if missing
- `login` and `register` use dedicated auth page components, but their editable content still comes from CMS custom fields
- Admin users can access public pages and user pages for management and preview flows

## Getting Started

1. Ensure Docker Desktop is running.
2. Run `./setup up` to build and start the development stack.
3. Open the app in your browser using the `WEB_PORT` value from `.env`.
   Default in `.env.example`: `http://localhost:3000`

If `.env` does not exist, `./setup` creates it from `.env.example`.

Development note:

- `docker-compose.yml` bind-mounts `./web` into the container and does not keep a separate `.next` volume, which reduces stale Next.js dev cache issues.

## Main Commands

- `./setup up`: build and start containers in detached mode
- `./setup rebuild`: stop then rebuild and start
- `./setup down`: stop containers
- `./setup logs`: stream web logs
- `./setup`: open the interactive menu

## Repo Layout

- `web/`: Next.js application
- `docs/`: project documentation
- `docker-compose.yml`: development stack
- `docker-compose.prod.yml`: production-style stack
- `setup`: helper script for common Docker workflows

## Documentation

- [Conventions](./docs/CONVENTIONS.md)
- [Project Structure & Features](./docs/PROJECT_STRUCTURE_AND_FEATURES.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [Agent Notes](./docs/AGENTS.md)
