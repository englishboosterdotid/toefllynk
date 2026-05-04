"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorId = useRef(`editor-${Math.random().toString(36).substr(2, 9)}`);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || "Ketik di sini...",
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive,
    disabled,
    title,
    children,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-2 rounded-lg transition-all duration-200 flex items-center justify-center",
        isActive
          ? "bg-blue-600 text-white shadow-md"
          : "hover:bg-slate-100 text-slate-600 hover:text-slate-900",
        disabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn("rounded-xl border-2 border-slate-200 overflow-hidden bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all", className)}>
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 p-2 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(
              "px-2 py-1.5 rounded-lg text-xs font-bold transition-all",
              editor.isActive("heading", { level: 1 })
                ? "bg-blue-600 text-white"
                : "hover:bg-slate-100 text-slate-600"
            )}
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              "px-2 py-1.5 rounded-lg text-xs font-bold transition-all",
              editor.isActive("heading", { level: 2 })
                ? "bg-blue-600 text-white"
                : "hover:bg-slate-100 text-slate-600"
            )}
            title="Heading 2"
          >
            H2
          </button>
        </div>

        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Line"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="ml-auto text-xs text-slate-400 pr-2 hidden sm:block">
          {editor.storage.characterCount?.characters?.() || 0} chars
        </div>
      </div>

      {/* Editor Content */}
      <div id={editorId.current} className="relative">
        <EditorContent
          editor={editor}
          className="focus:outline-none"
        />
      </div>

      {/* Custom Styles via CSS */}
      <style jsx>{`
        #${editorId.current} :global(.ProseMirror) {
          padding: 16px 20px;
          min-height: 150px;
          max-height: 400px;
          overflow-y: auto;
          outline: none;
          font-size: 15px;
          line-height: 1.7;
          color: #1e293b;
          background: #ffffff;
          box-shadow: none !important;
        }

        #${editorId.current} :global(.ProseMirror-focused) {
          outline: none;
        }

        #${editorId.current} :global(.ProseMirror p) {
          margin: 0 0 0.75em 0;
        }

        #${editorId.current} :global(.ProseMirror p.is-editor-empty:first-child::before) {
          color: #94a3b8;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        #${editorId.current} :global(.ProseMirror h1) {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 1.25em 0 0.5em 0;
          color: #0f172a;
          line-height: 1.3;
        }

        #${editorId.current} :global(.ProseMirror h2) {
          font-size: 1.375rem;
          font-weight: 600;
          margin: 1em 0 0.5em 0;
          color: #1e293b;
          line-height: 1.4;
        }

        #${editorId.current} :global(.ProseMirror h3) {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0.75em 0 0.5em 0;
          color: #334155;
        }

        #${editorId.current} :global(.ProseMirror ul) {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.75em 0;
        }

        #${editorId.current} :global(.ProseMirror ul li) {
          margin: 0.25em 0;
        }

        #${editorId.current} :global(.ProseMirror ol) {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0.75em 0;
        }

        #${editorId.current} :global(.ProseMirror ol li) {
          margin: 0.25em 0;
        }

        #${editorId.current} :global(.ProseMirror blockquote) {
          border-left: 4px solid #3b82f6;
          padding: 10px 16px;
          margin: 1em 0;
          font-style: italic;
          color: #475569;
          background: #f8fafc;
          border-radius: 0 8px 8px 0;
        }

        #${editorId.current} :global(.ProseMirror hr) {
          border: none;
          border-top: 2px solid #e2e8f0;
          margin: 1.25em 0;
        }

        #${editorId.current} :global(.ProseMirror strong) {
          font-weight: 600;
          color: #0f172a;
        }

        #${editorId.current} :global(.ProseMirror em) {
          font-style: italic;
        }

        #${editorId.current} :global(.ProseMirror ::selection) {
          background: rgba(59, 130, 246, 0.3);
        }

        #${editorId.current} :global(.ProseMirror-gapcursor) {
          display: none;
          pointer-events: none;
          position: absolute;
        }

        #${editorId.current} :global(.ProseMirror-gapcursor:after) {
          content: "";
          display: block;
          position: absolute;
          top: -2px;
          width: 20px;
          border-top: 1px solid #1e293b;
          animation: ProseMirror-cursor-blink 1.1s steps(2, start) infinite;
        }

        @keyframes ProseMirror-cursor-blink {
          to { visibility: hidden; }
        }
      `}</style>
    </div>
  );
}