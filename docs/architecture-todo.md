# PinkLove Architecture TODO

This roadmap is the source of truth for the final PinkLove platform refactor.
PinkLove is a headless dynamic wedding commerce ecosystem, not a simple
invitation CRUD or invitation builder system.

## Current Target

Target architecture:

```txt
Headless Dynamic Wedding Commerce Platform
```

Core product support:

- online invitations
- wedding websites
- paper invitations
- video invitations
- motion templates
- studios
- planners
- photographers
- makeup artists
- wedding packages
- subscriptions
- creator marketplace
- wedding ecosystem services

## Priority Order

| Priority | Work |
| --- | --- |
| Critical | Remove duplicate abstraction layers, standardize IDs, dynamic field engine, dynamic admin renderer, template engine abstraction |
| High | Provider abstraction, package system, search documents, relation fields, availability system |
| Medium | Organizations, analytics, advanced attributes, indexed filters |

## Final Missing Items Execution Checklist

Use this section as the implementation checklist for the remaining PinkLove
architecture work. A box can be checked only when schema, application code,
seed/bootstrap data, docs, and verification commands are updated together.

### Critical

- [x] Standardize every primary key and foreign key to `text` in the clean
  bootstrap database.
  - Current bootstrap uses `app_random_id()`, a nanoid-compatible 24 character
    text generator.
  - Clean DB audit returns zero non-text primary keys.
- [x] Remove `offering_types.field_schema`.
  - Keep `offering_type_fields` as the only offering field-definition source.
  - Remove service/API reads and writes of duplicate JSON schema data.
- [x] Add `offering_type_field_groups`.
  - Required columns: `id`, `offering_type_id`, `key`, `label`, `sort_order`,
    `ui_config`, `created_at`, `updated_at`.
- [x] Add `group_id` or equivalent grouping reference to `offering_type_fields`.
- [x] Render grouped admin forms predictably.
  - Admin forms must render grouped sections predictably.

### High

- [x] Add conditional field logic columns to `offering_type_fields`.
  - `visibility_conditions`
  - `dependency_conditions`
- [x] Enforce conditional field behavior in the admin renderer.
  - Support conditions such as showing `duration` only when
    `service_type = video_editing`.
- [x] Complete the field validation engine for offering custom fields.
  - Support `min`, `max`, `regex`, `required`, `unique`, and `allowed_values`.
  - Validate on both admin UI submit and server-side save.
- [x] Replace duplicated provider concepts with a unified provider system.
  - Add `providers`, `provider_profiles`, `provider_services`,
    `provider_reviews`, and `provider_regions`.
  - Remove clean-schema `providers` and `creator_profiles` tables.
  - Support provider types through `provider_types`: `supplier`, `creator`,
    `studio`, `planner`, `makeup`, `photographer`, `florist`, and
    `videographer`.
- [x] Make booking assignments polymorphic.
  - Replace `provider_id` and `creator_profile_id` booking columns with
    `provider_type` and `provider_id`.
- [x] Add package/bundle architecture.
  - Add `offering_bundles` and `offering_bundle_items`.
  - Support wedding packages that combine digital, physical, and service
    offerings.
- [x] Add availability architecture.
  - Add `provider_availability`, `provider_time_slots`, and
    `booking_calendars`.
  - Connect service offerings and bookings to provider calendars.
- [x] Add `offering_search_documents`.
  - Required columns: `offering_id`, `search_text`, `filter_json`,
    `embedding`.
  - Add generated `search_vector` for PostgreSQL full-text search.
  - Add search sync event types: `offering.search.sync`,
    `template.search.sync`, and `provider.search.sync`.
  - Use it as the optimized query/search layer for dynamic offering fields.
- [x] Add automated schema regression audit.
  - `npm run audit:schema` checks text-only IDs, required architecture tables,
    seed/config rows, `search_vector`, offering status constraint, and forbidden
    `offerings.config` keys.
- [x] Enforce the `offerings.config` boundary across offering admin, import,
  seed, and provider submission paths.
  - Allowed: UI config, lightweight metadata, flexible display configuration.
  - Not allowed: inventory, pricing rules, booking logic, permissions,
    analytics, relationships, site defaults, general offering state, or provider
    supply state.
  - Enforce the same rule with a database check constraint and service-layer
    sanitization.
  - Add soft size guard: `pg_column_size(config) <= 32768`.
- [x] Finalize marketplace ownership on providers.
  - `physical_offerings` uses `provider_id` and `provider_type`.
  - `creator_service_offerings` uses `provider_id` and `provider_type`.
  - `provider_id` and `provider_id` are removed from clean runtime.
- [x] Add organization support.
  - Add `organizations`, `organization_members`, and `organization_roles`.
  - Use organizations for studios, agencies, wedding teams, and multi-user
    providers.

### Medium

- [x] Constrain universal media relations.
  - Standardize `media_asset_links.target_type`.
  - Standardize `media_asset_links.role`.
  - Add database checks or enum-like constraints after existing data is cleaned.
- [x] Reduce `wedding_sites.custom_data`.
  - Move durable data into `wedding_site_sections`,
    `wedding_site_guests`, `wedding_site_events`, and `wedding_site_rsvps`.
  - Keep `custom_data` only for transitional or non-critical display metadata.
- [x] Add `domain_events`.
  - Event examples: `offering.created`, `booking.confirmed`,
    `payment.completed`, `rsvp.updated`.
  - Add `domain_event_types` so cache invalidation event names are canonical.
  - Use events for notifications, automation, analytics, and realtime sync.
- [x] Move SEO redirect runtime storage to `seo_redirects`.
  - Keep legacy `app_settings.seo_redirects` as read-only fallback/backfill
    source.
- [x] Add template attribute discovery.
  - Add `template_attributes` and `template_attribute_values`.
  - Support `style`, `theme`, `mood`, `culture`, `season`, and `color`.
- [x] Add weighted template ranking support.
  - `trend_score`
  - `conversion_score`
  - `quality_score`
- [x] Add analytics event tables.
  - Add `analytics_events`, `analytics_sessions`, and `analytics_page_views`.
  - Use them for template views, shares, conversion, and SEO performance.

## Verification Checklist

Run these after each architecture phase, and update the affected docs before
marking the phase complete:

- [x] `npm run lint` from `web/`.
- [x] `npm run build` from `web/`.
- [x] Bootstrap a fresh local DB and verify `web/src/lib/database.ts` creates the
  final tables without legacy-only dependencies.
- [x] Run seed scripts that touch the changed area, such as
  `npm run seed:offerings`, `npm run seed:website`, and partner seed scripts
  when provider/booking tables change.
- [x] Check admin create/edit flows for offerings, offering types, providers,
  bookings, media, and wedding sites touched by the phase.
- [x] Refresh and update:
  - `docs/architecture-todo.md`
  - `docs/schema.md`
  - `docs/admin.md`
  - `docs/structure.md`
  - `docs/fields.md` when dynamic fields change
  - `docs/realtime.md` when domain events or realtime behavior changes

## Phase 1: Core Offering Cleanup

- [x] Keep `offerings` as the sellable catalog source of truth.
- [x] Keep `offering_types` as the runtime type registry.
- [x] Remove implementation-based subtype tables and keep only domain-based tables.
- [x] Keep or create business-domain offering tables:
  - `digital_template_offerings`
  - `physical_offerings`
  - `service_offerings`
  - `creator_service_offerings`
  - `experience_offerings`
  - `subscription_offerings`
- [x] Normalize runtime type keys to business-domain names only.
- [x] Seed final type keys:
  - `digital_template`
  - `physical_product`
  - `service`
  - `creator_service`
  - `experience`
  - `subscription`
  - `addon`

## Phase 2: Template Engine Abstraction

- [x] Add `template_engine`.
- [x] Add `template_mode`.
- [x] Treat rendering strategy as metadata, not product type.
- [x] Support `template_engine` values:
  - `coded`
  - `builder`
  - `hybrid`
  - `motion`
  - `video`
  - `ai_generated`
- [x] Move coded/builder behavior out of offering type logic.
- [x] Update services, admin forms, public routes, sitemaps, and imports to use
  offering type plus template engine separately.

## Phase 3: Dynamic Field Engine

- [x] Add `offering_type_fields`.
- [x] Remove `offering_types.field_schema`; relational field rows are the only
  field-definition source.
- [x] Required columns:
  - `id`
  - `offering_type_id`
  - `field_key`
  - `field_label`
  - `field_type`
  - `is_required`
  - `default_value`
  - `validation_rules`
  - `ui_config`
  - `sort_order`
- [x] Support field types:
  - `text`
  - `textarea`
  - `richtext`
  - `number`
  - `boolean`
  - `select`
  - `multiselect`
  - `date`
  - `datetime`
  - `media`
  - `gallery`
  - `price`
  - `location`
  - `json`
  - `repeater`
  - `relation`
  - `blocks`
- [x] Add relation field columns:
  - `relation_target`
  - `relation_multiple`
  - `relation_config`
- [x] Add field grouping schema:
  - `offering_type_field_groups`
  - `offering_type_fields.group_id`
- [x] Add conditional logic columns:
  - `visibility_conditions`
  - `dependency_conditions`
- [x] Standardize validation rules for:
  - `min`
  - `max`
  - `regex`
  - `required`
  - `unique`
  - `allowed_values`
- [x] Build full dynamic admin form renderer from `offering_type_fields`.
- [x] Dynamic admin renderer must support:
  - auto forms
  - validation
  - sections
  - repeaters
  - relations
  - media upload
  - blocks
  - conditional fields

## Phase 4: Admin Offering UX

- [x] Keep `/admin/offerings` as the main offering management table across all
  offering types.
- [x] Keep scoped table management routes for operational subsets such as
  `/admin/offerings/templates`, `/admin/offerings/builder`, and
  `/admin/offerings/list`.
- [x] Keep offering type management in a table-first UI.
- [x] Use dedicated table screens for:
  - offerings
  - offering types
  - offering type fields
  - categories
  - template attributes
  - bundles
  - providers

## Phase 5: Offering Config Rule

- [x] Keep `offerings.config`.
- [x] Use `offerings.config` only for:
  - UI configs
  - lightweight metadata
  - flexible configs
- [x] Do not store these in `offerings.config`:
  - analytics
  - inventory
  - guests
  - orders
  - permissions
  - business-critical relations

## Phase 6: Template Attribute And Discovery

- [x] Add `template_attributes`.
- [x] Add `template_attribute_values`.
- [x] Support attribute types:
  - `style`
  - `theme`
  - `mood`
  - `culture`
  - `color`
  - `season`
  - `event_type`
- [x] Keep template discovery tables:
  - `template_tags`
  - `template_styles`
  - `template_categories`
  - `template_analytics`
  - `template_views`
  - `template_shares`
  - `template_conversions`

## Phase 7: Search Documents

- [x] Add `offering_search_documents`.
- [x] Required columns:
  - `offering_id`
  - `search_text`
  - `filter_json`
  - `embedding`
- [x] Use search documents for dynamic fields that are difficult to query
  directly.

## Phase 8: Universal Provider System

- [x] Replace separate provider mindsets such as `providers`, `creator_profiles`,
  and future `studios` with:
  - `providers`
  - `provider_profiles`
  - `provider_services`
  - `provider_reviews`
  - `provider_regions`
- [x] Support `provider_type` values:
  - `supplier`
  - `creator`
  - `studio`
  - `planner`
  - `makeup`
  - `florist`
  - `photographer`
  - `videographer`
- [x] Add `provider_types` as the config table for supported provider types.
- [x] Refactor booking assignments from:
  - `provider_id`
  - `creator_profile_id`
- [x] To:
  - `provider_type`
  - `provider_id`

## Phase 9: Packages And Availability

- [x] Add `offering_bundles`.
- [x] Add `offering_bundle_items`.
- [x] Add bundle pricing rules:
  - `pricing_strategy`
  - `discount_type`
  - `discount_value`
- [x] Support wedding packages that combine:
  - online invitation
  - paper invitation
  - studio
  - planner
  - makeup
- [x] Add availability tables:
  - `provider_availability`
  - `provider_time_slots`
  - `booking_calendars`

## Phase 10: Organization System

- [x] Add `organizations`.
- [x] Add `organization_members`.
- [x] Add `organization_roles`.
- [x] Support studios, teams, providers, and creator groups.

## Phase 11: Media System

- [x] Keep `media_assets`.
- [x] Keep `media_asset_links`.
- [x] Standardize `media_asset_links.target_type` values:
  - `offering`
  - `wedding_site`
  - `gallery`
  - `supplier`
  - `booking`
  - `organization`
  - `template`
- [x] Add `media_target_types` and `media_roles` config tables.
- [x] Standardize media roles:
  - `thumbnail`
  - `hero`
  - `gallery`
  - `preview`
  - `video`
  - `music`
  - `background`
  - `avatar`

## Phase 12: Wedding Domain

- [x] Keep:
  - `wedding_sites`
  - `wedding_site_pages`
  - `wedding_site_sections`
  - `wedding_site_guests`
  - `wedding_site_rsvps`
  - `wedding_site_events`
  - `wedding_site_galleries`
- [x] Reduce `wedding_sites.custom_data`; runtime writes template data into
  `wedding_site_sections`.
- [x] Move important wedding data into relational structures for sections,
  guests, RSVPs, and events.

## Phase 13: ID Standardization

- [x] Standardize all IDs to `text`.
- [x] Use one recommended ID family:
  - Current choice: nanoid-compatible 24 character IDs from `app_random_id()`.
- [x] Remove mixed `bigint` and `text` IDs.
- [x] Convert remaining user/menu/settings references:
  - `creator_service_offerings.provider_id`
  - affiliate, chat, content, provider fulfillment, and supplier user references
  - `navigation_menu_items.menu_id`
  - `app_settings.id`
- [x] Update foreign keys and app type assumptions together.

## Phase 14: Events And Realtime

- [x] Keep:
  - `activities`
  - `activity_actors`
  - `activity_targets`
  - `notifications`
- [x] Add `domain_events`.
- [x] Add `domain_event_types`.
- [x] Use event names like:
  - `offering.created`
  - `offering.updated`
  - `template.updated`
  - `provider.updated`
  - `site.published`
  - `booking.confirmed`
  - `payment.completed`
  - `rsvp.updated`
  - `provider.assigned`
- [x] Keep DB-driven realtime:
  - LISTEN/NOTIFY
  - change streams
  - subscriptions
- [x] Do not build yet:
  - Kafka
  - RabbitMQ
  - CQRS everywhere
  - websocket infrastructure
  - microservices

## Phase 15: Analytics And Regions

- [x] Add analytics tables:
  - `analytics_events`
  - `analytics_sessions`
  - `analytics_page_views`
- [x] Use analytics for SEO and template conversion optimization.
- [x] Keep region tables:
  - `regions`
  - `shipping_regions`
  - `service_regions`

## Implementation Rule

Every phase must update these docs in the same change:

- `docs/architecture-todo.md`
- `docs/schema.md`
- `docs/admin.md`
- `docs/structure.md`
- `docs/fields.md` when fields change
- `docs/realtime.md` when events/realtime change
