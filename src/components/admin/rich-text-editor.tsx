"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import {
  MediaPicker,
  getPublicMediaUrl,
} from "@/components/admin/media-picker";
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
          class:
            "rounded-lg max-w-full my-4 border border-zinc-200",
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
        className="animate-pulse rounded-lg border border-zinc-200 bg-zinc-50"
        style={{ minHeight }}
      />
    );
  }

  const handleSetLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt(
      "Enter URL (https, http, mailto, tel, or relative /path):",
      previousUrl
    );

    // Cancelled
    if (url === null) return;

    // Empty URL -> unset
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    if (!isSafeUrl(url)) {
      alert(
        "Invalid URL. Allowed protocols: https, http, mailto, tel, or relative /path"
      );
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
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xs transition-all focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-zinc-50 p-2 text-xs">
        {/* Paragraph */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`rounded px-2 py-1 font-medium transition-colors ${
            editor.isActive("paragraph")
              ? "bg-amber-100 text-amber-900 font-semibold"
              : "text-zinc-700 hover:bg-zinc-200"
          }`}
          title="Paragraph"
        >
          P
        </button>

        {/* Headings */}
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`rounded px-2 py-1 font-medium transition-colors ${
            editor.isActive("heading", { level: 2 })
              ? "bg-amber-100 text-amber-900 font-semibold"
              : "text-zinc-700 hover:bg-zinc-200"
          }`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={`rounded px-2 py-1 font-medium transition-colors ${
            editor.isActive("heading", { level: 3 })
              ? "bg-amber-100 text-amber-900 font-semibold"
              : "text-zinc-700 hover:bg-zinc-200"
          }`}
          title="Heading 3"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 4 }).run()
          }
          className={`rounded px-2 py-1 font-medium transition-colors ${
            editor.isActive("heading", { level: 4 })
              ? "bg-amber-100 text-amber-900 font-semibold"
              : "text-zinc-700 hover:bg-zinc-200"
          }`}
          title="Heading 4"
        >
          H4
        </button>

        <span className="mx-1 h-4 w-px bg-zinc-300" />

        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded px-2 py-1 font-bold transition-colors ${
            editor.isActive("bold")
              ? "bg-amber-100 text-amber-900 font-bold"
              : "text-zinc-700 hover:bg-zinc-200"
          }`}
          title="Bold (Ctrl+B)"
        >
          B
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded px-2 py-1 italic transition-colors ${
            editor.isActive("italic")
              ? "bg-amber-100 text-amber-900 font-semibold"
              : "text-zinc-700 hover:bg-zinc-200"
          }`}
          title="Italic (Ctrl+I)"
        >
          I
        </button>

        <span className="mx-1 h-4 w-px bg-zinc-300" />

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded px-2 py-1 font-medium transition-colors ${
            editor.isActive("bulletList")
              ? "bg-amber-100 text-amber-900 font-semibold"
              : "text-zinc-700 hover:bg-zinc-200"
          }`}
          title="Bullet List"
        >
          • List
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded px-2 py-1 font-medium transition-colors ${
            editor.isActive("orderedList")
              ? "bg-amber-100 text-amber-900 font-semibold"
              : "text-zinc-700 hover:bg-zinc-200"
          }`}
          title="Numbered List"
        >
          1. List
        </button>

        {/* Blockquote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`rounded px-2 py-1 font-serif italic transition-colors ${
            editor.isActive("blockquote")
              ? "bg-amber-100 text-amber-900 font-semibold"
              : "text-zinc-700 hover:bg-zinc-200"
          }`}
          title="Quote"
        >
          “ ”
        </button>

        {/* Link */}
        <button
          type="button"
          onClick={handleSetLink}
          className={`rounded px-2 py-1 font-medium transition-colors ${
            editor.isActive("link")
              ? "bg-amber-100 text-amber-900 font-semibold"
              : "text-zinc-700 hover:bg-zinc-200"
          }`}
          title="Link"
        >
          🔗 Link
        </button>

        {/* Horizontal Rule */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="rounded px-2 py-1 font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
          title="Horizontal Rule"
        >
          ― Divider
        </button>

        {/* Media Image */}
        <button
          type="button"
          onClick={() => setMediaPickerOpen(true)}
          className="flex items-center gap-1 rounded px-2 py-1 font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
          title="Insert Media Image"
        >
          🖼 Image
        </button>

        <span className="mx-1 h-4 w-px bg-zinc-300" />

        {/* Undo / Redo */}
        <button
          type="button"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
          className="rounded px-2 py-1 text-zinc-700 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
          title="Undo"
        >
          ↩
        </button>
        <button
          type="button"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
          className="rounded px-2 py-1 text-zinc-700 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
          title="Redo"
        >
          ↪
        </button>
      </div>

      {/* Editor Content Area */}
      <div
        className="cursor-text bg-white p-4 text-zinc-900 focus-within:outline-none"
        style={{ minHeight }}
        onClick={() => editor.commands.focus()}
      >
        <EditorContent
          editor={editor}
          className="prose-editor text-zinc-900 focus:outline-none [&_.tiptap]:min-h-[220px] [&_.tiptap]:text-zinc-900 [&_.tiptap]:focus:outline-none [&_.tiptap_p]:mb-3 [&_.tiptap_p]:leading-relaxed [&_.tiptap_p]:text-zinc-900 [&_.tiptap_h2]:mb-2 [&_.tiptap_h2]:mt-4 [&_.tiptap_h2]:font-heading [&_.tiptap_h2]:text-2xl [&_.tiptap_h2]:font-bold [&_.tiptap_h2]:text-zinc-900 [&_.tiptap_h3]:mb-2 [&_.tiptap_h3]:mt-3 [&_.tiptap_h3]:font-heading [&_.tiptap_h3]:text-xl [&_.tiptap_h3]:font-semibold [&_.tiptap_h3]:text-zinc-900 [&_.tiptap_h4]:mb-1 [&_.tiptap_h4]:mt-2 [&_.tiptap_h4]:font-heading [&_.tiptap_h4]:text-lg [&_.tiptap_h4]:font-semibold [&_.tiptap_h4]:text-zinc-900 [&_.tiptap_ul]:my-2 [&_.tiptap_ul]:ml-5 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:text-zinc-900 [&_.tiptap_ol]:my-2 [&_.tiptap_ol]:ml-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:text-zinc-900 [&_.tiptap_blockquote]:my-3 [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-amber-600 [&_.tiptap_blockquote]:pl-4 [&_.tiptap_blockquote]:italic [&_.tiptap_blockquote]:text-zinc-700 [&_.tiptap_a]:text-amber-700 [&_.tiptap_a]:underline"
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
