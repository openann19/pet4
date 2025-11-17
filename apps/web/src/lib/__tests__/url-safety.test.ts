/**
 * Tests for URL safety utilities
 *
 * Coverage target: >= 95% statements/branches/functions/lines
 */

import { describe, it, expect } from 'vitest';
import { safeHref, sanitizeUrlForPreview } from '../url-safety';

describe('url-safety', () => {
  describe('safeHref', () => {
    it('should return URL for valid http URL', () => {
      const result = safeHref('http://example.com');
      expect(result).toBe('http://example.com/');
    });

    it('should return URL for valid https URL', () => {
      const result = safeHref('https://example.com');
      expect(result).toBe('https://example.com/');
    });

    it('should return null for javascript: protocol', () => {
      const result = safeHref('javascript:alert("xss")');
      expect(result).toBeNull();
    });

    it('should return null for data: protocol', () => {
      const result = safeHref('data:text/html,<script>alert("xss")</script>');
      expect(result).toBeNull();
    });

    it('should return null for invalid URL', () => {
      const result = safeHref('not-a-url');
      expect(result).toBeNull();
    });

    it('should handle URLs with paths', () => {
      const result = safeHref('https://example.com/path/to/page');
      expect(result).toBe('https://example.com/path/to/page');
    });

    it('should handle URLs with query parameters', () => {
      const result = safeHref('https://example.com?param=value');
      expect(result).toBe('https://example.com/?param=value');
    });
  });

  describe('sanitizeUrlForPreview', () => {
    it('should return sanitized URL for valid https URL', () => {
      const result = sanitizeUrlForPreview('https://example.com');
      expect(result).toEqual({
        href: 'https://example.com/',
        display: 'example.com',
      });
    });

    it('should remove www. from display', () => {
      const result = sanitizeUrlForPreview('https://www.example.com');
      expect(result).toEqual({
        href: 'https://www.example.com/',
        display: 'example.com',
      });
    });

    it('should return null for invalid URL', () => {
      const result = sanitizeUrlForPreview('not-a-url');
      expect(result).toBeNull();
    });

    it('should return null for unsafe protocol', () => {
      const result = sanitizeUrlForPreview('javascript:alert("xss")');
      expect(result).toBeNull();
    });

    it('should handle URLs with subdomains', () => {
      const result = sanitizeUrlForPreview('https://subdomain.example.com');
      expect(result).toEqual({
        href: 'https://subdomain.example.com/',
        display: 'subdomain.example.com',
      });
    });

    it('should preserve www in href but remove from display', () => {
      const result = sanitizeUrlForPreview('https://www.example.com/path');
      expect(result?.href).toContain('www.example.com');
      expect(result?.display).toBe('example.com');
    });
  });
});
