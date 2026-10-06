/** Editor-typed links: http(s), mailto, tel, site-relative and #anchors only. Anything else is dropped. */
export function safeHref(href: string | undefined): string {
  const value = (href ?? "").trim();
  if (!value) return "";
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  if (value.startsWith("/") || value.startsWith("#")) return value;
  // A bare domain like "facebook.com/genzeal" is a common paste.
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(value)) return `https://${value}`;
  return "";
}
