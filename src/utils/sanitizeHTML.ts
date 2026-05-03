import sanitizeHtml from "sanitize-html";

export function clean(input: string) {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {}
  });
}
