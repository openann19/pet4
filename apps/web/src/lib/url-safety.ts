/**
 * URL Safety Utilities
 *
 * Sanitize and validate URLs for safe rendering in chat previews
 */

export function safeHref(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (!['http:', 'https:'].includes(u.protocol)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function sanitizeUrlForPreview(url: string): { href: string; display: string } | null {
  const safe = safeHref(url);
  if (!safe) return null;

  try {
    const u = new URL(safe);
    return {
      href: safe,
      display: u.hostname.replace(/^www\./, ''),
    };
  } catch {
    return null;
  }
}
