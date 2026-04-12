const BLOCK_TAG_PATTERN = /<(p|div|h1|h2|h3|h4|h5|h6|ul|ol|li|blockquote|pre|code|hr|img|table|thead|tbody|tr|td|th)\b/i;

export const RICH_TEXT_CONTENT_CLASSNAME =
  "max-w-none text-sm leading-8 text-stone-700 md:text-base lg:text-lg " +
  "[&_a]:underline [&_a]:underline-offset-4 " +
  "[&_blockquote]:border-l-4 [&_blockquote]:border-stone-300 [&_blockquote]:pl-4 [&_blockquote]:italic " +
  "[&_code]:rounded [&_code]:bg-stone-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em] " +
  "[&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:text-stone-950 " +
  "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-stone-950 " +
  "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-stone-950 " +
  "[&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-stone-950 " +
  "[&_hr]:my-6 [&_hr]:border-stone-200 " +
  "[&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg " +
  "[&_li]:my-1.5 " +
  "[&_ol]:list-decimal [&_ol]:pl-6 " +
  "[&_p]:my-0 " +
  "[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-stone-950 [&_pre]:p-4 [&_pre]:text-stone-100 " +
  "[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden " +
  "[&_td]:border [&_td]:border-stone-200 [&_td]:px-3 [&_td]:py-2 " +
  "[&_th]:border [&_th]:border-stone-200 [&_th]:bg-stone-100 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-stone-950 " +
  "[&_ul]:list-disc [&_ul]:pl-6 " +
  "[&>*+*]:mt-4";

export function normalizeRichTextHtml(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.includes("<") && trimmed.includes(">")) {
    return sanitizeRichTextHtml(trimmed);
  }

  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function sanitizeRichTextHtml(input: string): string {
  let html = input;

  html = html.replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  html = html.replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?\s*>/gi, "");
  html = html.replace(/\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "");
  html = html.replace(/\s(href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi, "");
  html = html.replace(
    /<(?!\/?(p|br|strong|b|em|i|u|s|strike|ul|ol|li|a|h1|h2|h3|h4|h5|h6|blockquote|pre|code|hr|img|table|thead|tbody|tr|td|th)\b)[^>]*>/gi,
    "",
  );

  html = html
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/<p>(\s|&nbsp;)*<br\s*\/?>(\s|&nbsp;)*<\/p>/gi, "")
    .trim();

  if (!BLOCK_TAG_PATTERN.test(html) && html) {
    return `<p>${html}</p>`;
  }

  return html;
}

export function createRichTextMarkup(input?: string | null) {
  return { __html: sanitizeRichTextHtml(input || "") };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
