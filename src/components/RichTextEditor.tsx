import React, { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';

interface RichTextEditorProps {
    content: string;
    onChange: (value: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: false,
                orderedList: false,
                listItem: false,
            }),
            BulletList,
            OrderedList,
            ListItem,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
        ],
        content,
        onUpdate({ editor }) {
            onChange(editor.getHTML());
        },
    });

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content]);

    if (!editor) return null;

    const buttonClass =
        'px-2 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-blue-50 transition';

    return (
        <div className="border rounded-lg shadow-sm p-4 bg-white space-y-3">
            <div className="flex flex-wrap gap-2 mb-2">
                <button onClick={() => editor.chain().focus().toggleBold().run()} className={buttonClass}>
                    <b>B</b>
                </button>
                <button onClick={() => editor.chain().focus().toggleItalic().run()} className={buttonClass}>
                    <i>I</i>
                </button>
                <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={buttonClass}>
                    H2
                </button>
                <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={buttonClass}>
                    • List
                </button>
                <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={buttonClass}>
                    1. List
                </button>
                <button onClick={() => editor.chain().focus().undo().run()} className={buttonClass}>
                    ↺
                </button>
                <button onClick={() => editor.chain().focus().redo().run()} className={buttonClass}>
                    ↻
                </button>
                <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={buttonClass}>
                    ⬅️
                </button>
                <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={buttonClass}>
                    ↔️
                </button>
                <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={buttonClass}>
                    ➡️
                </button>
            </div>

            <div className="min-h-[200px] px-3 py-2 text-sm leading-relaxed border rounded list-disc list-inside space-y-2">
                <EditorContent editor={editor} className="outline-none prose max-w-none list-disc list-inside"/>
            </div>
        </div >
    );
};
