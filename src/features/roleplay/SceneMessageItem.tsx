import { useEffect, useRef, useState } from 'react';
import { MessageSquareReply, Pencil, Trash2 } from 'lucide-react';
import type { SceneMessageView } from '../../types/roleplay';

interface SceneMessageItemProps {
    item: SceneMessageView;
    onReply: (messageId: string) => void;
    isOwn: boolean;
    canManage: boolean;
    onEdit: (messageId: string, content: string) => Promise<void>;
    onDelete: (messageId: string) => Promise<void>;
}

const typeLabels: Record<SceneMessageView['message']['type'], string> = {
    speech: 'Речь',
    action: 'Действие',
    narration: 'Описание',
    system: 'Системное',
};

const parseFormattedSegments = (content: string) => {
    const speechNormalized = content.replace(/^\s*-\s*/, '');
    const chunks = speechNormalized.split(/(`[^`]+`|\*[^*]+\*)/g).filter(Boolean);
    return chunks.map((chunk) => {
        if (chunk.startsWith('*') && chunk.endsWith('*')) {
            return {
                type: 'action' as const,
                text: chunk.slice(1, -1),
            };
        }
        if (chunk.startsWith('`') && chunk.endsWith('`')) {
            return {
                type: 'narration' as const,
                text: chunk.slice(1, -1),
            };
        }
        return {
            type: 'text' as const,
            text: chunk,
        };
    });
};

export const SceneMessageItem = ({ item, onReply, isOwn, canManage, onEdit, onDelete }: SceneMessageItemProps) => {
    const rootRef = useRef<HTMLElement | null>(null);
    const avatar = item.emotion?.image_url || item.character?.avatar || item.author?.avatar_url;
    const authorName = item.character?.name || item.author?.username || 'Система';
    const segments = parseFormattedSegments(item.message.content);
    const speechPrefix = item.message.type === 'speech' ? '- ' : '';
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(item.message.content);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    useEffect(() => {
        if (!isActionsOpen) return;

        const onDocClick = (event: MouseEvent) => {
            const target = event.target as Node;
            if (!rootRef.current?.contains(target)) {
                setIsActionsOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
        };
    }, [isActionsOpen]);

    return (
        <article ref={rootRef} className={`relative flex ${isOwn ? 'justify-end' : 'justify-start'} pt-1`}>
            <div className={`flex max-w-[88%] items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                {avatar ? (
                    <img src={avatar} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a231d] text-xs text-[#9fa68a]">
                        ?
                    </div>
                )}

                <div className="min-w-0">
                    <div
                        className={`rounded-xl border px-3 py-2.5 text-[#f1e7c6] ${
                            isOwn
                                ? 'border-[#3a4a34] bg-[#1a2619] shadow-[0_6px_20px_rgba(0,0,0,0.25)]'
                                : 'border-[#2d3a34] bg-[#0f1511] shadow-[0_6px_20px_rgba(0,0,0,0.2)]'
                        }`}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                            if (isEditing) return;
                            const menuWidth = 170;
                            const menuHeight = canManage ? 156 : 58;
                            const viewportPadding = 10;
                            const x = Math.min(
                                window.innerWidth - menuWidth - viewportPadding,
                                Math.max(viewportPadding, e.clientX - menuWidth / 2)
                            );
                            const y = Math.min(
                                window.innerHeight - menuHeight - viewportPadding,
                                Math.max(viewportPadding, e.clientY + 8)
                            );
                            setMenuPosition({ x, y });
                            setIsActionsOpen(true);
                        }}
                        onKeyDown={(e) => {
                            if (isEditing) return;
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                if (rootRef.current) {
                                    const rect = rootRef.current.getBoundingClientRect();
                                    const menuWidth = 170;
                                    const menuHeight = canManage ? 156 : 58;
                                    const viewportPadding = 10;
                                    const x = Math.min(
                                        window.innerWidth - menuWidth - viewportPadding,
                                        Math.max(viewportPadding, rect.left + rect.width / 2 - menuWidth / 2)
                                    );
                                    const y = Math.min(
                                        window.innerHeight - menuHeight - viewportPadding,
                                        Math.max(viewportPadding, rect.top + 8)
                                    );
                                    setMenuPosition({ x, y });
                                }
                                setIsActionsOpen(true);
                            }
                        }}
                    >
            {item.replyTo && (
                <div className="mb-2 border-l-2 border-[#5b5b5b] pl-2 text-xs text-[#c7bc98]">
                    Ответ на: {item.replyTo.content.slice(0, 80)}
                </div>
            )}
            <div className={`mb-2 flex items-center gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                <p className={`truncate text-xs font-semibold ${isOwn ? 'text-right text-[#d8d1b2]' : 'text-left text-[#c7bc98]'}`}>
                    {authorName}
                </p>
                {item.message.type === 'system' && (
                    <span className="rounded-full border border-[#5a5a5a] bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#c7bc98]">
                        {typeLabels[item.message.type]}
                    </span>
                )}
            </div>
            {isEditing ? (
                <div className="space-y-2">
                    <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg bg-[#0d120f] px-3 py-2 text-[14px] text-[#e5d9a5] outline-none ring-1 ring-[#2d3a34] focus:ring-[#c2a774]"
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            className="rounded-md px-2 py-1 text-xs text-[#c7bc98] hover:bg-white/5"
                            onClick={() => {
                                setIsEditing(false);
                                setDraft(item.message.content);
                            }}
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            className="rounded-md px-2 py-1 text-xs text-[#e5d9a5] hover:bg-[#c2a77422]"
                            onClick={async () => {
                                const next = draft.trim();
                                if (!next) return;
                                setIsSubmitting(true);
                                await onEdit(item.message.id, next);
                                setIsSubmitting(false);
                                setIsEditing(false);
                            }}
                        >
                            {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            ) : (
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                    {speechPrefix}
                    {segments.map((segment, idx) => {
                        if (segment.type === 'action') {
                            return (
                                <span key={idx} className="italic text-[#d5ebdd]">
                                    {segment.text}
                                </span>
                            );
                        }
                        if (segment.type === 'narration') {
                            return (
                                <span key={idx} className="text-[#dde0f8]">
                                    {segment.text}
                                </span>
                            );
                        }
                        return <span key={idx}>{segment.text}</span>;
                    })}
                </p>
            )}
            <p className="mt-2 text-right text-[11px] opacity-75">
                {new Date(item.message.created_at).toLocaleString()}
                {item.message.edited ? ' · изменено' : ''}
            </p>
                    </div>
                </div>
            </div>
            {isActionsOpen && (
                <div
                    className="fixed z-[130] min-w-[150px] rounded-xl border border-[#2f3a34] bg-[#0d130f] p-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
                    style={{ left: menuPosition.x, top: menuPosition.y }}
                >
                    <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-[#c7bc98] transition hover:bg-white/5 hover:text-[#f4ecd0]"
                        onClick={() => {
                            onReply(item.message.id);
                            setIsActionsOpen(false);
                        }}
                    >
                        <MessageSquareReply size={16} />
                        <span>Ответить</span>
                    </button>
                    {canManage && !isEditing && (
                        <>
                            <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-[#c7bc98] transition hover:bg-white/5 hover:text-[#f4ecd0]"
                                onClick={() => {
                                    setIsEditing(true);
                                    setIsActionsOpen(false);
                                }}
                            >
                                <Pencil size={16} />
                                <span>Изменить</span>
                            </button>
                            <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-[#e7b0b0] transition hover:bg-[#d76f6f]/10 hover:text-[#ffd0d0]"
                                onClick={async () => {
                                    if (!window.confirm('Удалить сообщение?')) return;
                                    await onDelete(item.message.id);
                                    setIsActionsOpen(false);
                                }}
                            >
                                <Trash2 size={16} />
                                <span>Удалить</span>
                            </button>
                        </>
                    )}
                </div>
            )}
        </article>
    );
};
