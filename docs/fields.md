# Fields

Use this file for project-wide rules around field schema, field editors, and rich-text field behavior.

## Scope

- Page-level custom fields stay registered in code per managed page.
- Whole-site shared custom fields live in `Admin > Global Fields` as code-registered global fields backed by `app_settings.global_fields_config`.
- Offering type field definitions live in relational
  `offering_type_fields` rows.
- Admin offering type editing lives in `Admin > Offerings > Offering Types`.
  It should manage relational fields, groups, validation rules, and conditional
  logic instead of writing duplicate JSON schema definitions.

## Schema Rules

- Treat the active schema source as the contract between admin data entry and
  frontend rendering: code schemas for managed/global fields, database schemas
  for offering type fields.
- When a page or feature moves to a new field structure, remove old field readers and legacy fallback branches instead of supporting both shapes.
- For complex managed-page fields, prefer top-to-bottom `section` groups and `repeater` collections so the editor order matches the public page layout.
- Keep related content inside the same section and use repeater item fields only for repeatable UI blocks such as socials, FAQs, cards, timelines, or lists.
- Schema `width`, `column`, and section `layout` are available only to editor
  surfaces that explicitly support multi-column layouts. They do not override
  the single-column contract of a vertical tab workspace.
- Use `type: "wysiwyg"` for reusable visual rich-text fields that should use the shared editor.
- Offering type fields should support the final field set documented in
  `docs/architecture.md`, including relation, repeater, media, gallery,
  blocks, and conditional field behavior.
- Offering type field groups should be represented by
  `offering_type_field_groups`, with stable `key`, visible `label`, sortable
  `sort_order`, and per-group `ui_config`.
- Runtime bootstrap now creates `offering_type_field_groups` and the
  `offering_type_fields.group_id`, `visibility_conditions`, and
  `dependency_conditions` columns. Admin offering create/edit forms render
  dynamic fields through the relational field rows and group visible fields into
  predictable sections.
- Field validation rules should use a predictable JSON shape that supports
  `min`, `max`, `regex`, `required`, `unique`, and `allowed_values`; the same
  rules are enforced in admin inputs where possible and in server-side
  create/update save paths.
- Dynamic fields are only for UI metadata, presentation, discovery, and
  optional structured fields.
- Never use dynamic fields for payments, permissions, inventory, critical
  business workflows, analytics, or booking core logic. Those domains must stay
  relational-first.
- Conditional rendering should be data-driven through `visibility_conditions`
  and `dependency_conditions` so forms can hide, show, or require fields based
  on other field values. The current renderer supports `equals`, `not_equals`,
  `in`, `empty`, and `not_empty` conditions.

## Editor Rules

- Use the shared `FieldsEditor` component for page fields, global fields, offering fields, and other custom-field editors.
- Media fields should use `type: "media"`, and gallery-style fields should set `multiple: true` so the shared selector stores arrays instead of newline-delimited URLs.
- Shared Media Library upload UI should accept multiple files even for single-value media fields; only the stored selection count should differ.
- Search-select fields must use the shared fixed-size dialog picker pattern: selected items render in the form, searching and choosing happen inside a scrollable dialog, and the dialog footer shows the selected count plus a confirm/close action.
- `type: "offering-select"` fields in `FieldsEditor`, offering relationship pickers, and the Media Library picker should stay visually aligned with that dialog picker pattern.
- Multi-value `offering-select` fields render selected offerings in stored
  order and provide drag handles for reordering. Reordering updates the value
  array directly so frontend rendering follows the admin-defined order.
- Top-level field groups render as tabs by default.
- Within the active tab, `section` and `repeater` content render as normal bordered blocks without nested accordion behavior.
- Vertical tab workspaces pass the shared editor's single-column mode. Every
  leaf field, section child, and repeater child renders full-width in schema
  order. A section declared with `layout: "two-columns"` must collapse to one
  column in this mode.
- Admin field UI should stay on default project component styling and only customize structural layout where needed.

## Rich Text Rules

- The shared rich-text editor is `Tiptap`.
- Managed page `Body Content` and schema fields with `type: "wysiwyg"` should use the same shared editor component.
- Rich text stores HTML.
- Save rich text through the shared normalization helpers in `web/src/lib/rich-text.ts`.
- Render rich text through the shared rich-text helpers and shared content class contract so lists, tables, images, and headings stay consistent across the project.

## Renderer Rules

- Renderer code should read the current schema shape directly from the registered field schema.
- Normalize only for validation and trimming.
- Do not hide missing CMS data behind hardcoded content fallbacks.
