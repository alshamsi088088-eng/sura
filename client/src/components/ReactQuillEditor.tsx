import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import type { Sources, Quill as QuillType } from 'quill';
import 'react-quill/dist/quill.snow.css';

type ReactQuillEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

// ====== Paste sanitization ======
const DEFAULT_ALLOWED_TAGS = new Set([
  'a',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'br',
  'p',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'img',
  'span',
  'div',
]);

function sanitizePastedHtml(rawHtml: string): string {
  // Strategy:
  // - Parse HTML into DOM
  // - Remove inline event handlers + unsafe tags
  // - Strip style/class attributes (to avoid layout breakage / tracking)
  // - Keep link href + img src with protocol allow-list
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
    const toRemove: Element[] = [];

    // Walk all elements and sanitize
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const node = walker.currentNode;
      if (!node) break;

      if (node instanceof Element) {
        const el = node;
        const tag = el.tagName.toLowerCase();

        if (!DEFAULT_ALLOWED_TAGS.has(tag)) {
          // Replace unsafe element with its children.
          const parent = el.parentNode;
          if (parent) {
            while (el.firstChild) parent.insertBefore(el.firstChild, el);
            toRemove.push(el);
          }
        } else {
          // Remove inline style + classes (Word/Docs add a lot of messy layout data)
          el.removeAttribute('style');
          el.removeAttribute('class');

          // Drop inline event handlers
          const attrs = Array.from(el.attributes);
          for (const attr of attrs) {
            const name = attr.name.toLowerCase();
            const value = attr.value ?? '';

            if (name.startsWith('on')) {
              el.removeAttribute(attr.name);
              continue;
            }

            if (tag === 'a') {
              if (name === 'href') {
                const href = value.trim();
                const lower = href.toLowerCase();
                const isSafe =
                  lower.startsWith('https://') ||
                  lower.startsWith('http://') ||
                  lower.startsWith('/') ||
                  lower.startsWith('#');

                if (!isSafe) el.setAttribute('href', '#');
              } else if (name === 'target') {
                if (value !== '_blank') el.setAttribute('target', '_blank');
              } else if (name === 'rel') {
                // keep
              } else {
                el.removeAttribute(attr.name);
              }
              continue;
            }

            if (tag === 'img') {
              if (name === 'src') {
                const src = value.trim();
                const lower = src.toLowerCase();
                const isSafe = lower.startsWith('http://') || lower.startsWith('https://');
                if (!isSafe) el.setAttribute('src', '');
              } else if (name === 'alt') {
                // ok
              } else {
                el.removeAttribute(attr.name);
              }
              continue;
            }

            if (tag === 'span') {
              // For Quill, formatting is driven by structure/semantic tags.
              if (name !== 'data-index' && name !== 'data-embed') {
                el.removeAttribute(attr.name);
              }
              continue;
            }

            // For formatting elements, remove most attributes.
            if (tag !== 'div') {
              el.removeAttribute(attr.name);
            }
          }

          if (tag === 'a') {
            if (!el.getAttribute('target')) el.setAttribute('target', '_blank');
            if (!el.getAttribute('rel')) el.setAttribute('rel', 'noopener noreferrer');
          }
        }
      }

      const next = walker.nextNode();
      if (!next) break;
    }

    for (const el of toRemove) el.remove();

    return doc.body.innerHTML;
  } catch {
    return rawHtml;
  }
}

function getClipboardConfig() {
  return { matchVisual: false } as const;
}

export function ReactQuillEditor({ value, onChange, placeholder }: ReactQuillEditorProps) {
  const reactQuillRef = useRef<ReactQuill | null>(null);
  const [quillInstance, setQuillInstance] = useState<QuillType | null>(null);

  const modules = useMemo(() => {
    const toolbar: any[] = [
      // Alignment
      [{ align: '' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }],

      // Font family / size
      [{ font: [] }],
      [{ size: [] }],

      // Font + background color
      [{ color: [] }, { background: [] }],

      // Inline formatting
      ['bold', 'italic', 'underline', 'strike'],

      // Lists
      [{ list: 'ordered' }, { list: 'bullet' }],

      // Links + Image insertion
      ['link', 'image'],

      // Clean
      ['clean'],
    ];

    return {
      toolbar: {
        container: toolbar,
      },
      clipboard: getClipboardConfig(),

      keyboard: {
        // Plain-text paste shortcut: Ctrl/Cmd + Shift + V
        bindings: {
          handlePlainTextPaste: {
            key: 'V',
            shiftKey: true,
            shortKey: true,
            handler: function (this: unknown) {
              const editor = this as QuillType;
              const range = editor.getSelection(true);
              const index = range ? range.index : editor.getLength();

              void (async () => {
                try {
                  const clipboard = navigator.clipboard;
                  if (!clipboard?.readText) return;
                  const text = await clipboard.readText();
                  editor.insertText(index, text, 'user');
                  editor.setSelection(index + text.length, 0, 'silent');
                } catch {
                  // ignore
                }
              })();
            },
          },
        },
      },
    };
  }, []);

  const formats = useMemo(
    () => [
      'align',
      'font',
      'size',
      'color',
      'background',
      'bold',
      'italic',
      'underline',
      'strike',
      'list',
      'bullet',
      'link',
      'image',
    ],
    []
  );

  useEffect(() => {
    if (!quillInstance) return;

    type QuillClipboardWithConvert = {
      convert?: (html: string) => any;
      addMatcher: (nodeType: any, matcher: (node: Node, delta: any) => any) => void;
    };

    const clipboard = quillInstance.clipboard as unknown as QuillClipboardWithConvert;

    const handler = (node: Node, delta: any) => {
      if (node instanceof HTMLElement) {
        const rawHtml = node.outerHTML;
        const cleanHtml = sanitizePastedHtml(rawHtml);

        if (typeof clipboard.convert === 'function') {
          return clipboard.convert(cleanHtml);
        }
      }
      return delta;
    };

    quillInstance.clipboard.addMatcher('BODY', handler);
    quillInstance.clipboard.addMatcher('P', handler);
    quillInstance.clipboard.addMatcher('DIV', handler);
    quillInstance.clipboard.addMatcher('SPAN', handler);
    quillInstance.clipboard.addMatcher('A', handler);
    quillInstance.clipboard.addMatcher('IMG', handler);
    quillInstance.clipboard.addMatcher('UL', handler);
    quillInstance.clipboard.addMatcher('OL', handler);
    quillInstance.clipboard.addMatcher('LI', handler);

    quillInstance.clipboard.addMatcher('STRONG', handler);
    quillInstance.clipboard.addMatcher('EM', handler);
    quillInstance.clipboard.addMatcher('I', handler);
    quillInstance.clipboard.addMatcher('B', handler);
    quillInstance.clipboard.addMatcher('H1', handler);
    quillInstance.clipboard.addMatcher('H2', handler);
    quillInstance.clipboard.addMatcher('H3', handler);

    return () => {
      // No-op: Quill matcher removal isn't exposed.
    };
  }, [quillInstance]);

  useEffect(() => {
    if (!reactQuillRef.current) return;

    const editor = reactQuillRef.current.getEditor();
    setQuillInstance(editor);
  }, []);

  const editorShellClasses = 'rounded-2xl border border-sura-line bg-sura-canvas overflow-hidden';
  const editorHeaderClasses =
    'flex flex-wrap items-center gap-2 border-b border-sura-line bg-sura-canvas/40 px-3 py-2';
  const editorBodyClasses = 'quill-editor';

  return (
    <div className={editorShellClasses}>
      <div className={editorHeaderClasses}>
        <div className="text-xs font-semibold text-sura-navy/80">Rich Text</div>
        <div className="text-xs text-sura-navy/60">
          Paste rich text (Word/Google Docs) supported · Plain text paste:{' '}
          <span className="font-semibold">Ctrl/Cmd</span> + <span className="font-semibold">Shift</span> +{' '}
          <span className="font-semibold">V</span>
        </div>
      </div>

      <div className={editorBodyClasses}>
        <ReactQuill
          ref={(instance) => {
            reactQuillRef.current = instance;
          }}
          theme="snow"
          value={value}
          onChange={(content: string, _delta: any, _source: Sources) => onChange(content)}
          placeholder={placeholder}
          modules={modules}
          formats={formats}
        />

        <div className="px-3 py-2 border-t border-sura-line bg-sura-canvas/30">
          <button
            type="button"
            className="rounded-full border border-sura-line px-4 py-1.5 text-xs font-semibold text-sura-navy/80 hover:bg-sura-navy/10"
            onClick={async () => {
              try {
                if (!navigator.clipboard?.readText) return;
                const text = await navigator.clipboard.readText();
                const editor = reactQuillRef.current?.getEditor();
                if (!editor) return;

                const range = editor.getSelection(true);
                const index = range ? range.index : editor.getLength();

                editor.insertText(index, text, 'user');
                editor.setSelection(index + text.length, 0, 'silent');
              } catch {
                // ignore
              }
            }}
            title="Paste clipboard as plain text (best-effort)."
          >
            Paste Plain Text
          </button>
        </div>
      </div>

      <style>
        {`
        /* Quill base styling */
        .ql-container { font-family: inherit; border: none; }
        .ql-toolbar.ql-snow { border: none; background: transparent; color: inherit; padding: 8px 12px; }
        .ql-editor { min-height: 180px; padding: 16px; color: inherit; background: transparent; }

        .ql-snow .ql-editor.ql-blank::before { color: rgba(47,65,86,0.55); font-style: normal; }

        body.light .ql-editor { color: var(--sura-ink); }
        body:not(.light) .ql-editor { color: var(--sura-text); }
        body:not(.light) .ql-toolbar.ql-snow { color: rgba(245,239,235,0.9); }

        .ql-snow .ql-toolbar button { color: inherit; border-radius: 10px; }
        .ql-snow .ql-toolbar button.ql-active {
          background: rgba(200,217,230,0.12);
          color: var(--sura-accent);
        }

        .ql-editor a { color: #C8D9E6; text-decoration: underline; }
        body.light .ql-editor a { color: #2F4156; }

        .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 14px;
          border: 1px solid var(--sura-line);
        }

        .ql-editor ul, .ql-editor ol { padding-left: 1.2rem; }

        .ql-editor .ql-placeholder { color: rgba(245,239,235,0.6); }
        body.light .ql-editor .ql-placeholder { color: rgba(32,48,63,0.5); }

        .ql-container:focus-within { box-shadow: 0 0 0 1px rgba(200,217,230,0.18); }

        /* Ensure toolbar sits nicely */
        .ql-snow .ql-toolbar { border: none !important; padding: 8px 12px; }
        .ql-snow .ql-toolbar + .ql-container.ql-snow { border-top: none; }
        .ql-container.ql-snow { border: none; }
        `}
      </style>
    </div>
  );
}


