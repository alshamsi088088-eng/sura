export function generateSlug(title: string): string {
  const input = (title ?? '').trim();
  if (!input) return '';

  // Keep Arabic characters (SEO/URL readability requirement):
  // - Replace whitespace with hyphens
  // - Strip symbols except unicode letters/numbers and Arabic/English ranges
  // - Collapse consecutive hyphens
  const lowered = input.toLowerCase();

  // Replace any whitespace sequence with hyphen
  const hyphenated = lowered.replace(/\s+/g, '-');

  // Remove everything except:
  // - English letters/digits
  // - Arabic letters/digits
  // - hyphen
  // Unicode ranges:
  //   Arabic: \u0600-\u06FF (covers main Arabic blocks)
  //   Arabic-Indic digits: \u0660-\u0669
  //   Extended Arabic: \u0750-\u077F, \u08A0-\u08FF
  const cleaned = hyphenated.replace(/[^a-z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0660-\u0669-]/g, '');

  // Collapse multiple hyphens and trim
  return cleaned.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

