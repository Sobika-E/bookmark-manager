import { describe, it, expect } from 'bun:test';
import { ValidationError, validateBookmarkTitle, validateBookmarkUrl } from '../src/validation/bookmarkValidation.js';

describe('Bookmark Validation', () => {
  describe('validateBookmarkTitle', () => {
    it('should accept valid title', () => {
      expect(() => validateBookmarkTitle('My Bookmark')).not.toThrow();
    });

    it('should reject empty title', () => {
      expect(() => validateBookmarkTitle('')).toThrow(ValidationError);
      expect(() => validateBookmarkTitle('')).toThrow('Bookmark title cannot be empty');
    });

    it('should reject whitespace-only title', () => {
      expect(() => validateBookmarkTitle('   ')).toThrow(ValidationError);
      expect(() => validateBookmarkTitle('   ')).toThrow('Bookmark title cannot be empty');
    });

    it('should trim title before validation', () => {
      expect(() => validateBookmarkTitle('  Valid Title  ')).not.toThrow();
    });
  });

  describe('validateBookmarkUrl', () => {
    it('should accept valid URL', () => {
      expect(() => validateBookmarkUrl('https://github.com')).not.toThrow();
      expect(() => validateBookmarkUrl('http://example.com')).not.toThrow();
    });

    it('should reject invalid URL', () => {
      expect(() => validateBookmarkUrl('hello')).toThrow(ValidationError);
      expect(() => validateBookmarkUrl('hello')).toThrow('Invalid bookmark URL');
    });

    it('should reject malformed URL', () => {
      expect(() => validateBookmarkUrl('not-a-url')).toThrow(ValidationError);
    });
  });
});
