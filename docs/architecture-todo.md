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
- [x] Move `offering_types.field_schema` JSONB into relational field rows.
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
- [ ] Build full dynamic admin form renderer from `offering_type_fields`.
- [ ] Dynamic admin renderer must support:
  - auto forms
  - validation
  - sections
  - repeaters
  - relations
  - media upload
  - blocks
  - conditional fields

## Phase 4: Admin Offering UX

- [ ] Make `/admin/offerings` an overview dashboard, not the main table.
- [ ] Move table management to a dedicated route such as `/admin/offerings/list`.
- [ ] Keep every management screen in the same table style as current offerings.
- [ ] Use dedicated table screens for:
  - offerings
  - offering types
  - offering type fields
  - categories
  - template attributes
  - bundles
  - providers
- [ ] Overview should show catalog health, recent offerings, type counts, draft
  counts, missing media, and shortcuts to management tables.

## Phase 5: Offering Config Rule

- [ ] Keep `offerings.config`.
- [ ] Use `offerings.config` only for:
  - UI configs
  - lightweight metadata
  - flexible configs
- [ ] Do not store these in `offerings.config`:
  - analytics
  - inventory
  - guests
  - orders
  - permissions
  - business-critical relations

## Phase 6: Template Attribute And Discovery

- [ ] Add `template_attributes`.
- [ ] Add `template_attribute_values`.
- [ ] Support attribute types:
  - `style`
  - `theme`
  - `mood`
  - `culture`
  - `color`
  - `season`
  - `event_type`
- [ ] Keep template discovery tables:
  - `template_tags`
  - `template_styles`
  - `template_categories`
  - `template_analytics`
  - `template_views`
  - `template_shares`
  - `template_conversions`

## Phase 7: Search Documents

- [ ] Add `offering_search_documents`.
- [ ] Required columns:
  - `offering_id`
  - `search_text`
  - `filter_json`
  - `embedding`
- [ ] Use search documents for dynamic fields that are difficult to query
  directly.

## Phase 8: Universal Provider System

- [ ] Replace separate provider mindsets such as `vendors`, `creator_profiles`,
  and future `studios` with:
  - `providers`
  - `provider_profiles`
  - `provider_services`
  - `provider_reviews`
  - `provider_regions`
- [ ] Support `provider_type` values:
  - `vendor`
  - `creator`
  - `studio`
  - `planner`
  - `makeup`
  - `florist`
  - `photographer`
- [ ] Refactor booking assignments from:
  - `vendor_id`
  - `creator_profile_id`
- [ ] To:
  - `provider_type`
  - `provider_id`

## Phase 9: Packages And Availability

- [ ] Add `offering_bundles`.
- [ ] Add `offering_bundle_items`.
- [ ] Support wedding packages that combine:
  - online invitation
  - paper invitation
  - studio
  - planner
  - makeup
- [ ] Add availability tables:
  - `provider_availability`
  - `provider_time_slots`
  - `booking_calendars`

## Phase 10: Organization System

- [ ] Add `organizations`.
- [ ] Add `organization_members`.
- [ ] Add `organization_roles`.
- [ ] Support studios, teams, vendors, and creator groups.

## Phase 11: Media System

- [ ] Keep `media_assets`.
- [ ] Keep `media_asset_links`.
- [ ] Standardize `media_asset_links.target_type` values:
  - `offering`
  - `wedding_site`
  - `gallery`
  - `provider`
  - `booking`
  - `template`
- [ ] Standardize media roles:
  - `thumbnail`
  - `hero`
  - `gallery`
  - `preview`
  - `video`
  - `music`
  - `background`
  - `avatar`

## Phase 12: Wedding Domain

- [ ] Keep:
  - `wedding_sites`
  - `wedding_site_pages`
  - `wedding_site_sections`
  - `wedding_site_guests`
  - `wedding_site_rsvps`
  - `wedding_site_events`
  - `wedding_site_galleries`
- [ ] Reduce `wedding_sites.custom_data` over time.
- [ ] Move important wedding data into relational structures.

## Phase 13: ID Standardization

- [ ] Standardize all IDs to `text`.
- [ ] Use one recommended ID family:
  - `cuid2`
  - `ulid`
  - `nanoid`
- [ ] Remove mixed `bigint` and `text` IDs.
- [ ] Update foreign keys and app type assumptions together.

## Phase 14: Events And Realtime

- [ ] Keep:
  - `activities`
  - `activity_actors`
  - `activity_targets`
  - `notifications`
- [ ] Add `domain_events`.
- [ ] Use event names like:
  - `offering.created`
  - `booking.confirmed`
  - `payment.completed`
  - `rsvp.updated`
  - `provider.assigned`
- [ ] Keep DB-driven realtime:
  - LISTEN/NOTIFY
  - change streams
  - subscriptions
- [ ] Do not build yet:
  - Kafka
  - RabbitMQ
  - CQRS everywhere
  - websocket infrastructure
  - microservices

## Phase 15: Analytics And Regions

- [ ] Add analytics tables:
  - `analytics_events`
  - `analytics_sessions`
  - `analytics_page_views`
- [ ] Use analytics for SEO and template conversion optimization.
- [ ] Keep region tables:
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
