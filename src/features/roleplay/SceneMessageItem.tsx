import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MessageSquareReply, Pencil, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { formatSceneMessageTimestamp, type SceneMessageView } from '../../types/roleplay';

interface SceneMessageItemProps {
    item: SceneMessageView;
    onReply: (messageId: string) => void;
    onStartEdit: (messageId: string, content: string) => void;
    isOwn: boolean;
    canManage: boolean;
    onDelete: (messageId: string) => Promise<void>;
    /** Масштаб текста сообщений (1 = по умолчанию) */
    fontScale?: number;
    /** id на корневом элементе (для прокрутки к сообщению при поиске) */
    messageDomId?: string;
    /** Подсветка вхождений в тексте (регистронезависимо) */
    highlightQuery?: string | null;
    /** Настройки сцены: показывать строку времени */
    showMessageTime?: boolean;
    /** Показывать секунды в строке времени */
    messageTimeWithSeconds?: boolean;
}

const typeLabels: Record<SceneMessageView['message']['type'], string> = {
    speech: 'Речь',
    action: 'Действие',
    narration: 'Описание',
    system: 'Системное',
};

const highlightText = (text: string, rawQuery: string | null | undefined): ReactNode => {
    const q = rawQuery?.trim();
    if (!q) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(re);
    if (parts.length === 1) return text;
    return (
        <>
            {parts.map((part, i) =>
                i % 2 === 1 ? (
                    <mark
                        key={i}
                        className="rounded-sm bg-[#c2a774]/40 px-0.5 text-inherit [box-decoration-break:clone]"
                    >
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </>
    );
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

export const SceneMessageItem = ({
    item,
    onReply,
    onStartEdit,
    isOwn,
    canManage,
    onDelete,
    fontScale = 1,
    messageDomId,
    highlightQuery = null,
    showMessageTime = true,
    messageTimeWithSeconds = true,
}: SceneMessageItemProps) => {
    const rootRef = useRef<HTMLElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const avatar = item.emotion?.image_url || item.character?.avatar || item.author?.avatar_url;
    const authorName = item.character?.name || item.author?.username || 'Система';
    const segments = parseFormattedSegments(item.message.content);
    const speechPrefix = item.message.type === 'speech' ? '- ' : '';
    const s = fontScale;
    const bubblePadX = 12 * s;
    const bubblePadY = 10 * s;
    const bubbleRadius = Math.min(18, Math.max(10, Math.round(12 * s)));
    const avatarSize = Math.min(44, Math.max(26, Math.round(32 * s)));
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    useEffect(() => {
        if (!isActionsOpen) return;

        const onDocClick = (event: MouseEvent) => {
            const target = event.target as Node;
            const isInsideMessage = !!rootRef.current?.contains(target);
            const isInsideMenu = !!menuRef.current?.contains(target);
            if (!isInsideMessage && !isInsideMenu) {
                setIsActionsOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
        };
    }, [isActionsOpen]);

    return (
        <article
            id={messageDomId}
            ref={rootRef}
            className={`relative flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            style={{ paddingTop: `${4 * s}px` }}
        >
            <div
                className={`flex max-w-[88%] items-end ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                style={{ gap: `${8 * s}px` }}
            >
                {avatar ? (
                    <img
                        src={avatar}
                        alt=""
                        className="shrink-0 rounded-full object-cover"
                        style={{ width: avatarSize, height: avatarSize }}
                    />
                ) : (
                    <div
                        className="flex shrink-0 items-center justify-center rounded-full bg-[#1a231d] text-[#9fa68a]"
                        style={{ width: avatarSize, height: avatarSize, fontSize: `${12 * s}px` }}
                    >
                        ?
                    </div>
                )}

                <div className="min-w-0">
                    <div
                        className={`border text-[#f1e7c6] ${
                            isOwn
                                ? 'border-[#3a4a34] bg-[#1a2619] shadow-[0_6px_20px_rgba(0,0,0,0.25)]'
                                : 'border-[#2d3a34] bg-[#0f1511] shadow-[0_6px_20px_rgba(0,0,0,0.2)]'
                        }`}
                        style={{
                            paddingLeft: bubblePadX,
                            paddingRight: bubblePadX,
                            paddingTop: bubblePadY,
                            paddingBottom: bubblePadY,
                            borderRadius: `${bubbleRadius}px`,
                        }}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
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
                <div
                    className="border-[#5b5b5b] text-[#c7bc98]"
                    style={{
                        fontSize: `${12 * fontScale}px`,
                        marginBottom: `${8 * s}px`,
                        paddingLeft: `${8 * s}px`,
                        borderLeftWidth: `${Math.max(1, Math.round(2 * s))}px`,
                        borderLeftStyle: 'solid',
                    }}
                >
                    Ответ на: {item.replyTo.content.slice(0, 80)}
                </div>
            )}
            <div
                className={`flex items-center ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                style={{ gap: `${6 * s}px` }}
            >
                <p
                    className={`truncate font-semibold ${isOwn ? 'text-right text-[#d8d1b2]' : 'text-left text-[#c7bc98]'}`}
                    style={{ fontSize: `${10 * fontScale}px` }}
                >
                    {highlightText(authorName, highlightQuery)}
                </p>
                {item.message.type === 'system' && (
                    <span
                        className="rounded-full border border-[#5a5a5a] bg-black/20 uppercase tracking-wide text-[#c7bc98]"
                        style={{
                            fontSize: `${10 * fontScale}px`,
                            paddingLeft: `${8 * s}px`,
                            paddingRight: `${8 * s}px`,
                            paddingTop: `${4 * s}px`,
                            paddingBottom: `${4 * s}px`,
                        }}
                    >
                        {typeLabels[item.message.type]}
                    </span>
                )}
            </div>
            <p className="whitespace-pre-wrap leading-tight" style={{ fontSize: `${15 * fontScale}px` }}>
                {speechPrefix}
                {segments.map((segment, idx) => {
                    if (segment.type === 'action') {
                        return (
                            <span key={idx} className="italic text-[#d5ebdd]">
                                {highlightText(segment.text, highlightQuery)}
                            </span>
                        );
                    }
                    if (segment.type === 'narration') {
                        return (
                            <span key={idx} className="text-[#dde0f8]">
                                {highlightText(segment.text, highlightQuery)}
                            </span>
                        );
                    }
                    return <span key={idx}>{highlightText(segment.text, highlightQuery)}</span>;
                })}
            </p>
            {showMessageTime ? (
                <p className="text-right opacity-75" style={{ fontSize: `${9 * fontScale}px`, marginTop: `${4 * s}px` }}>
                    {formatSceneMessageTimestamp(item.message.created_at, messageTimeWithSeconds)}
                    {item.message.edited ? ' · изменено' : ''}
                </p>
            ) : null}
                    </div>
                </div>
            </div>
            {isActionsOpen &&
                createPortal(
                    <div
                        ref={menuRef}
                        className="fixed z-[300] min-w-[150px] rounded-xl border border-[#2f3a34] bg-[#0d130f] p-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
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
                        {canManage && (
                            <>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-[#c7bc98] transition hover:bg-white/5 hover:text-[#f4ecd0]"
                                    onClick={() => {
                                        onStartEdit(item.message.id, item.message.content);
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
                    </div>,
                    document.body
                )}
        </article>
    );
};
