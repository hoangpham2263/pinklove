# AI Agent Instructions

This document provides context for AI agents working on the PinkLove project.

## Core Mandates

1. **Next.js 15+ & React 19:** This project uses the latest Next.js with App Router. Adhere to React 19 standards (e.g., use `use client` strictly, handle form submissions with `NativeForm`).
2. **Unified Styling:** Do not use `text-muted-foreground` or other explicit color variants for text. Use the global default `foreground` color.
3. **Database-First:** Always check `web/src/lib/db.ts` for schema migrations before adding new tables. Use the sequential migration pattern established there.
4. **WordPress-style CMS:** Maintain the WordPress-like feel for Pages and Menus. Keep SEO metadata fields consistent.
5. **No Chitchat:** (Inherited from project rules) Be direct and concise in terminal interactions.

## Key Components

- **`NativeForm`:** Use this for any form that performs a redirect after submission to avoid fetch-based redirection issues in Docker.
- Media Store: Currently uses `web/storage/media.json`. Do not move to DB without explicit instruction.


## Development Workflow

- Script: `./setup`
- Port: `3001` (Host)
- Database: PostgreSQL on port `5433` (Host)