import type { Data } from "@puckeditor/core";

const HTML_TAG = /<\/?[a-z][\s\S]*>/i;

export function looksLikeHtml(value: string): boolean {
  return HTML_TAG.test(value);
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Plain text from before rich text: blank lines split paragraphs, single newlines become <br>. */
export function plainToHtml(value: string): string {
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

type FieldShape = { type?: unknown; arrayFields?: Record<string, FieldShape> };
type ConfigShape = { components: Record<string, { fields?: Record<string, FieldShape> }> };
type ComponentItem = { type: string; props: Record<string, unknown> };

function isComponentItem(value: unknown): value is ComponentItem {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ComponentItem).type === "string" &&
    typeof (value as ComponentItem).props === "object" &&
    (value as ComponentItem).props !== null
  );
}

function upgradeValue(value: unknown): unknown {
  return typeof value === "string" && value && !looksLikeHtml(value) ? plainToHtml(value) : value;
}

/** Applies the upgrade to every richtext field, including those inside array items. */
function upgradeFields(props: Record<string, unknown>, fields: Record<string, FieldShape>): Record<string, unknown> {
  const next = { ...props };
  for (const [key, field] of Object.entries(fields)) {
    if (field.type === "richtext") {
      next[key] = upgradeValue(props[key]);
    } else if (field.type === "array" && field.arrayFields && Array.isArray(props[key])) {
      const arrayFields = field.arrayFields;
      next[key] = (props[key] as unknown[]).map((item) =>
        typeof item === "object" && item !== null ? upgradeFields(item as Record<string, unknown>, arrayFields) : item,
      );
    }
  }
  return next;
}

function upgradeItem(item: ComponentItem, config: ConfigShape): ComponentItem {
  const fields = config.components[item.type]?.fields ?? {};
  const props = upgradeFields(item.props, fields);
  // Slots: any prop holding a list of components.
  for (const [key, value] of Object.entries(props)) {
    if (Array.isArray(value) && value.length > 0 && value.every(isComponentItem)) {
      props[key] = value.map((child) => upgradeItem(child, config));
    }
  }
  return { ...item, props };
}

/**
 * Pages saved before rich text store plain strings in fields that are now
 * richtext. Puck would read those as one run of text, so they are turned into
 * <p> HTML before the editor or the public render sees them. Returns a copy.
 */
export function upgradeLegacyRichText(data: Data, config: ConfigShape): Data {
  return {
    ...data,
    content: (data.content ?? []).map((item) => upgradeItem(item as ComponentItem, config)) as Data["content"],
  };
}
