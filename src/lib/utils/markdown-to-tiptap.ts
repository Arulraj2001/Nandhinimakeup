import { slugify } from "@/lib/utils/slug";
import type { RichTextDoc, RichTextNode } from "@/lib/utils/rich-text";
import {
  applyAutoInterlinks,
  type AppliedInterlink,
} from "@/lib/utils/auto-interlink";

export interface ParsedMarkdownFrontmatter {
  title?: string;
  slug?: string;
  category?: string;
  excerpt?: string;
  focus_keyword?: string;
  secondary_keywords?: string;
  seo_title?: string;
  seo_description?: string;
  author?: string;
  status?: "draft" | "published";
}

export interface ParsedMarkdownArticle {
  frontmatter: ParsedMarkdownFrontmatter;
  title: string;
  slug: string;
  excerpt: string;
  categoryName?: string;
  authorName?: string;
  seoTitle?: string;
  seoDescription?: string;
  focusKeyword?: string;
  secondaryKeywords?: string;
  content: RichTextDoc;
  rawBody: string;
  appliedInterlinks?: AppliedInterlink[];
  stats: {
    wordCount: number;
    headingsCount: number;
    paragraphsCount: number;
  };
}

/**
 * Parses inline markdown marks (bold, italic, links) into Tiptap text nodes.
 */
export function parseInlineMarkdown(text: string): RichTextNode[] {
  if (!text) return [];

  const nodes: RichTextNode[] = [];
  // Tokenizer pattern matching:
  // 1. Gold tag: [gold]text[/gold]
  // 2. Maroon tag: [maroon]text[/maroon]
  // 3. Highlight: ==text==
  // 4. Links: [text](url)
  // 5. Bold-Italic: ***text*** or ___text___
  // 6. Bold: **text** or __text__
  // 7. Italic: *text* or _text_
  const inlineRegex =
    /\[gold\]([\s\S]*?)\[\/gold\]|\[maroon\]([\s\S]*?)\[\/maroon\]|==([^=]+)==|\[([^\]]+)\]\(([^)]+)\)|\*\*\*([^*]+)\*\*\*|___([^_]+)___|\*\*([^*]+)\*\*|__([^_]+)__|(?<!\*)\*([^*]+)\*(?!\*)|(?<!_)_([^_]+)_(?!_)/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = inlineRegex.lastIndex;

    // Plain text before this match
    if (matchStart > lastIndex) {
      nodes.push({
        type: "text",
        text: text.slice(lastIndex, matchStart),
      });
    }

    if (match[1] !== undefined) {
      // Gold text: [gold]text[/gold]
      nodes.push({
        type: "text",
        text: match[1],
        marks: [{ type: "gold" }],
      });
    } else if (match[2] !== undefined) {
      // Maroon text: [maroon]text[/maroon]
      nodes.push({
        type: "text",
        text: match[2],
        marks: [{ type: "maroon" }],
      });
    } else if (match[3] !== undefined) {
      // Highlight: ==text==
      nodes.push({
        type: "text",
        text: match[3],
        marks: [{ type: "highlight" }],
      });
    } else if (match[4] !== undefined && match[5] !== undefined) {
      // Link [text](url)
      const linkText = match[4];
      const linkHref = match[5];
      nodes.push({
        type: "text",
        text: linkText,
        marks: [{ type: "link", attrs: { href: linkHref } }],
      });
    } else if (match[6] !== undefined || match[7] !== undefined) {
      // Bold + Italic ***text***
      const boldItalicText = match[6] ?? match[7];
      nodes.push({
        type: "text",
        text: boldItalicText,
        marks: [{ type: "bold" }, { type: "italic" }],
      });
    } else if (match[8] !== undefined || match[9] !== undefined) {
      // Bold **text**
      const boldText = match[8] ?? match[9];
      nodes.push({
        type: "text",
        text: boldText,
        marks: [{ type: "bold" }],
      });
    } else if (match[10] !== undefined || match[11] !== undefined) {
      // Italic *text*
      const italicText = match[10] ?? match[11];
      nodes.push({
        type: "text",
        text: italicText,
        marks: [{ type: "italic" }],
      });
    }

    lastIndex = matchEnd;
  }

  // Any remaining plain text
  if (lastIndex < text.length) {
    nodes.push({
      type: "text",
      text: text.slice(lastIndex),
    });
  }

  const filtered = nodes.filter(
    (n) => n.type !== "text" || (typeof n.text === "string" && n.text.length > 0)
  );

  if (filtered.length > 0) {
    return filtered;
  }

  return text ? [{ type: "text", text }] : [];
}

/**
 * Extracts YAML frontmatter key-values from raw text if present.
 */
export function extractFrontmatter(rawText: string): {
  frontmatter: ParsedMarkdownFrontmatter;
  body: string;
} {
  const trimmed = rawText.trim();
  const frontmatter: ParsedMarkdownFrontmatter = {};

  if (!trimmed.startsWith("---")) {
    return { frontmatter, body: trimmed };
  }

  // Find closing ---
  const secondDashIndex = trimmed.indexOf("---", 3);
  if (secondDashIndex === -1) {
    return { frontmatter, body: trimmed };
  }

  const rawFrontmatter = trimmed.slice(3, secondDashIndex).trim();
  const body = trimmed.slice(secondDashIndex + 3).trim();

  const lines = rawFrontmatter.split("\n");
  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const rawKey = line.slice(0, colonIndex).trim().toLowerCase();
    let rawVal = line.slice(colonIndex + 1).trim();

    // Strip surrounding quotes if present
    if (
      (rawVal.startsWith('"') && rawVal.endsWith('"')) ||
      (rawVal.startsWith("'") && rawVal.endsWith("'"))
    ) {
      rawVal = rawVal.slice(1, -1).trim();
    }

    switch (rawKey) {
      case "title":
        frontmatter.title = rawVal;
        break;
      case "slug":
        frontmatter.slug = rawVal;
        break;
      case "category":
        frontmatter.category = rawVal;
        break;
      case "excerpt":
        frontmatter.excerpt = rawVal;
        break;
      case "focus_keyword":
      case "focuskeyword":
      case "keyword":
        frontmatter.focus_keyword = rawVal;
        break;
      case "secondary_keywords":
      case "secondarykeywords":
      case "secondary_keyword":
      case "secondarykeyword":
      case "secondary":
        frontmatter.secondary_keywords = rawVal;
        break;
      case "seo_title":
      case "seotitle":
        frontmatter.seo_title = rawVal;
        break;
      case "seo_description":
      case "seodescription":
        frontmatter.seo_description = rawVal;
        break;
      case "author":
      case "author_name":
        frontmatter.author = rawVal;
        break;
      case "status":
        if (rawVal === "draft" || rawVal === "published") {
          frontmatter.status = rawVal;
        }
        break;
    }
  }

  return { frontmatter, body };
}

/**
 * Parses a full Markdown article (with optional Frontmatter) into a Tiptap RichTextDoc.
 */
export function parseMarkdownArticle(
  rawInput: string,
  options?: { enableAutoInterlinks?: boolean }
): ParsedMarkdownArticle {
  const { frontmatter, body } = extractFrontmatter(rawInput);
  const contentNodes: RichTextNode[] = [];

  const rawLines = body.split("\n");
  let inferredTitle: string | null = null;
  let inferredExcerpt: string | null = null;
  let inBulletList = false;
  let inOrderedList = false;
  let currentListItems: RichTextNode[] = [];

  const flushList = () => {
    if (inBulletList && currentListItems.length > 0) {
      contentNodes.push({
        type: "bulletList",
        content: [...currentListItems],
      });
      currentListItems = [];
      inBulletList = false;
    } else if (inOrderedList && currentListItems.length > 0) {
      contentNodes.push({
        type: "orderedList",
        content: [...currentListItems],
      });
      currentListItems = [];
      inOrderedList = false;
    }
  };

  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    const combinedText = paragraphBuffer.join(" ").trim();
    paragraphBuffer = [];

    if (!combinedText) return;

    if (!inferredExcerpt) {
      inferredExcerpt = combinedText.slice(0, 190);
    }

    contentNodes.push({
      type: "paragraph",
      content: parseInlineMarkdown(combinedText),
    });
  };

  let headingsCount = 0;
  let paragraphsCount = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const trimmedLine = rawLine.trim();

    // Empty line -> flush paragraph / list
    if (!trimmedLine) {
      flushParagraph();
      flushList();
      continue;
    }

    // Horizontal Rule
    if (/^(?:---|\*\*\*|___)$/.test(trimmedLine)) {
      flushParagraph();
      flushList();
      continue;
    }

    // Headings: # H1, ## H2, ### H3, #### H4
    const headingMatch = trimmedLine.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();

      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();

      // If H1 is at the top, always skip it from body so it doesn't duplicate the page's main <h1> title banner
      if (level === 1) {
        if (!frontmatter.title && !inferredTitle) {
          inferredTitle = headingText;
        }
        continue;
      }

      headingsCount++;
      contentNodes.push({
        type: "heading",
        attrs: { level },
        content: parseInlineMarkdown(headingText),
      });
      continue;
    }

    // Blockquote: > text
    if (trimmedLine.startsWith(">")) {
      flushParagraph();
      flushList();

      const quoteText = trimmedLine.replace(/^>\s*/, "").trim();
      contentNodes.push({
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: parseInlineMarkdown(quoteText),
          },
        ],
      });
      continue;
    }

    // Bullet List: - item or * item
    const bulletMatch = trimmedLine.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      if (inOrderedList) flushList();
      inBulletList = true;

      const itemText = bulletMatch[1].trim();
      currentListItems.push({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: parseInlineMarkdown(itemText),
          },
        ],
      });
      continue;
    }

    // Ordered List: 1. item
    const orderedMatch = trimmedLine.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      if (inBulletList) flushList();
      inOrderedList = true;

      const itemText = orderedMatch[1].trim();
      currentListItems.push({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: parseInlineMarkdown(itemText),
          },
        ],
      });
      continue;
    }

    // Markdown Table: | Col 1 | Col 2 |
    if (
      trimmedLine.startsWith("|") &&
      trimmedLine.endsWith("|") &&
      trimmedLine.includes("|")
    ) {
      flushParagraph();
      flushList();

      const tableLines: string[] = [];
      while (
        i < rawLines.length &&
        rawLines[i].trim().startsWith("|") &&
        rawLines[i].trim().endsWith("|")
      ) {
        tableLines.push(rawLines[i].trim());
        i++;
      }
      i--; // Balance the loop increment

      if (tableLines.length >= 2) {
        const headerCells = tableLines[0]
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim());

        const isSeparator = /^\|(?:\s*:?-+:?\s*\|)+$/.test(tableLines[1]);
        const dataStartIdx = isSeparator ? 2 : 1;

        const headerRowNode: RichTextNode = {
          type: "tableRow",
          content: headerCells.map((cellText) => ({
            type: "tableHeader",
            content: [
              {
                type: "paragraph",
                content: parseInlineMarkdown(cellText),
              },
            ],
          })),
        };

        const dataRowNodes: RichTextNode[] = [];
        for (let r = dataStartIdx; r < tableLines.length; r++) {
          const rowCells = tableLines[r]
            .slice(1, -1)
            .split("|")
            .map((c) => c.trim());

          dataRowNodes.push({
            type: "tableRow",
            content: rowCells.map((cellText) => ({
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: parseInlineMarkdown(cellText),
                },
              ],
            })),
          });
        }

        contentNodes.push({
          type: "table",
          content: [headerRowNode, ...dataRowNodes],
        });
      }
      continue;
    }

    // Regular line inside a paragraph
    paragraphsCount++;
    paragraphBuffer.push(trimmedLine);
  }

  // Flush any trailing elements
  flushParagraph();
  flushList();

  const finalTitle =
    frontmatter.title?.trim() ||
    inferredTitle ||
    "Untitled Imported Bridal Guide";

  const finalSlug =
    frontmatter.slug?.trim() || slugify(finalTitle) || "imported-article";

  const finalExcerpt =
    frontmatter.excerpt?.trim() ||
    inferredExcerpt ||
    finalTitle;

  // Calculate word count
  const allWords = body.split(/\s+/).filter(Boolean).length;

  let finalDoc: RichTextDoc = {
    type: "doc",
    content: contentNodes,
  };

  let appliedInterlinks: AppliedInterlink[] = [];

  if (options?.enableAutoInterlinks !== false) {
    const interlinkResult = applyAutoInterlinks(finalDoc);
    finalDoc = interlinkResult.doc;
    appliedInterlinks = interlinkResult.appliedLinks;
  }

  return {
    frontmatter,
    title: finalTitle,
    slug: finalSlug,
    excerpt: finalExcerpt,
    categoryName: frontmatter.category,
    authorName: frontmatter.author || "Nandhini",
    seoTitle: frontmatter.seo_title || finalTitle,
    seoDescription: frontmatter.seo_description || finalExcerpt,
    focusKeyword: frontmatter.focus_keyword,
    secondaryKeywords: frontmatter.secondary_keywords,
    content: finalDoc,
    rawBody: body,
    appliedInterlinks,
    stats: {
      wordCount: allWords,
      headingsCount,
      paragraphsCount,
    },
  };
}
