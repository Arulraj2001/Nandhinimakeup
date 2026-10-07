export interface RichTextMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface RichTextNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichTextNode[];
  marks?: RichTextMark[];
  text?: string;
}

export interface RichTextDoc {
  type: "doc";
  content?: RichTextNode[];
}

/**
 * Extracts all plain text from a stored rich text JSON document.
 * Block elements are separated by spaces/newlines for natural excerpts.
 */
export function extractPlainText(doc: RichTextDoc | RichTextNode | null | undefined): string {
  if (!doc) return "";

  const chunks: string[] = [];

  function walk(node: RichTextNode | RichTextDoc) {
    if ("text" in node && typeof node.text === "string") {
      chunks.push(node.text);
    }

    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        walk(child);
      }
      // Add whitespace after block containers
      if (
        [
          "paragraph",
          "heading",
          "blockquote",
          "listItem",
          "bulletList",
          "orderedList",
        ].includes(node.type)
      ) {
        chunks.push(" ");
      }
    }
  }

  walk(doc);

  return chunks.join("").replace(/\s+/g, " ").trim();
}

/**
 * Calculates reading time in minutes based on 200 words per minute.
 * Minimum is 1 minute.
 */
export function calculateReadingTime(
  content: RichTextDoc | string | null | undefined
): number {
  if (!content) return 1;

  const text = typeof content === "string" ? content : extractPlainText(content);
  if (!text) return 1;

  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount === 0) return 1;

  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Returns true if a rich text document has no meaningful content (no text and no images).
 */
export function isEmptyRichText(doc: RichTextDoc | null | undefined): boolean {
  if (!doc || !doc.content || doc.content.length === 0) return true;

  let hasContent = false;

  function walk(node: RichTextNode | RichTextDoc) {
    if (hasContent) return;
    if (node.type === "image") {
      hasContent = true;
      return;
    }
    if (
      "text" in node &&
      typeof node.text === "string" &&
      node.text.trim().length > 0
    ) {
      hasContent = true;
      return;
    }
    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        walk(child);
      }
    }
  }

  walk(doc);
  return !hasContent;
}

/**
 * Validates links: only https, http, mailto, tel and relative paths allowed.
 * Prevents javascript:, data:, and other malicious schemes.
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();

  // Safe relative paths or anchors
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("./")
  ) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return ["https:", "http:", "mailto:", "tel:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
