import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquareReply, Pencil, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import {
    formatSceneMessageTimestamp,
    type RoleplaySpaceCharacterView,
    type SceneMessageView,
} from '../../types/roleplay';

function resolveSpaceCharacterByMentionName(
    rawName: string,
    spaceCharacters: RoleplaySpaceCharacterView[],
): { name: string; avatar: string | null; userId: string } | null {
    const needle = rawName.trim().toLowerCase();
    if (!needle) return null;
    const hit = spaceCharacters.find((x) => x.character.name.toLowerCase() === needle);
    if (!hit) return null;
    return { name: hit.character.name, avatar: hit.character.avatar, userId: hit.character.user_id };
}

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
    /** Персонажи пространства — для аватарки/имени у вложенных @Имя: */
    spaceCharacters?: RoleplaySpaceCharacterView[];
}

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

type ParsedSegment =
    | { type: 'action'; text: string }
    | { type: 'narration'; text: string }
    | { type: 'text'; text: string };

/** Вложенные реплики: `@Имя: текст` внутри одного сообщения */
function splitInlineMentions(text: string): Array<{ speaker: string | null; body: string }> {
    const re = /@([^\s@:]{1,40})\s*:\s*/g;
    const out: Array<{ speaker: string | null; body: string }> = [];
    let last = 0;
    let currentSpeaker: string | null = null;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
        const before = text.slice(last, m.index);
        if (before.length > 0) {
            out.push({ speaker: currentSpeaker, body: before });
        }
        currentSpeaker = m[1] ?? null;
        last = m.index + m[0].length;
    }
    out.push({ speaker: currentSpeaker, body: text.slice(last) });
    return out.filter((c) => c.body.trim().length > 0);
}

const parseFormattedSegments = (content: string): ParsedSegment[] => {
    const chunks = content.split(/(`[^`]+`|\*[^*]+\*)/g).filter(Boolean);
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

type MessageUnit =
    | {
          kind: 'content';
          segments: Array<{ type: 'text' | 'narration'; text: string }>;
          chunkSpeaker: string | null;
      }
    | { kind: 'action'; text: string; chunkSpeaker: string | null };

function buildMessageUnitsWithSpeaker(segments: ParsedSegment[], chunkSpeaker: string | null): MessageUnit[] {
    const units: MessageUnit[] = [];
    let current: Array<{ type: 'text' | 'narration'; text: string }> = [];

    const flush = () => {
        if (current.length === 0) return;
        if (current.some((s) => s.text.length > 0)) {
            units.push({ kind: 'content', segments: current, chunkSpeaker });
        }
        current = [];
    };

    for (const seg of segments) {
        if (seg.type === 'action') {
            flush();
            if (seg.text.length > 0) units.push({ kind: 'action', text: seg.text, chunkSpeaker });
        } else {
            current.push(seg);
        }
    }
    flush();
    return units;
}

function buildUnitsFromMessageContent(
    content: string,
    messageType: SceneMessageView['message']['type'],
): MessageUnit[] {
    const parts = splitInlineMentions(content.trim().length > 0 ? content : '');
    if (parts.length === 0) return [];

    const allUnits: MessageUnit[] = [];
    parts.forEach((part, i) => {
        let body = part.body;
        if (i === 0 && messageType === 'speech') {
            body = body.replace(/^\s*-\s*/, '');
        }
        const segs = parseFormattedSegments(body);
        let processed: ParsedSegment[] = segs;
        if (
            messageType === 'action' &&
            parts.length === 1 &&
            segs.length === 1 &&
            segs[0].type === 'text' &&
            segs[0].text.trim().length > 0
        ) {
            processed = [{ type: 'action', text: segs[0].text.trim() }];
        }
        allUnits.push(...buildMessageUnitsWithSpeaker(processed, part.speaker));
    });
    return allUnits;
}

type MessageRun =
    | { kind: 'content'; chunks: Extract<MessageUnit, { kind: 'content' }>[]; inlineSpeaker: string | null }
    | { kind: 'action'; text: string };

function groupMessageRuns(units: MessageUnit[]): MessageRun[] {
    const runs: MessageRun[] = [];
    let buf: Extract<MessageUnit, { kind: 'content' }>[] = [];
    const flush = () => {
        if (buf.length) {
            runs.push({
                kind: 'content',
                chunks: buf,
                inlineSpeaker: buf[0].chunkSpeaker,
            });
            buf = [];
        }
    };
    for (const u of units) {
        if (u.kind === 'action') {
            flush();
            runs.push({ kind: 'action', text: u.text });
        } else {
            if (buf.length > 0 && buf[0].chunkSpeaker !== u.chunkSpeaker) {
                flush();
            }
            buf.push(u);
        }
    }
    flush();
    return runs;
}

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
    spaceCharacters = [],
}: SceneMessageItemProps) => {
    const navigate = useNavigate();
    const rootRef = useRef<HTMLElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const avatar = item.emotion?.image_url || item.character?.avatar || item.author?.avatar_url;
    const authorName = item.character?.name || item.author?.username || 'Система';
    const speechPrefix = item.message.type === 'speech' ? '- ' : '';
    const units = useMemo(
        () => buildUnitsFromMessageContent(item.message.content, item.message.type),
        [item.message.content, item.message.type],
    );
    const { fallbackRun, contentChunkGlobalIndex } = useMemo(() => {
        const runs = groupMessageRuns(units);
        const fr: MessageRun[] =
            runs.length === 0
                ? [
                      {
                          kind: 'content',
                          inlineSpeaker: null,
                          chunks: [
                              {
                                  kind: 'content',
                                  chunkSpeaker: null,
                                  segments: [
                                      {
                                          type: 'text',
                                          text: item.message.content.trim() || ' ',
                                      },
                                  ],
                              },
                          ],
                      },
                  ]
                : runs;
        const m = new Map<string, number>();
        let g = 0;
        fr.forEach((run, ri) => {
            if (run.kind !== 'content') return;
            run.chunks.forEach((_, uidx) => {
                m.set(`${ri}-${uidx}`, g);
                g += 1;
            });
        });
        return { fallbackRun: fr, contentChunkGlobalIndex: m };
    }, [units, item.message.content]);
    const s = fontScale;
    const bubblePadX = 12 * s;
    const bubblePadTop = 6 * s;
    const bubblePadBottom = 8 * s;
    const bubbleRadius = Math.min(18, Math.max(10, Math.round(12 * s)));
    const avatarSize = Math.min(44, Math.max(26, Math.round(32 * s)));
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    useEffect(() => {
        if (!isActionsOpen) return;

        /** Клик/тап вне пузыря сообщения (и вне меню) — закрываем меню действий. Capture, чтобы сработать до stopPropagation у потомков. */
        const onPointerDownCapture = (event: PointerEvent) => {
            const t = event.target;
            if (t == null || !(t instanceof Node)) {
                setIsActionsOpen(false);
                return;
            }
            const el = t instanceof Element ? t : (t as ChildNode).parentElement;
            if (!el) {
                setIsActionsOpen(false);
                return;
            }
            if (menuRef.current?.contains(el)) return;
            const hitBubble = el.closest('[data-scene-msg-hit]');
            if (hitBubble && rootRef.current?.contains(hitBubble)) return;
            setIsActionsOpen(false);
        };

        document.addEventListener('pointerdown', onPointerDownCapture, true);
        return () => {
            document.removeEventListener('pointerdown', onPointerDownCapture, true);
        };
    }, [isActionsOpen]);

    const openMessageMenu = (clientX: number, clientY: number) => {
        const menuWidth = 170;
        const menuHeight = canManage ? 156 : 58;
        const viewportPadding = 10;
        const x = Math.min(
            window.innerWidth - menuWidth - viewportPadding,
            Math.max(viewportPadding, clientX - menuWidth / 2),
        );
        const y = Math.min(
            window.innerHeight - menuHeight - viewportPadding,
            Math.max(viewportPadding, clientY + 8),
        );
        setMenuPosition({ x, y });
        setIsActionsOpen(true);
    };

    const bubbleClass = `border text-[#f1e7c6] ${
        isOwn
            ? 'border-[#3a4a34] bg-[#1a2619] shadow-[0_6px_20px_rgba(0,0,0,0.25)]'
            : 'border-[#2d3a34] bg-[#0f1511] shadow-[0_6px_20px_rgba(0,0,0,0.2)]'
    }`;

    const bubbleStyle = {
        paddingLeft: bubblePadX,
        paddingRight: bubblePadX,
        paddingTop: bubblePadTop,
        paddingBottom: bubblePadBottom,
        borderRadius: `${bubbleRadius}px`,
    } as const;

    const firstContentRunIndex = fallbackRun.findIndex((r) => r.kind === 'content');
    const leadWithAction = fallbackRun[0]?.kind === 'action';

    const openMenuFromEvent = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        openMessageMenu(e.clientX, e.clientY);
    };
    const openMenuFromKeyboard = (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        const el = e.currentTarget;
        const rect = el.getBoundingClientRect();
        openMessageMenu(rect.left + rect.width / 2, rect.top + 8);
    };
    const bubbleInteractiveClass =
        'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c2a774]/45';

    const messageAuthorUserId = item.character?.user_id || item.message.user_id || null;

    const goPlayerCharacters = (e: React.MouseEvent, userId: string | null | undefined) => {
        e.stopPropagation();
        const u = userId?.trim();
        if (u) navigate(`/player/${u}/characters`);
    };

    const renderAuthorAvatar = (
        userId: string | null,
        src: string | null | undefined,
        opts: { alignSelfEnd?: boolean },
    ) => {
        const align = opts.alignSelfEnd ? 'self-end' : '';
        const face = src ? (
            <img
                src={src}
                alt=""
                className={`shrink-0 rounded-full object-cover ${align}`}
                style={{ width: avatarSize, height: avatarSize }}
            />
        ) : (
            <div
                className={`flex shrink-0 items-center justify-center rounded-full bg-[#1a231d] text-[#9fa68a] ${align}`}
                style={{ width: avatarSize, height: avatarSize, fontSize: `${12 * s}px` }}
            >
                ?
            </div>
        );
        if (!userId?.trim()) return face;
        return (
            <button
                type="button"
                title="Персонажи игрока"
                className={`rounded-full border-0 bg-transparent p-0 shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c2a774]/45 ${align}`}
                style={{ cursor: 'pointer' }}
                onClick={(e) => goPlayerCharacters(e, userId)}
            >
                {face}
            </button>
        );
    };

    return (
        <article
            id={messageDomId}
            ref={rootRef}
            className="relative w-full min-w-0"
            style={{ paddingTop: `${4 * s}px` }}
        >
            <div className="flex w-full min-w-0 flex-col" style={{ gap: `${6 * s}px` }}>
                {leadWithAction ? (
                    <div
                        className={`flex w-full min-w-0 items-end ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`flex max-w-[88%] items-end ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                            style={{ gap: `${8 * s}px` }}
                        >
                            {renderAuthorAvatar(messageAuthorUserId, avatar, {})}
                            <div className="flex min-w-0 flex-1 flex-col" style={{ gap: `${6 * s}px` }}>
                                {item.replyTo ? (
                                    <div
                                        className="border-[#5b5b5b] text-[#c7bc98]"
                                        style={{
                                            fontSize: `${12 * fontScale}px`,
                                            paddingLeft: `${8 * s}px`,
                                            borderLeftWidth: `${Math.max(1, Math.round(2 * s))}px`,
                                            borderLeftStyle: 'solid',
                                        }}
                                    >
                                        Ответ на: {item.replyTo.content.slice(0, 80)}
                                    </div>
                                ) : null}
                                <div
                                    className={`flex items-center ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                                    style={{ gap: `${6 * s}px` }}
                                >
                                    {messageAuthorUserId ? (
                                        <button
                                            type="button"
                                            title="Персонажи игрока"
                                            className={`m-0 max-w-full truncate border-0 bg-transparent p-0 text-left font-semibold shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c2a774]/45 ${
                                                isOwn ? 'text-right text-[#d8d1b2]' : 'text-left text-[#c7bc98]'
                                            }`}
                                            style={{ fontSize: `${10 * fontScale}px`, cursor: 'pointer' }}
                                            onClick={(e) => goPlayerCharacters(e, messageAuthorUserId)}
                                        >
                                            {highlightText(authorName, highlightQuery)}
                                        </button>
                                    ) : (
                                        <p
                                            className={`m-0 truncate font-semibold ${
                                                isOwn ? 'text-right text-[#d8d1b2]' : 'text-left text-[#c7bc98]'
                                            }`}
                                            style={{ fontSize: `${10 * fontScale}px` }}
                                        >
                                            {highlightText(authorName, highlightQuery)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
                {fallbackRun.map((run, ri) => {
                    if (run.kind === 'action') {
                        const isLongAction = run.text.length > 180 || run.text.includes('\n');
                        return (
                            <div key={`a-${ri}`} className="flex w-full min-w-0 justify-center py-0.5">
                                <div
                                    role="button"
                                    tabIndex={0}
                                    data-scene-msg-hit=""
                                    className={`max-w-[min(92%,640px)] border border-white/15 bg-[#4a5568]/78 px-4 py-2 text-[#f4f6fa] shadow-[0_2px_12px_rgba(0,0,0,0.35)] backdrop-blur-[3px] ${isLongAction ? 'rounded-2xl text-left' : 'rounded-full text-center'} ${bubbleInteractiveClass}`}
                                    style={{ fontSize: `${14 * fontScale}px`, lineHeight: 1.35 }}
                                    onClick={openMenuFromEvent}
                                    onKeyDown={openMenuFromKeyboard}
                                >
                                    <span className="whitespace-pre-wrap leading-snug">
                                        {highlightText(run.text, highlightQuery)}
                                    </span>
                                </div>
                            </div>
                        );
                    }

                    const isFirstContentRun = ri === firstContentRunIndex;
                    const useAvatarImage = isFirstContentRun && !leadWithAction;
                    const showAuthorMetaInColumn = isFirstContentRun && !leadWithAction;
                    const resolvedInlineSpeaker = run.inlineSpeaker
                        ? resolveSpaceCharacterByMentionName(run.inlineSpeaker, spaceCharacters)
                        : null;
                    const inlineSpeakerName = resolvedInlineSpeaker?.name ?? run.inlineSpeaker ?? '';
                    const inlineSpeakerAvatar = resolvedInlineSpeaker?.avatar ?? null;
                    const inlineSpeakerUserId = resolvedInlineSpeaker?.userId ?? null;

                    const renderContentBubbles = (
                        unitList: Extract<MessageUnit, { kind: 'content' }>[],
                        runIndex: number,
                    ) =>
                        unitList.map((unit, uidx) => {
                            const chunkIx = contentChunkGlobalIndex.get(`${runIndex}-${uidx}`) ?? 0;
                            const prependSpeech = item.message.type === 'speech' && chunkIx === 0;

                            return (
                                <div
                                    key={`c-${runIndex}-${uidx}`}
                                    role="button"
                                    tabIndex={0}
                                    data-scene-msg-hit=""
                                    className={`${bubbleClass} ${bubbleInteractiveClass}`}
                                    style={bubbleStyle}
                                    onClick={openMenuFromEvent}
                                    onKeyDown={openMenuFromKeyboard}
                                >
                                    <p
                                        className="m-0 whitespace-pre-wrap leading-snug"
                                        style={{
                                            fontSize: `${15 * fontScale}px`,
                                            lineHeight: 1.35,
                                        }}
                                    >
                                        {unit.segments.map((segment, idx) => {
                                            const key = `${runIndex}-${uidx}-${idx}`;
                                            if (segment.type === 'narration') {
                                                return (
                                                    <span key={key} className="italic text-[#dde0f8]">
                                                        {highlightText(segment.text, highlightQuery)}
                                                    </span>
                                                );
                                            }
                                            const firstTextIdx = unit.segments.findIndex((x) => x.type === 'text');
                                            const prefix =
                                                prependSpeech && segment.type === 'text' && idx === firstTextIdx
                                                    ? speechPrefix
                                                    : '';
                                            return (
                                                <span key={key}>
                                                    {prefix}
                                                    {highlightText(segment.text, highlightQuery)}
                                                </span>
                                            );
                                        })}
                                    </p>
                                </div>
                            );
                        });

                    if (run.inlineSpeaker) {
                        return (
                            <div
                                key={`c-run-${ri}`}
                                className={`flex w-full min-w-0 ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`flex max-w-[88%] min-w-0 items-end ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                                    style={{ gap: `${8 * s}px` }}
                                >
                                    {renderAuthorAvatar(inlineSpeakerUserId, inlineSpeakerAvatar, {
                                        alignSelfEnd: true,
                                    })}
                                    <div className="flex min-w-0 flex-1 flex-col" style={{ gap: `${6 * s}px` }}>
                                        {isFirstContentRun && item.replyTo ? (
                                            <div
                                                className="border-[#5b5b5b] text-[#c7bc98]"
                                                style={{
                                                    fontSize: `${12 * fontScale}px`,
                                                    paddingLeft: `${8 * s}px`,
                                                    borderLeftWidth: `${Math.max(1, Math.round(2 * s))}px`,
                                                    borderLeftStyle: 'solid',
                                                }}
                                            >
                                                Ответ на: {item.replyTo.content.slice(0, 80)}
                                            </div>
                                        ) : null}
                                        <div
                                            className={`flex items-center ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                                            style={{ gap: `${6 * s}px` }}
                                        >
                                            {inlineSpeakerUserId ? (
                                                <button
                                                    type="button"
                                                    title="Персонажи игрока"
                                                    className={`m-0 max-w-full truncate border-0 bg-transparent p-0 text-left font-semibold shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c2a774]/45 ${
                                                        isOwn
                                                            ? 'text-right text-[#d8d1b2]'
                                                            : 'text-left text-[#c7bc98]'
                                                    }`}
                                                    style={{ fontSize: `${10 * fontScale}px`, cursor: 'pointer' }}
                                                    onClick={(e) => goPlayerCharacters(e, inlineSpeakerUserId)}
                                                >
                                                    {highlightText(inlineSpeakerName, highlightQuery)}
                                                </button>
                                            ) : (
                                                <p
                                                    className={`m-0 truncate font-semibold ${
                                                        isOwn
                                                            ? 'text-right text-[#d8d1b2]'
                                                            : 'text-left text-[#c7bc98]'
                                                    }`}
                                                    style={{ fontSize: `${10 * fontScale}px` }}
                                                >
                                                    {highlightText(inlineSpeakerName, highlightQuery)}
                                                </p>
                                            )}
                                        </div>
                                        {renderContentBubbles(run.chunks, ri)}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={`c-run-${ri}`}
                            className={`flex w-full min-w-0 ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`flex max-w-[88%] min-w-0 items-end ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                                style={{ gap: `${8 * s}px` }}
                            >
                                {useAvatarImage ? (
                                    renderAuthorAvatar(messageAuthorUserId, avatar, { alignSelfEnd: true })
                                ) : (
                                    <div className="shrink-0 self-end" style={{ width: avatarSize }} aria-hidden />
                                )}
                                <div className="flex min-w-0 flex-1 flex-col" style={{ gap: `${6 * s}px` }}>
                                    {showAuthorMetaInColumn && item.replyTo ? (
                                        <div
                                            className="border-[#5b5b5b] text-[#c7bc98]"
                                            style={{
                                                fontSize: `${12 * fontScale}px`,
                                                paddingLeft: `${8 * s}px`,
                                                borderLeftWidth: `${Math.max(1, Math.round(2 * s))}px`,
                                                borderLeftStyle: 'solid',
                                            }}
                                        >
                                            Ответ на: {item.replyTo.content.slice(0, 80)}
                                        </div>
                                    ) : null}
                                    {showAuthorMetaInColumn ? (
                                        <div
                                            className={`flex items-center ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                                            style={{ gap: `${6 * s}px` }}
                                        >
                                            {messageAuthorUserId ? (
                                                <button
                                                    type="button"
                                                    title="Персонажи игрока"
                                                    className={`m-0 max-w-full truncate border-0 bg-transparent p-0 text-left font-semibold shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c2a774]/45 ${
                                                        isOwn
                                                            ? 'text-right text-[#d8d1b2]'
                                                            : 'text-left text-[#c7bc98]'
                                                    }`}
                                                    style={{ fontSize: `${10 * fontScale}px`, cursor: 'pointer' }}
                                                    onClick={(e) => goPlayerCharacters(e, messageAuthorUserId)}
                                                >
                                                    {highlightText(authorName, highlightQuery)}
                                                </button>
                                            ) : (
                                                <p
                                                    className={`m-0 truncate font-semibold ${
                                                        isOwn ? 'text-right text-[#d8d1b2]' : 'text-left text-[#c7bc98]'
                                                    }`}
                                                    style={{ fontSize: `${10 * fontScale}px` }}
                                                >
                                                    {highlightText(authorName, highlightQuery)}
                                                </p>
                                            )}
                                        </div>
                                    ) : null}
                                    {renderContentBubbles(run.chunks, ri)}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {showMessageTime ? (
                    <div
                        className={`flex w-full min-w-0 ${isOwn ? 'justify-end' : 'justify-start'}`}
                        style={{ marginTop: `${2 * s}px` }}
                    >
                        <p
                            className={`m-0 max-w-[88%] opacity-75 ${isOwn ? 'pr-1 text-right' : 'pl-1 text-left'}`}
                            style={{
                                fontSize: `${9 * fontScale}px`,
                                paddingLeft: isOwn ? undefined : avatarSize + 8 * s,
                                paddingRight: isOwn ? avatarSize + 8 * s : undefined,
                            }}
                        >
                            {formatSceneMessageTimestamp(item.message.created_at, messageTimeWithSeconds)}
                            {item.message.edited ? ' · изменено' : ''}
                        </p>
                    </div>
                ) : null}
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
