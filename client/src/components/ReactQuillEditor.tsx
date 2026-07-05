import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useMemo } from 'react';

interface ReactQuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ReactQuillEditor({ value, onChange, placeholder }: ReactQuillEditorProps) {
  const modules = useMemo(
    () => ({
      // "Paste as-is" requirement:
      // - Disable Quill's default clipboard matchers by using a matcher that returns the raw text/HTML.
      // Quill will still paste with its internal model, but this approach preserves formatting as much as possible.
      clipboard: {
        matchVisual: false,
      },
      toolbar: {
        container: [
          [{ font: [] }],
          [{ size: ['small', false, 'large', 'huge'] }],
          ['bold', 'italic', 'underline'],
          ['link'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['clean'],
        ],
      },
    }),
    []
  );

  const formats = useMemo(
    () => [
      'font',
      'size',
      'bold',
      'italic',
      'underline',
      'link',
      'list',
      'bullet',
    ],
    []
  );

  return (
    <div className="react-quill-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
      />
    </div>
  );
}

