import type { RichTextDoc, RichTextNode, RichTextMark } from "@/lib/utils/rich-text";

export interface AutoLinkRule {
  url: string;
  label: string;
  keywords: string[];
  maxPerPost?: number;
}

export interface AppliedInterlink {
  keyword: string;
  matchedText: string;
  url: string;
  label: string;
}

export interface AutoInterlinkResult {
  doc: RichTextDoc;
  appliedLinks: AppliedInterlink[];
}

export const DEFAULT_AUTO_LINK_RULES: AutoLinkRule[] = [
  {
    url: "/services",
    label: "Bridal Services",
    keywords: [
      "HD bridal makeup",
      "bridal makeup packages",
      "bridal makeup artist",
      "muhurtham makeup",
      "airbrush bridal makeup",
      "airbrush makeup",
      "bridal makeup",
    ],
    maxPerPost: 1,
  },
  {
    url: "/jewellery",
    label: "Jewellery Rental",
    keywords: [
      "antique temple jewellery",
      "temple jewellery sets",
      "temple jewellery",
      "antique nagas jewellery",
      "antique nagas",
      "nagas jewellery",
      "bridal jewellery for rent",
      "jewellery rental",
      "rental jewellery",
    ],
    maxPerPost: 1,
  },
  {
    url: "/services/saree-draping",
    label: "Saree Draping",
    keywords: ["saree draping", "madisar draping"],
    maxPerPost: 1,
  },
  {
    url: "/gallery",
    label: "Bridal Portfolio",
    keywords: [
      "bridal portfolio",
      "real brides",
      "client reviews",
      "bride transformations",
    ],
    maxPerPost: 1,
  },
  {
    url: "/contact",
    label: "Studio & Contact",
    keywords: [
      "Salem studio",
      "book a consultation",
      "bridal consultation",
      "contact us on WhatsApp",
    ],
    maxPerPost: 1,
  },
  {
    url: "/about",
    label: "About Nandhini",
    keywords: ["Nandhini Makeup & Jewellery", "about Nandhini"],
    maxPerPost: 1,
  },
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface FlattenedKeyword {
  keyword: string;
  url: string;
  label: string;
  maxPerPost: number;
}

/**
 * Automatically applies internal links to high-intent keywords across a Tiptap document.
 * Adheres strictly to SEO safety rules:
 * - Never links inside headings (H1-H4) or table headers.
 * - Never links text that is already inside a link.
 * - Enforces max 1 link per target URL per post (avoids keyword stuffing).
 * - Matches longer keywords first (greedy matching).
 * - Preserves existing formatting marks (bold, italic, highlight, color).
 */
export function applyAutoInterlinks(
  doc: RichTextDoc,
  rules: AutoLinkRule[] = DEFAULT_AUTO_LINK_RULES
): AutoInterlinkResult {
  const appliedLinks: AppliedInterlink[] = [];
  const urlUsageCount = new Map<string, number>();

  // Flatten and sort keywords by length descending (greedy matching)
  const allKeywords: FlattenedKeyword[] = [];
  for (const rule of rules) {
    const max = rule.maxPerPost ?? 1;
    for (const kw of rule.keywords) {
      if (kw.trim()) {
        allKeywords.push({
          keyword: kw.trim(),
          url: rule.url,
          label: rule.label,
          maxPerPost: max,
        });
      }
    }
  }

  allKeywords.sort((a, b) => b.keyword.length - a.keyword.length);

  function canUseUrl(url: string, max: number): boolean {
    const current = urlUsageCount.get(url) || 0;
    return current < max;
  }

  function markUrlUsed(url: string) {
    const current = urlUsageCount.get(url) || 0;
    urlUsageCount.set(url, current + 1);
  }

  function transformTextNode(node: RichTextNode): RichTextNode[] {
    if (node.type !== "text" || !node.text) {
      return [node];
    }

    // If already inside a link mark, skip completely
    if (node.marks?.some((m) => m.type === "link")) {
      return [node];
    }

    const currentText = node.text;

    // Find the earliest active keyword match
    let earliestMatch: {
      index: number;
      length: number;
      matchedText: string;
      item: FlattenedKeyword;
    } | null = null;

    for (const item of allKeywords) {
      if (!canUseUrl(item.url, item.maxPerPost)) {
        continue;
      }

      // Match with word boundaries
      const regex = new RegExp(`\\b${escapeRegex(item.keyword)}\\b`, "i");
      const match = regex.exec(currentText);

      if (match) {
        const matchIndex = match.index;
        if (!earliestMatch || matchIndex < earliestMatch.index) {
          earliestMatch = {
            index: matchIndex,
            length: match[0].length,
            matchedText: match[0],
            item,
          };
        }
      }
    }

    if (!earliestMatch) {
      return [node];
    }

    // Split node into before, matched (with link), and after
    const beforeText = currentText.slice(0, earliestMatch.index);
    const matchedText = earliestMatch.matchedText;
    const afterText = currentText.slice(
      earliestMatch.index + earliestMatch.length
    );

    markUrlUsed(earliestMatch.item.url);
    appliedLinks.push({
      keyword: earliestMatch.item.keyword,
      matchedText,
      url: earliestMatch.item.url,
      label: earliestMatch.item.label,
    });

    const resultNodes: RichTextNode[] = [];

    // Before text
    if (beforeText) {
      resultNodes.push({
        type: "text",
        text: beforeText,
        marks: node.marks ? [...node.marks] : undefined,
      });
    }

    // Matched text with link mark appended to existing marks
    const linkMark: RichTextMark = {
      type: "link",
      attrs: { href: earliestMatch.item.url },
    };
    const combinedMarks: RichTextMark[] = node.marks
      ? [...node.marks, linkMark]
      : [linkMark];

    resultNodes.push({
      type: "text",
      text: matchedText,
      marks: combinedMarks,
    });

    // After text: recursively process to find other keywords if available
    if (afterText) {
      const remainingNode: RichTextNode = {
        type: "text",
        text: afterText,
        marks: node.marks ? [...node.marks] : undefined,
      };
      resultNodes.push(...transformTextNode(remainingNode));
    }

    return resultNodes;
  }

  function processNode(node: RichTextNode): RichTextNode {
    // 1. Heading Protection: Never link inside headings
    if (node.type === "heading" || node.type === "tableHeader") {
      return node;
    }

    // 2. Leaf text nodes
    if (node.type === "text") {
      const transformed = transformTextNode(node);
      // If single node returned, keep it, otherwise caller must handle array
      return transformed[0] || node;
    }

    // 3. Container nodes (paragraphs, listItems, tableCells, blockquotes)
    if (node.content && Array.isArray(node.content)) {
      const newContent: RichTextNode[] = [];

      for (const child of node.content) {
        if (child.type === "text") {
          newContent.push(...transformTextNode(child));
        } else {
          newContent.push(processNode(child));
        }
      }

      return {
        ...node,
        content: newContent,
      };
    }

    return node;
  }

  if (!doc.content || !Array.isArray(doc.content)) {
    return { doc, appliedLinks: [] };
  }

  const updatedContent = doc.content.map((node) => processNode(node));

  return {
    doc: {
      type: "doc",
      content: updatedContent,
    },
    appliedLinks,
  };
}
