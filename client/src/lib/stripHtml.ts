/**
 * stripHtml: Convert a string that may contain HTML markup into plain text.
 *
 * Used for card previews / excerpts / summaries where only plain text should be
 * rendered. The full article body is rendered (sanitized) separately on the
 * detail page — never through this helper.
 *
 * This is DOM-free (safe in SSR/build contexts) and decodes common HTML
 * entities before stripping tags, so entities like `<p>` become literal
 * text rather than re-introducing tags.
 */
export function stripHtml(value: string | null | undefined): string {
  if (!value) return '';

  // Decode common HTML entities first so they render as literal characters
  // instead of being interpreted as markup. ORDER MATTERS: &amp; must decode
  // first so double-escaped entities like &amp;lt; become < and can then be
  // decoded by the subsequent replacements.
  const decoded = value
    .replace(/&amp;/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => {
      try {
        return String.fromCharCode(Number(code));
      } catch {
        return '';
      }
    });

  return decoded
    .replace(/<[^>]*>/g, ' ') // strip all tags -> spaces
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
}
