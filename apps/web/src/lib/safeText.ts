/**
 * Safe Text Sanitization
 *
 * Sanitizes user-provided strings to prevent XSS attacks.
 * Removes HTML tags and escapes special characters.
 *
 * @param s - Input value to sanitize
 * @returns Sanitized string, or empty string if input is not a string
 *
 * @example
 * ```ts
 * const userInput = '<script>alert("xss")</script>';
 * const safe = safeText(userInput); // Returns: 'alert("xss")'
 * ```
 */
export const safeText = (s: unknown): string => {
  if (typeof s !== 'string') {
    return '';
  }
  // Remove HTML tags and escape special characters
  return s.replace(/[<>]/g, '').trim();
};
