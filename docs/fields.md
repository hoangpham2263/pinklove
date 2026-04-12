# Fields

Use this file for project-wide rules around field schema, field editors, and rich-text field behavior.

## Scope

- Page-level custom fields stay registered in code per managed page.
- Whole-site shared custom fields live in `Admin > Global Fields` as code-registered global fields backed by `app_settings.global_fields_config`.

## Schema Rules

- Treat the code schema as the only active contract between admin data entry and frontend rendering.
- When a page or feature moves to a new field structure, remove old field readers and legacy fallback branches instead of supporting both shapes.
- For complex managed-page fields, prefer top-to-bottom `section` groups and `repeater` collections so the editor order matches the public page layout.
- Keep related content inside the same section and use repeater item fields only for repeatable UI blocks such as socials, FAQs, cards, timelines, or lists.
- Use per-field `width` in the schema for admin layout control instead of hardcoded renderer grid presets.
- Use `type: "wysiwyg"` for reusable visual rich-text fields that should use the shared editor.

## Editor Rules

- Use the shared `FieldsEditor` component for page fields, global fields, product fields, and other custom-field editors.
- Top-level field groups render as tabs by default.
- Within the active tab, `section` and `repeater` content render as normal bordered blocks without nested accordion behavior.
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
