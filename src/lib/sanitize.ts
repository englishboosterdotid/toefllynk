/**
 * Security utilities for XSS prevention
 */
import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - Raw HTML string
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export function sanitize(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "b", "i", "em", "strong", "u", "p", "br", "span",
      "div", "ul", "ol", "li", "a", "h1", "h2", "h3", "h4", "h5", "h6",
      "blockquote", "pre", "code",
    ],
    ALLOWED_ATTR: ["href", "target", "class", "style"],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize text content (strip all HTML)
 * @param dirty - Raw text that may contain HTML
 * @returns Plain text without HTML tags
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize and return safe HTML for rich text editing
 * Used for admin-created content like question explanations
 */
export function sanitizeRichText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "b", "em", "i", "u", "s",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "span", "div", "a",
    ],
    ALLOWED_ATTR: ["href", "target", "class", "style"],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["script", "style", "iframe", "form", "input"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  });
}