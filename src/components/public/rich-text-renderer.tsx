import React from "react";
import Image from "next/image";
import {
  type RichTextDoc,
  type RichTextNode,
  type RichTextMark,
  isSafeUrl,
} from "@/lib/utils/rich-text";

interface RichTextRendererProps {
  content: RichTextDoc | null | undefined;
  className?: string;
}

/**
 * Server-side rich text renderer.
 * Converts editor JSON document to strictly allow-listed React elements.
 * Drops disallowed nodes, sanitises links (no javascript:), enforces noopener/noreferrer,
 * and renders images via Next.js Image component.
 *
 * Contains ZERO editor / tiptap bundle dependencies.
 */
export function RichTextRenderer({
  content,
  className = "",
}: RichTextRendererProps) {
  if (!content || !content.content || !Array.isArray(content.content)) {
    return null;
  }

  return (
    <div className={`prose-custom space-y-4 ${className}`.trim()}>
      {content.content.map((node, index) => renderNode(node, `node-${index}`))}
    </div>
  );
}

function renderNode(node: RichTextNode, key: string): React.ReactNode {
  switch (node.type) {
    case "paragraph": {
      const children = renderChildren(node.content, key);
      return (
        <p
          key={key}
          className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300"
        >
          {children && children.length > 0 ? children : "\u00A0"}
        </p>
      );
    }

    case "heading": {
      const rawLevel = Number(node.attrs?.level) || 2;
      // Clamp heading levels: Level 1 is reserved for the page title
      const level = Math.min(4, Math.max(2, rawLevel));
      const children = renderChildren(node.content, key);

      if (level === 2) {
        return (
          <h2
            key={key}
            className="mt-8 mb-4 font-serif text-2xl font-bold tracking-tight text-zinc-900 dark:text-white"
          >
            {children}
          </h2>
        );
      }
      if (level === 3) {
        return (
          <h3
            key={key}
            className="mt-6 mb-3 font-serif text-xl font-semibold tracking-tight text-zinc-900 dark:text-white"
          >
            {children}
          </h3>
        );
      }
      return (
        <h4
          key={key}
          className="mt-5 mb-2 font-serif text-lg font-semibold text-zinc-900 dark:text-white"
        >
          {children}
        </h4>
      );
    }

    case "bulletList": {
      return (
        <ul
          key={key}
          className="list-outside list-disc space-y-2 pl-6 text-zinc-700 dark:text-zinc-300"
        >
          {renderChildren(node.content, key)}
        </ul>
      );
    }

    case "orderedList": {
      return (
        <ol
          key={key}
          className="list-outside list-decimal space-y-2 pl-6 text-zinc-700 dark:text-zinc-300"
        >
          {renderChildren(node.content, key)}
        </ol>
      );
    }

    case "listItem": {
      return (
        <li key={key} className="leading-relaxed">
          {renderChildren(node.content, key)}
        </li>
      );
    }

    case "blockquote": {
      return (
        <blockquote
          key={key}
          className="my-4 rounded-r border-l-4 border-amber-600 bg-amber-50/30 py-1 pl-4 text-zinc-700 italic dark:bg-zinc-800/40 dark:text-zinc-300"
        >
          {renderChildren(node.content, key)}
        </blockquote>
      );
    }

    case "horizontalRule": {
      return (
        <hr
          key={key}
          className="my-8 border-t border-zinc-200 dark:border-zinc-800"
        />
      );
    }

    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      const width = Number(node.attrs?.width) || 1200;
      const height = Number(node.attrs?.height) || 800;

      if (!src || !isSafeUrl(src)) {
        return null;
      }

      return (
        <figure key={key} className="my-6">
          <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              className="h-auto w-full object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
            />
          </div>
          {alt ? (
            <figcaption className="mt-2 text-center text-xs text-zinc-500 italic dark:text-zinc-400">
              {alt}
            </figcaption>
          ) : null}
        </figure>
      );
    }

    case "text": {
      return renderTextWithMarks(node.text || "", node.marks, key);
    }

    default:
      // Drop any unknown or disallowed node type (e.g. table, raw HTML, script, etc.)
      return null;
  }
}

function renderChildren(
  content: RichTextNode[] | undefined,
  parentKey: string
): React.ReactNode[] {
  if (!content || !Array.isArray(content)) return [];
  return content
    .map((child, idx) => renderNode(child, `${parentKey}-${idx}`))
    .filter(Boolean);
}

function renderTextWithMarks(
  text: string,
  marks: RichTextMark[] | undefined,
  key: string
): React.ReactNode {
  if (!marks || marks.length === 0) {
    return <React.Fragment key={key}>{text}</React.Fragment>;
  }

  // Wrap marks recursively based on allow-list
  let currentElement: React.ReactNode = text;

  for (let i = 0; i < marks.length; i++) {
    const mark = marks[i];
    const markKey = `${key}-mark-${i}`;

    switch (mark.type) {
      case "bold":
        currentElement = (
          <strong
            key={markKey}
            className="font-semibold text-zinc-900 dark:text-white"
          >
            {currentElement}
          </strong>
        );
        break;

      case "italic":
        currentElement = <em key={markKey}>{currentElement}</em>;
        break;

      case "link": {
        const href =
          typeof mark.attrs?.href === "string" ? mark.attrs.href : "";
        if (!isSafeUrl(href)) {
          // Drop dangerous link (e.g. javascript:) while preserving the inner text
          break;
        }

        const isExternal =
          href.startsWith("http://") || href.startsWith("https://");

        currentElement = (
          <a
            key={markKey}
            href={href}
            className="text-amber-700 underline underline-offset-2 transition-colors hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
            {...(isExternal
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {currentElement}
          </a>
        );
        break;
      }

      default:
        // Drop any disallowed mark (e.g. color, font-family, highlight)
        break;
    }
  }

  return <React.Fragment key={key}>{currentElement}</React.Fragment>;
}
