import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { useEffect, useCallback, useState } from 'react';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  theme?: 'post' | 'chapter';
  editable?: boolean;
}

export function TipTapEditor({ content, onChange, placeholder, theme = 'post', editable = true }: TipTapEditorProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  const themeClasses = theme === 'post'
    ? {
        container: 'border border-slate-600 bg-slate-700 rounded-lg overflow-hidden',
        toolbar: 'flex flex-wrap gap-1 p-2 bg-slate-800 border-b border-slate-600',
        toolbarButton: 'p-2 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition',
        toolbarButtonActive: 'p-2 rounded bg-purple-600 text-white',
        editor: 'min-h-[400px] w-full bg-slate-700 px-4 py-3 text-white outline-none prose prose-invert max-w-none overflow-auto',
        placeholder: 'text-slate-400',
        linkInput: 'flex gap-2 p-2 bg-slate-800 border-t border-slate-600',
        linkInputField: 'flex-1 rounded bg-slate-700 border border-slate-600 px-2 py-1 text-white text-sm',
        linkInputButton: 'px-3 py-1 bg-purple-600 text-white text-sm rounded',
      }
    : {
        container: 'border border-[#c5b07b]/30 bg-[#0f141b] rounded-3xl overflow-hidden',
        toolbar: 'flex flex-wrap gap-1 p-2 bg-[#0b0f14] border-b border-[#c5b07b]/30',
        toolbarButton: 'p-2 rounded hover:bg-[#c5b07b]/20 text-[#e9e1c4] transition',
        toolbarButtonActive: 'p-2 rounded bg-[#d8b74a] text-[#0b0f14]',
        editor: 'min-h-48 w-full bg-[#0f141b] px-4 py-3 text-[#f6f1dc] outline-none',
        placeholder: 'text-[#c5b07b]',
        linkInput: 'flex gap-2 p-2 bg-[#0b0f14] border-t border-[#c5b07b]/30',
        linkInputField: 'flex-1 rounded bg-[#0f141b] border border-[#c5b07b]/30 px-2 py-1 text-[#f6f1dc] text-sm',
        linkInputButton: 'px-3 py-1 bg-[#d8b74a] text-[#0b0f14] text-sm rounded',
      };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-purple-300 hover:underline',
          target: '_blank',
          rel: 'noreferrer noopener',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: themeClasses.editor,
      },
    },
  });

  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (linkUrl.trim()) {
      editor?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.trim() }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  }, [editor, linkUrl]);

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          editor?.chain().focus().setImage({ src: reader.result as string }).run();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={themeClasses.container}>
      {/* Toolbar */}
      <div className={themeClasses.toolbar}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? themeClasses.toolbarButtonActive : themeClasses.toolbarButton}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? themeClasses.toolbarButtonActive : themeClasses.toolbarButton}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? themeClasses.toolbarButtonActive : themeClasses.toolbarButton}
          title="Underline"
        >
          <u>U</u>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? themeClasses.toolbarButtonActive : themeClasses.toolbarButton}
          title="Strike"
        >
          <s>S</s>
        </button>
        <span className="w-px h-6 bg-slate-600 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? themeClasses.toolbarButtonActive : themeClasses.toolbarButton}
          title="H1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? themeClasses.toolbarButtonActive : themeClasses.toolbarButton}
          title="H2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? themeClasses.toolbarButtonActive : themeClasses.toolbarButton}
          title="H3"
        >
          H3
        </button>
        <span className="w-px h-6 bg-slate-600 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? themeClasses.toolbarButtonActive : themeClasses.toolbarButton}
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? themeClasses.toolbarButtonActive : themeClasses.toolbarButton}
          title="Ordered List"
        >
          1.
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? themeClasses.toolbarButtonActive : themeClasses.toolbarButton}
          title="Blockquote"
        >
          "
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? themeClasses.toolbarButtonActive : themeClasses.toolbarButton}
          title="Code Block"
        >
          {'</>'}
        </button>
        <span className="w-px h-6 bg-slate-600 mx-1" />
        <button
          type="button"
          onClick={() => setShowLinkInput(!showLinkInput)}
          className={editor.isActive('link') ? themeClasses.toolbarButtonActive : themeClasses.toolbarButton}
          title="Link"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={handleImageUpload}
          className={themeClasses.toolbarButton}
          title="Image Upload"
        >
          🖼
        </button>
        <span className="w-px h-6 bg-slate-600 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? themeClasses.toolbarButtonActive : themeClasses.toolbarButton}
          title="Align Left"
        >
          ⬅
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? themeClasses.toolbarButtonActive : themeClasses.toolbarButton}
          title="Align Center"
        >
          ⬌
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? themeClasses.toolbarButtonActive : themeClasses.toolbarButton}
          title="Align Right"
        >
          ➡
        </button>
        <span className="w-px h-6 bg-slate-600 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className={themeClasses.toolbarButton}
          title="Undo"
        >
          ↩
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className={themeClasses.toolbarButton}
          title="Redo"
        >
          ↪
        </button>
      </div>

      {/* Link Input */}
      {showLinkInput && (
        <div className={themeClasses.linkInput}>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className={themeClasses.linkInputField}
            onKeyDown={(e) => e.key === 'Enter' && setLink()}
          />
          <button type="button" onClick={setLink} className={themeClasses.linkInputButton}>
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              editor?.chain().focus().unsetLink().run();
              setShowLinkInput(false);
              setLinkUrl('');
            }}
            className={themeClasses.linkInputButton}
            style={{ backgroundColor: '#ef4444' }}
          >
            Remove
          </button>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}