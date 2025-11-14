import React, { useEffect, useRef } from 'react';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
}

export const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current && ref.current.innerHTML !== content) {
            ref.current.innerHTML = content;
        }
    }, [content]);

    const exec = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        if (ref.current) onChange(ref.current.innerHTML);
    };

    return (
        <div className="rounded-xl border border-[#2a2f25] bg-[#1a2218] p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
                <ToolbarButton label="𝐁" onClick={() => exec("bold")} title="Жирный" />
                <ToolbarButton label="𝑰" onClick={() => exec("italic")} title="Курсив" />
                <ToolbarButton label="H2" onClick={() => exec("formatBlock", "h2")} title="Заголовок" />
                <ToolbarButton label="•" onClick={() => exec("insertUnorderedList")} title="Маркированный список" />
                <ToolbarButton label="1." onClick={() => exec("insertOrderedList")} title="Нумерованный список" />
                <ToolbarButton label="↺" onClick={() => exec("undo")} title="Отменить" />
                <ToolbarButton label="↻" onClick={() => exec("redo")} title="Повторить" />
                <ToolbarButton label="⏴" onClick={() => exec("justifyLeft")} title="Влево" />
                <ToolbarButton label="↔" onClick={() => exec("justifyCenter")} title="По центру" />
                <ToolbarButton label="⏵" onClick={() => exec("justifyRight")} title="Вправо" />
            </div>

            <div
                ref={ref}
                contentEditable
                onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
                className="rich-editor min-h-[200px] border border-[#2a2f25] rounded-xl bg-[#22291f] p-4 text-base leading-relaxed shadow-inner focus:outline-none
                prose prose-sm prose-invert list-outside list-disc marker:text-[#c2a774]"
            />
        </div>
    );
};

const ToolbarButton: React.FC<{ label: string; onClick: () => void; title?: string }> = ({
    label,
    onClick,
    title,
}) => (
    <button
        onClick={(e) => {
            e.preventDefault();
            onClick();
        }}
        className="text-sm px-2 py-1 rounded-md shadow-sm border border-[#3c3c30] bg-[#292c23] text-[#e5d9a5] hover:bg-[#3c3f35] transition active:scale-[0.97]"
        title={title}
    >
        {label}
    </button>
);