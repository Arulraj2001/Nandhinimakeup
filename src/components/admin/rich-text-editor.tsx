"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import { MediaPicker, getPublicMediaUrl } from "@/components/admin/media-picker";
import type { MediaItem } from "@/lib/actions/media";
import { type RichTextDoc, isSafeUrl } from "@/lib/utils/rich-text";

// Custom Image extension storing mediaId, width, and height attributes
const MediaImageExtension = ImageExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      mediaId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-media-id"),
        renderHTML: (attributes) => {
          if (!attributes.mediaId) return {};
          return { "data-media-id": attributes.mediaId };
        },
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    };
  },
});

interface RichTextEditorProps {
  value: RichTextDoc | null | undefined;
  onChange: (value: RichTextDoc) => void;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  minHeight = "280px",
  disabled = false,
}: RichTextEditorProps) {
  const [mediaPickerOpen, setMediaPickerOpen] = React.useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
        codeBlock: false,
        code: false,
        strike: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        protocols: ["http", "https", "mailto", "tel"],
        HTMLAttributes: {
          class: "text-amber-700 underline",
        },
      }),
      MediaImageExtension.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full my-4 border border-zinc-200 dark:border-zinc-800",
        },
      }),
    ],
    content: value || { type: "doc", content: [] },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getJSON() as RichTextDoc);
    },
  });

  // Sync value changes from parent if different
  React.useEffect(() => {
    if (!editor) return;
    const currentJson = JSON.stringify(editor.getJSON());
    const incomingJson = JSON.stringify(value || { type: "doc", content: [] });
    if (currentJson !== incomingJson) {
      editor.commands.setContent(value || { type: "doc", content: [] });
    }
  }, [value, editor]);

  // Sync disabled state
  React.useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) {
    return (
      <div
        className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 animate-pulse"
        style={{ minHeight }}
      />
    );
  }

  const handleSetLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL (https, http, mailto, tel, or relative /path):", previousUrl);

    // Cancelled
    if (url === null) return;

    // Empty URL -> unset
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    if (!isSafeUrl(url)) {
      alert("Invalid URL. Allowed protocols: https, http, mailto, tel, or relative /path");
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  };

  const handleMediaSelect = (selected: MediaItem[]) => {
    if (selected.length === 0) return;
    const media = selected[0];
    const src = getPublicMediaUrl(media.storage_path);

    editor
      .chain()
      .focus()
      .setImage({
        src,
        alt: media.alt_text || media.file_name,
        // @ts-expect-error Custom attributes
        mediaId: media.id,
        width: media.width,
        height: media.height,
      })
      .run();

    setMediaPickerOpen(false);
  };

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500 transition-all">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 text-xs">
        {/* Paragraph */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`px-2 py-1 rounded font-medium transition-colors ${
            editor.isActive("paragraph")
              ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300"
              : "text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
          title="Paragraph"
        >
          P
        </button>

        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded font-medium transition-colors ${
            editor.isActive("heading", { level: 2 })
              ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300"
              : "text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 rounded font-medium transition-colors ${
            editor.isActive("heading", { level: 3 })
              ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300"
              : "text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
          title="Heading 3"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          className={`px-2 py-1 rounded font-medium transition-colors ${
            editor.isActive("heading", { level: 4 })
              ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300"
              : "text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
          title="Heading 4"
        >
          H4
        </button>

        <span className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />

        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded font-bold transition-colors ${
            editor.isActive("bold")
              ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300"
              : "text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
          title="Bold (Ctrl+B)"
        >
          B
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded italic transition-colors ${
            editor.isActive("italic")
              ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300"
              : "text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
          title="Italic (Ctrl+I)"
        >
          I
        </button>

        <span className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded font-medium transition-colors ${
            editor.isActive("bulletList")
              ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300"
              : "text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
          title="Bullet List"
        >
          • List
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 rounded font-medium transition-colors ${
            editor.isActive("orderedList")
              ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300"
              : "text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
          title="Numbered List"
        >
          1. List
        </button>

        {/* Blockquote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-2 py-1 rounded font-serif italic transition-colors ${
            editor.isActive("blockquote")
              ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300"
              : "text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
          title="Quote"
        >
          “ ”
        </button>

        {/* Link */}
        <button
          type="button"
          onClick={handleSetLink}
          className={`px-2 py-1 rounded font-medium transition-colors ${
            editor.isActive("link")
              ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300"
              : "text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
          title="Link"
        >
          🔗 Link
        </button>

        {/* Horizontal Rule */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="px-2 py-1 rounded font-medium text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          title="Horizontal Rule"
        >
          ― Divider
        </button>

        {/* Media Image */}
        <button
          type="button"
          onClick={() => setMediaPickerOpen(true)}
          className="px-2 py-1 rounded font-medium text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1"
          title="Insert Media Image"
        >
          🖼 Image
        </button>

        <span className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />

        {/* Undo / Redo */}
        <button
          type="button"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
          className="px-2 py-1 rounded text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Undo"
        >
          ↩
        </button>
        <button
          type="button"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
          className="px-2 py-1 rounded text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Redo"
        >
          ↪
        </button>
      </div>

      {/* Editor Content Area */}
      <div
        className="p-4 cursor-text focus-within:outline-none"
        style={{ minHeight }}
        onClick={() => editor.commands.focus()}
      >
        <EditorContent
          editor={editor}
          className="prose-editor focus:outline-none [&_.tiptap]:focus:outline-none [&_.tiptap]:min-h-[220px]"
        />
      </div>

      {/* Media Picker Modal */}
      <MediaPicker
        open={mediaPickerOpen}
        mode="single"
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
