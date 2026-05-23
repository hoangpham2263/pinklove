# Realtime

Use this file for project-wide rules around realtime transport, event contracts, and partial UI refresh behavior.

## Scope

- Shared realtime infrastructure lives in `web/src/features/realtime/*`.
- Feature-specific realtime adapters should stay in the owning feature, for example `web/src/features/provider-orders/realtime.ts`.
- Use this file for cross-area realtime rules. Keep provider workflow specifics in `docs/partner.md`.

## Current Architecture

- Realtime transport uses `SSE` over HTTP, not WebSocket.
- Server stream behavior is centralized in `web/src/features/realtime/server.ts`.
- Client subscription behavior is centralized in `web/src/features/realtime/use-realtime-resource.ts`.
- Shared event/state types live in `web/src/features/realtime/types.ts`.
- Current transport implementation uses `Postgres LISTEN/NOTIFY` behind the shared SSE core.
- The server should stay idle until Postgres emits a matching notification for the current resource.
- Admin order-state editing now uses a client-side mutation panel and a small JSON read endpoint instead of a native form redirect flow.
- `domain_events` is the durable event table for business events. Offering
  create/update mutations now write `offering.created` and `offering.updated`;
  new booking, payment, and RSVP mutations should follow the same pattern.
- `domain_event_types` is the canonical registry for event names and cache
  invalidation flags. Current cache invalidation event names include
  `offering.updated`, `template.updated`, `provider.updated`, and
  `site.published`.
- Search/indexing sync event names are also registered:
  `offering.search.sync`, `template.search.sync`, and `provider.search.sync`.

## Core Rules

- Do not build ad-hoc SSE loops inside feature components or route handlers when the shared realtime core can be reused.
- New realtime resources must define a stable state/version contract instead of comparing full mutable objects in client code.
- Realtime events are signals that a resource changed. The UI should fetch the updated JSON resource and update local state.
- Do not use realtime events to force whole-route refresh when a smaller panel or resource can be updated directly.
- Prefer partial client updates over `router.refresh()` for operational screens that need true realtime behavior.
- For admin/provider collaboration screens, saving a mutation should not reload the page. The expected flow is `toast + JSON refresh of the affected panel`.

## Server Rules

- SSE route handlers should be thin wrappers that:
  - authorize the caller
  - resolve the resource key
  - delegate stream behavior to the shared realtime server core
- Keep feature-specific resource loaders in the owning feature module.
- Shared realtime notifications should move through a small channel contract instead of per-feature polling loops.
- Mutations that change a realtime resource must emit `NOTIFY` in the same transaction path as the write.
- Business mutations should write a durable `domain_events` row near the state
  change, then emit the lightweight realtime signal when a realtime resource is
  attached to that workflow.
- Emit `ready` on initial connect so the client can establish a baseline state.
- Emit `*.changed` when the version changes.
- Emit `*.deleted` only when the resource is no longer available to the authorized caller and the client must tear down the current view.
- Keep SSE responses unbuffered with:
  - `content-type: text/event-stream`
  - `cache-control: no-cache, no-transform`
  - `connection: keep-alive`
- SSE streams may send a lightweight keepalive comment to avoid idle proxies closing the connection.

## Client Rules

- Realtime UI should use the shared subscription hook in `web/src/features/realtime/use-realtime-resource.ts`.
- Realtime panels should own local state for the resource they render.
- On `*.changed`, fetch only the JSON endpoint for the affected resource and patch local state.
- Avoid `router.refresh()` unless the route is intentionally server-driven and partial update is not practical.
- Track connection status in the client so UI can render `connecting`, `live`, or `reconnecting` when needed.
- Admin order detail currently follows this model for both:
  - provider assignment panel
  - order state panel
- Partner order detail and partner portal should also stay on this same `SSE signal -> fetch JSON -> patch local state` contract.

## Toast Rules

- Use `sonner` for realtime notifications.
- Realtime toast copy should inform the passive side that the other side changed the resource.
- Do not show a duplicate realtime toast immediately after the current user saves the same resource themselves.
- Success/error toasts from direct mutations and informational toasts from incoming realtime events should remain separate concerns.
- For the admin/provider order collaboration flow:
  - the actor who clicks save sees a success or error toast for the direct mutation
  - the passive side sees an informational realtime toast when the other side changes the resource
  - the passive side should not need a page reload to see the updated values

## Resource Design

- Each realtime resource needs:
  - one stream URL
  - one JSON read endpoint
  - one stable identity key
  - one version snapshot used for change detection
- Good resource examples in the current codebase:
  - provider assignment detail
  - provider portal summary/list
  - user notification inbox summary
- Additional JSON resource examples now in use:
  - admin order state detail
  - partner provider assignment detail
- Prefer resource-level channels such as `assignment` or `provider portal` over page-level channels.

## Scaling Path

- Short term:
  - keep using the shared core
  - avoid opening subscriptions on screens that do not need them
  - keep resource payloads narrow
- Medium term:
  - keep the shared `LISTEN/NOTIFY` core
  - tighten notification payloads and resource scopes as more realtime features are added
- Long term:
  - consider Redis pub/sub or a dedicated realtime gateway only if app scale or transport requirements outgrow the database-backed model

## Verification

- For realtime feature changes, verify at minimum:
  - stream connection and `ready`
  - change event emission
  - permission failures such as `401` or `404`
  - resource JSON fetch after event
  - toast behavior on the passive side
- For admin/provider operational screens, also verify:
  - saving does not trigger a full page navigation
  - only the affected panel data changes after save
  - the passive side receives the change without manual refresh
- The latest manual smoke checklist lives in `docs/realtime-test-todo.md`.
