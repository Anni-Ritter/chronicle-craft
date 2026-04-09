import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { ArrowLeft, ChevronDown, ChevronUp, Clock, Search, Settings, X } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { useRoleplayStore } from '../../store/useRoleplayStore';
import { useWorldStore } from '../../store/useWorldStore';
import { useChronicleStore } from '../../store/useChronicleStore';
import { useSceneMessagesRealtime } from '../../hooks/useSceneMessagesRealtime';
import { SceneMessageItem } from '../../features/roleplay/SceneMessageItem';
import { SceneComposer } from '../../features/roleplay/SceneComposer';
import { RoleplaySceneForm } from '../../features/roleplay/RoleplaySceneForm';
import type { RoleplayMessageType, RoleplayScene, RoleplaySpaceCharacterView } from '../../types/roleplay';

const DEFAULT_CHAT_TIME_DISPLAY = { show: true, withSeconds: true };

export const RoleplayScenePage = () => {
    const { spaceId, sceneId } = useParams<{ spaceId: string; sceneId: string }>();
    const navigate = useNavigate();
    const session = useSession();
    const supabase = useSupabaseClient();
    const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editingInitialContent, setEditingInitialContent] = useState('');
    const [sceneBackgroundImage, setSceneBackgroundImage] = useState<string | null>(null);
    const [sceneTitle, setSceneTitle] = useState('Сцена');
    const [sceneSettingsOpen, setSceneSettingsOpen] = useState(false);
    const [sceneForEdit, setSceneForEdit] = useState<RoleplayScene | null>(null);
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [chatFontScale, setChatFontScale] = useState(1);
    const [sendError, setSendError] = useState<string | null>(null);
    const [messageSearchQuery, setMessageSearchQuery] = useState('');
    const [sceneSearchOpen, setSceneSearchOpen] = useState(false);
    const [searchMatchIndex, setSearchMatchIndex] = useState(0);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const didInitialScrollRef = useRef(false);
    const [isNearChatBottom, setIsNearChatBottom] = useState(true);

    const SCROLL_BOTTOM_THRESHOLD_PX = 96;

    const updateNearChatBottom = useCallback(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
        setIsNearChatBottom(gap <= SCROLL_BOTTOM_THRESHOLD_PX);
    }, []);

    const {
        spaceCharactersBySpace,
        sceneMessagesByScene,
        getRoleplaySpaceCharacters,
        getSceneMessages,
        getCharacterEmotions,
        createSceneMessage,
        updateSceneMessage,
        deleteSceneMessage,
        updateRoleplayScene,
        getRoleplaySpaceById,
    } = useRoleplayStore();
    const { worlds, fetchWorlds } = useWorldStore();
    const { chronicles, fetchChronicles } = useChronicleStore();

    const refreshMessages = useCallback(() => {
        if (!sceneId) return;
        getSceneMessages(sceneId, supabase);
    }, [sceneId, supabase, getSceneMessages]);

    useEffect(() => {
        if (!spaceId || !sceneId) return;
        getSceneMessages(sceneId, supabase);
    }, [spaceId, sceneId, supabase, getSceneMessages]);

    useEffect(() => {
        if (!sceneId || !spaceId) return;
        supabase
            .from('roleplay_scenes')
            .select('title, background_image, world_id')
            .eq('id', sceneId)
            .maybeSingle()
            .then(({ data }) => {
                setSceneTitle(data?.title || 'Сцена');
                setSceneBackgroundImage(data?.background_image ?? null);
                getRoleplaySpaceCharacters(spaceId, supabase, data?.world_id ?? null);
            });
    }, [sceneId, spaceId, supabase, getRoleplaySpaceCharacters]);

    useSceneMessagesRealtime(sceneId ?? null, refreshMessages);

    const sceneFontStorageKey = sceneId ? `cc:roleplay-scene-chat-font:${sceneId}` : '';
    const sceneChatTimeStorageKey = sceneId ? `cc:roleplay-scene-chat-time:${sceneId}` : '';

    const [chatTimeDisplay, setChatTimeDisplay] = useState(DEFAULT_CHAT_TIME_DISPLAY);

    useEffect(() => {
        if (!sceneFontStorageKey) {
            setChatFontScale(1);
            return;
        }
        try {
            const raw = localStorage.getItem(sceneFontStorageKey);
            const parsed = raw ? parseFloat(raw) : 1;
            if (!Number.isFinite(parsed)) {
                setChatFontScale(1);
            } else {
                setChatFontScale(Math.min(1.45, Math.max(0.75, parsed)));
            }
        } catch {
            setChatFontScale(1);
        }
    }, [sceneFontStorageKey]);

    useEffect(() => {
        if (!sceneChatTimeStorageKey) {
            setChatTimeDisplay(DEFAULT_CHAT_TIME_DISPLAY);
            return;
        }
        try {
            const raw = localStorage.getItem(sceneChatTimeStorageKey);
            if (!raw) {
                setChatTimeDisplay(DEFAULT_CHAT_TIME_DISPLAY);
                return;
            }
            const p = JSON.parse(raw) as { show?: unknown; withSeconds?: unknown };
            setChatTimeDisplay({
                show: typeof p.show === 'boolean' ? p.show : DEFAULT_CHAT_TIME_DISPLAY.show,
                withSeconds:
                    typeof p.withSeconds === 'boolean' ? p.withSeconds : DEFAULT_CHAT_TIME_DISPLAY.withSeconds,
            });
        } catch {
            setChatTimeDisplay(DEFAULT_CHAT_TIME_DISPLAY);
        }
    }, [sceneChatTimeStorageKey]);

    const persistChatTimeDisplay = useCallback(
        (next: { show: boolean; withSeconds: boolean }) => {
            setChatTimeDisplay(next);
            if (!sceneChatTimeStorageKey) return;
            try {
                localStorage.setItem(sceneChatTimeStorageKey, JSON.stringify(next));
            } catch {
                /* ignore */
            }
        },
        [sceneChatTimeStorageKey],
    );

    const handleChatFontScaleChange = (next: number) => {
        const clamped = Math.min(1.45, Math.max(0.75, next));
        setChatFontScale(clamped);
        if (sceneFontStorageKey) {
            localStorage.setItem(sceneFontStorageKey, String(clamped));
        }
    };

    const openSceneSettings = async () => {
        if (!sceneId || !spaceId) return;
        setSettingsLoading(true);
        setSceneSettingsOpen(true);
        try {
            const [{ data: sceneRow }, space] = await Promise.all([
                supabase.from('roleplay_scenes').select('*').eq('id', sceneId).maybeSingle(),
                getRoleplaySpaceById(spaceId, supabase),
            ]);
            setSceneForEdit((sceneRow ?? null) as RoleplayScene | null);
            const uid = session?.user?.id;
            if (uid) await fetchWorlds(uid, supabase);
            if (space?.world_id) {
                await fetchChronicles(supabase, space.world_id);
            } else {
                await fetchChronicles(supabase);
            }
        } finally {
            setSettingsLoading(false);
        }
    };

    const spaceCharacters = useMemo(
        () => (spaceId ? spaceCharactersBySpace[spaceId] ?? [] : []),
        [spaceId, spaceCharactersBySpace]
    );
    const messages = useMemo(
        () =>
            sceneId
                ? (sceneMessagesByScene[sceneId] ?? []).filter((item) => item.message.type !== 'system')
                : [],
        [sceneId, sceneMessagesByScene]
    );

    const filteredMessages = useMemo(() => {
        if (!sceneSearchOpen) return messages;
        const q = messageSearchQuery.trim().toLowerCase();
        if (!q) return messages;
        return messages.filter((item) => {
            const haystack = [
                item.message.content,
                item.character?.name ?? '',
                item.author?.username ?? '',
            ]
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [messages, messageSearchQuery, sceneSearchOpen]);

    const ownCharacterIds = useMemo(
        () =>
            new Set(
                spaceCharacters
                    .filter((item) => item.character.user_id === session?.user?.id)
                    .map((item) => item.character.id)
            ),
        [spaceCharacters, session?.user?.id]
    );
    const ownSpaceCharacters = useMemo(
        () => spaceCharacters.filter((item) => item.character.user_id === session?.user?.id),
        [spaceCharacters, session?.user?.id]
    );

    useEffect(() => {
        didInitialScrollRef.current = false;
        setMessageSearchQuery('');
        setSceneSearchOpen(false);
        setSearchMatchIndex(0);
        setIsNearChatBottom(true);
    }, [sceneId]);

    useEffect(() => {
        setSearchMatchIndex(0);
    }, [messageSearchQuery]);

    useEffect(() => {
        if (filteredMessages.length === 0) return;
        setSearchMatchIndex((i) => Math.min(i, filteredMessages.length - 1));
    }, [filteredMessages.length]);

    useEffect(() => {
        if (!sceneSearchOpen) return;
        requestAnimationFrame(() => searchInputRef.current?.focus());
    }, [sceneSearchOpen]);

    const activeSearchMessageId = useMemo(() => {
        if (!sceneSearchOpen || !messageSearchQuery.trim() || filteredMessages.length === 0) return null;
        return filteredMessages[searchMatchIndex]?.message.id ?? null;
    }, [sceneSearchOpen, messageSearchQuery, filteredMessages, searchMatchIndex]);

    useEffect(() => {
        if (!sceneSearchOpen || !messageSearchQuery.trim() || !activeSearchMessageId) return;
        const t = window.requestAnimationFrame(() => {
            document
                .getElementById(`scene-msg-${activeSearchMessageId}`)
                ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        });
        return () => cancelAnimationFrame(t);
    }, [sceneSearchOpen, messageSearchQuery, activeSearchMessageId]);

    useEffect(() => {
        const id = window.requestAnimationFrame(() => {
            updateNearChatBottom();
        });
        return () => cancelAnimationFrame(id);
    }, [messages.length, filteredMessages.length, chatFontScale, updateNearChatBottom]);

    useEffect(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        const scrollToBottom = () => {
            el.scrollTop = el.scrollHeight;
        };

        if (sceneSearchOpen && messageSearchQuery.trim()) {
            return;
        }

        // На первом рендере сцены скроллим без анимации, чтобы не остаться вверху.
        if (!didInitialScrollRef.current) {
            didInitialScrollRef.current = true;
            requestAnimationFrame(scrollToBottom);
            setTimeout(scrollToBottom, 0);
            setTimeout(scrollToBottom, 120);
            return;
        }

        // На новых сообщениях держим вид на последнем сообщении.
        requestAnimationFrame(scrollToBottom);
    }, [messages, sceneId, sceneSearchOpen, messageSearchQuery]);

    const closeSceneSearch = useCallback(() => {
        setSceneSearchOpen(false);
        setMessageSearchQuery('');
        setSearchMatchIndex(0);
    }, []);

    if (!spaceId || !sceneId) return null;

    const resolveCharacterFromMention = (raw: string, characters: RoleplaySpaceCharacterView[]) => {
        const mentionWithColonMatch = raw.match(/^\s*@([^:]+)\s*:\s*/);
        if (mentionWithColonMatch) {
            const mentionedName = mentionWithColonMatch[1].trim().toLowerCase();
            const character = characters.find((c) => c.character.name.toLowerCase() === mentionedName);
            const baseContent = raw.replace(/^\s*@([^:]+)\s*:\s*/, '').trim();
            const emotionMatch = raw.match(/\[([^\]\n]{1,80})\]/);
            const content = baseContent.replace(/\[([^\]\n]{1,80})\]/, '').replace(/\s{2,}/g, ' ').trim();
            return {
                characterId: character?.character.id ?? null,
                emotionName: emotionMatch?.[1]?.trim() ?? null,
                content,
            };
        }

        const mentionMatch = raw.match(/^\s*@([^\s:]+)\s*:?\s*/);
        if (!mentionMatch) {
            const emotionMatch = raw.match(/\[([^\]\n]{1,80})\]/);
            const contentWithoutEmotion = raw.replace(/\[([^\]\n]{1,80})\]/, '').replace(/\s{2,}/g, ' ').trim();
            return {
                characterId: null as string | null,
                emotionName: emotionMatch?.[1]?.trim() ?? null,
                content: contentWithoutEmotion,
            };
        }

        const mentionedName = mentionMatch[1].toLowerCase();
        const character = characters.find((c) => c.character.name.toLowerCase() === mentionedName);
        const baseContent = raw.replace(/^\s*@([^\s:]+)\s*:?\s*/, '').trim();
        const emotionMatch = raw.match(/\[([^\]\n]{1,80})\]/);
        const content = baseContent.replace(/\[([^\]\n]{1,80})\]/, '').replace(/\s{2,}/g, ' ').trim();
        return {
            characterId: character?.character.id ?? null,
            emotionName: emotionMatch?.[1]?.trim() ?? null,
            content,
        };
    };

    const detectMessageType = (text: string, hasCharacter: boolean): RoleplayMessageType => {
        const trimmed = text.trim();
        if (!trimmed) return 'system';
        if (/^-\s*/.test(trimmed)) return 'speech';
        if (/^\*[^*]+\*$/.test(trimmed)) return 'action';
        if (/^`[^`]+`$/.test(trimmed)) return 'narration';
        return hasCharacter ? 'speech' : 'narration';
    };

    return (
        <div className="mx-auto mt-0 flex h-[calc(var(--app-vh,1vh)*100)] max-w-[1440px] flex-col gap-2 overflow-hidden px-2 pb-0 md:h-[100dvh] md:px-4">
            <header className="relative z-[5] px-1 pt-2">
                {sceneSearchOpen ? (
                    <div className="flex min-w-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={closeSceneSearch}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#2f3a34] bg-[#101712] text-[#c7bc98] transition hover:border-[#c2a77466] hover:text-[#f4ecd0]"
                            aria-label="Закрыть поиск"
                            title="Закрыть поиск"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div className="relative min-w-0 flex-1">
                            <Search
                                className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-[#c2a774]"
                                size={18}
                                aria-hidden
                            />
                            <input
                                ref={searchInputRef}
                                type="text"
                                autoComplete="off"
                                value={messageSearchQuery}
                                onChange={(e) => setMessageSearchQuery(e.target.value)}
                                placeholder="Поиск по сообщениям..."
                                className="w-full rounded-full border border-[#c2a774]/40 bg-[#101712] py-2 pl-10 pr-10 text-sm text-[#e5d9a5] placeholder:text-[#6b7568] focus:border-[#c2a774] focus:outline-none"
                                aria-label="Поиск по сообщениям"
                            />
                            {messageSearchQuery ? (
                                <button
                                    type="button"
                                    onClick={() => setMessageSearchQuery('')}
                                    className="absolute right-2 top-1/2 z-[1] -translate-y-1/2 rounded-full p-1 text-[#c7bc98] transition hover:bg-white/5 hover:text-[#f4ecd0]"
                                    aria-label="Очистить строку"
                                >
                                    <X size={18} />
                                </button>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    <div className="flex min-w-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate(`/roleplay/${spaceId}`)}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#2f3a34] bg-[#101712] text-[#c7bc98] transition hover:border-[#c2a77466] hover:text-[#f4ecd0]"
                            aria-label="Назад"
                            title="Назад"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <h1 className="min-w-0 flex-1 truncate text-2xl font-garamond text-[#f4ecd0] md:text-3xl">
                            {sceneTitle}
                        </h1>
                        <button
                            type="button"
                            onClick={() => setSceneSearchOpen(true)}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#2f3a34] bg-[#101712] text-[#c7bc98] transition hover:border-[#c2a77466] hover:text-[#f4ecd0]"
                            aria-label="Поиск по сообщениям"
                            title="Поиск"
                        >
                            <Search size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={openSceneSettings}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#2f3a34] bg-[#101712] text-[#c7bc98] transition hover:border-[#c2a77466] hover:text-[#f4ecd0]"
                            aria-label="Настройки сцены"
                            title="Настройки сцены"
                        >
                            <Settings size={18} />
                        </button>
                    </div>
                )}
                {sceneSearchOpen && messageSearchQuery.trim() && messages.length > 0 ? (
                    <p className="mt-1 text-center text-[11px] text-[#7f8a7b]">
                        Найдено: {filteredMessages.length} из {messages.length}
                    </p>
                ) : null}
            </header>

            <Modal isOpen={sceneSettingsOpen} onClose={() => setSceneSettingsOpen(false)}>
                <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto p-1 text-[#e5d9a5]">
                    <h2 className="mb-4 text-xl font-garamond text-[#f4ecd0] md:text-2xl">Настройки сцены</h2>

                    <section className="mb-6 rounded-xl border border-[#2f3a34] bg-[#0d120f]/90 p-3">
                        <h3 className="mb-2 text-xs uppercase tracking-[0.14em] text-[#c7bc98]">
                            Размер шрифта в чате
                        </h3>
                        <p className="mb-3 text-xs text-[#9fa68a]">
                            Крупнее или мельче текст сообщений и поля ввода. Сохраняется для этой сцены на устройстве.
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <input
                                type="range"
                                min={75}
                                max={145}
                                step={5}
                                value={Math.round(chatFontScale * 100)}
                                onChange={(e) => handleChatFontScaleChange(Number(e.target.value) / 100)}
                                className="min-w-0 flex-1 accent-[#c2a774]"
                            />
                            <span className="w-12 shrink-0 text-sm tabular-nums text-[#d8c693]">
                                {Math.round(chatFontScale * 100)}%
                            </span>
                        </div>
                    </section>

                    <section className="mb-6 space-y-3 rounded-xl border border-[#2f3a34] bg-[#0d120f]/90 p-3">
                        <h3 className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#c7bc98]">
                            <Clock className="h-4 w-4 text-[#c2a774]" aria-hidden />
                            Время у сообщений
                        </h3>
                        <p className="text-xs text-[#9fa68a]">
                            Только на этом устройстве, без сохранения на сервер.
                        </p>
                        <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-[#e5d9a5]">
                            <span>Показывать время у сообщений</span>
                            <input
                                type="checkbox"
                                checked={chatTimeDisplay.show}
                                onChange={(e) => {
                                    const on = e.target.checked;
                                    persistChatTimeDisplay({
                                        show: on,
                                        withSeconds: on ? chatTimeDisplay.withSeconds : false,
                                    });
                                }}
                                className="h-4 w-4 shrink-0 rounded border-[#3a4a34] bg-[#0e1b12] accent-[#c2a774]"
                            />
                        </label>
                        <label
                            className={`flex cursor-pointer items-center justify-between gap-3 text-sm ${
                                chatTimeDisplay.show ? 'text-[#e5d9a5]' : 'cursor-not-allowed text-[#6b7568]'
                            }`}
                        >
                            <span>Показывать секунды во времени</span>
                            <input
                                type="checkbox"
                                checked={chatTimeDisplay.withSeconds}
                                disabled={!chatTimeDisplay.show}
                                onChange={(e) =>
                                    persistChatTimeDisplay({
                                        show: chatTimeDisplay.show,
                                        withSeconds: e.target.checked,
                                    })
                                }
                                className="h-4 w-4 shrink-0 rounded border-[#3a4a34] bg-[#0e1b12] accent-[#c2a774] disabled:opacity-40"
                            />
                        </label>
                    </section>

                    <section>
                        <h3 className="mb-3 text-xs uppercase tracking-[0.14em] text-[#c7bc98]">
                            Параметры сцены
                        </h3>
                        {settingsLoading || !sceneForEdit ? (
                            <p className="text-sm text-[#9fa68a]">Загрузка...</p>
                        ) : (
                            <RoleplaySceneForm
                                worlds={worlds}
                                chronicles={chronicles}
                                titleText="Редактировать сцену"
                                submitText="Сохранить"
                                initialValues={{
                                    title: sceneForEdit.title,
                                    description: sceneForEdit.description,
                                    world_id: sceneForEdit.world_id,
                                    chronicle_id: sceneForEdit.chronicle_id,
                                    background_image: sceneForEdit.background_image,
                                    status: sceneForEdit.status,
                                    settings: sceneForEdit.settings,
                                }}
                                onCancel={() => setSceneSettingsOpen(false)}
                                onSubmit={async (values) => {
                                    const updated = await updateRoleplayScene(sceneForEdit.id, values, supabase);
                                    if (updated) {
                                        setSceneTitle(updated.title || 'Сцена');
                                        setSceneBackgroundImage(updated.background_image ?? null);
                                        setSceneForEdit(updated);
                                        await getRoleplaySpaceCharacters(spaceId, supabase, updated.world_id ?? null);
                                        setSceneSettingsOpen(false);
                                    }
                                }}
                            />
                        )}
                    </section>
                </div>
            </Modal>

            <section
                className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#2f3a34] bg-[#0d120f]/80 p-2 md:p-2.5"
                style={
                    sceneBackgroundImage
                        ? {
                            backgroundImage: `url(${sceneBackgroundImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }
                        : undefined
                }
            >
                {sceneBackgroundImage && <div className="pointer-events-none absolute inset-0 bg-[#060a08]/77" />}
                <div
                    ref={messagesContainerRef}
                    onScroll={updateNearChatBottom}
                    className="relative z-[1] mb-1 flex min-h-0 flex-1 flex-col overflow-y-auto"
                    style={{
                        gap: `${8 * chatFontScale}px`,
                        paddingRight: `${4 * chatFontScale}px`,
                        paddingBottom: `${8 * chatFontScale}px`,
                    }}
                >
                    {messages.length === 0 && (
                        <div className="p-3 text-center text-[#c7bc98]">
                            В этой сцене пока нет сообщений.
                        </div>
                    )}
                    {sceneSearchOpen && messageSearchQuery.trim() && messages.length > 0 && filteredMessages.length === 0 && (
                        <div className="p-3 text-center text-[#c7bc98]">
                            По запросу «{messageSearchQuery.trim()}» ничего не найдено.
                        </div>
                    )}
                    {filteredMessages.map((item) => (
                        <SceneMessageItem
                            key={item.message.id}
                            messageDomId={`scene-msg-${item.message.id}`}
                            highlightQuery={sceneSearchOpen && messageSearchQuery.trim() ? messageSearchQuery : null}
                            showMessageTime={chatTimeDisplay.show}
                            messageTimeWithSeconds={chatTimeDisplay.withSeconds}
                            fontScale={chatFontScale}
                            spaceCharacters={spaceCharacters}
                            item={item}
                            onReply={setReplyToMessageId}
                            onStartEdit={(messageId, content) => {
                                setReplyToMessageId(null);
                                setEditingMessageId(messageId);
                                setEditingInitialContent(content);
                            }}
                            isOwn={item.message.user_id === session?.user?.id}
                            canManage={item.message.user_id === session?.user?.id}
                            onDelete={async (messageId) => {
                                await deleteSceneMessage(messageId, supabase);
                                await refreshMessages();
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-[3] mt-auto">
                    {messages.length > 0 && !isNearChatBottom ? (
                        <div
                            className={`pointer-events-none absolute bottom-full z-[5] mb-2 ${
                                sceneSearchOpen && messageSearchQuery.trim() && filteredMessages.length > 0
                                    ? 'right-12'
                                    : 'right-2'
                            }`}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    const el = messagesContainerRef.current;
                                    if (!el) return;
                                    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
                                }}
                                className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#2f3a34] bg-[#101712] text-[#c7bc98] shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition hover:border-[#c2a77466] hover:text-[#f4ecd0]"
                                aria-label="Прокрутить к последнему сообщению"
                                title="В самый низ"
                            >
                                <ChevronDown size={20} />
                            </button>
                        </div>
                    ) : null}
                    {sceneSearchOpen && messageSearchQuery.trim() && filteredMessages.length > 0 ? (
                        <div className="pointer-events-none absolute bottom-full right-1 z-[5] mb-1 flex flex-col gap-1">
                            <button
                                type="button"
                                onClick={() =>
                                    setSearchMatchIndex(
                                        (i) => (i - 1 + filteredMessages.length) % filteredMessages.length
                                    )
                                }
                                className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#2f3a34] bg-[#101712] text-[#c7bc98] shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition hover:border-[#c2a77466] hover:text-[#f4ecd0]"
                                aria-label="Предыдущее совпадение"
                                title="Выше"
                            >
                                <ChevronUp size={20} />
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setSearchMatchIndex((i) => (i + 1) % filteredMessages.length)
                                }
                                className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#2f3a34] bg-[#101712] text-[#c7bc98] shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition hover:border-[#c2a77466] hover:text-[#f4ecd0]"
                                aria-label="Следующее совпадение"
                                title="Ниже"
                            >
                                <ChevronDown size={20} />
                            </button>
                        </div>
                    ) : null}
                    <div
                        className="sticky bottom-0 z-[2] border-t border-[#2f3a34]/80 bg-[#0a0f0c]/92 backdrop-blur-[2px]"
                        style={{ paddingTop: `${6 * chatFontScale}px` }}
                    >
                    {sendError && (
                        <p
                            className="px-1 text-[#e7b0b0]"
                            style={{ marginBottom: `${4 * chatFontScale}px`, fontSize: `${12 * chatFontScale}px` }}
                        >
                            {sendError}
                        </p>
                    )}
                    <SceneComposer
                        fontScale={chatFontScale}
                        availableCharacters={ownSpaceCharacters}
                        replyToMessageId={replyToMessageId}
                        onClearReply={() => setReplyToMessageId(null)}
                        editMessageId={editingMessageId}
                        editInitialContent={editingInitialContent}
                        onCancelEdit={() => {
                            setEditingMessageId(null);
                            setEditingInitialContent('');
                        }}
                        onSaveEdit={async (messageId, nextContent) => {
                            const current = messages.find((m) => m.message.id === messageId);
                            const parsed = resolveCharacterFromMention(nextContent, spaceCharacters);
                            // При редактировании нельзя "переобуться" на чужого персонажа.
                            if (parsed.characterId && !ownCharacterIds.has(parsed.characterId)) {
                                setSendError('Нельзя писать от лица чужого персонажа. Выберите своего через @Имя.');
                                return;
                            }

                            const normalizeEmotion = (value: string) =>
                                value
                                    .trim()
                                    .toLowerCase()
                                    .replace(/\s+/g, ' ');

                            // При редактировании привязываем эмоцию к текущему персонажу сообщения,
                            // либо к явно указанному @персонажу (если это ваш персонаж).
                            const effectiveCharacterId = parsed.characterId ?? current?.message.character_id ?? null;
                            let emotionId: string | null = null;
                            let emotionMeta: Record<string, unknown> = {};
                            if (effectiveCharacterId && parsed.emotionName) {
                                const emotions = await getCharacterEmotions(effectiveCharacterId, supabase);
                                const normalizedEmotionName = normalizeEmotion(parsed.emotionName);
                                const matchedEmotion = emotions.find(
                                    (emotion) => normalizeEmotion(emotion.name) === normalizedEmotionName
                                );
                                emotionId = matchedEmotion?.id ?? null;
                                if (matchedEmotion) {
                                    emotionMeta = {
                                        emotion_snapshot: {
                                            id: matchedEmotion.id,
                                            character_id: matchedEmotion.character_id,
                                            name: matchedEmotion.name,
                                            image_url: matchedEmotion.image_url,
                                            thumbnail_url: matchedEmotion.thumbnail_url,
                                        },
                                    };
                                }
                            }

                            await updateSceneMessage(
                                messageId,
                                {
                                    content: parsed.content,
                                    edited: true,
                                    emotion_id: emotionId,
                                    metadata: emotionMeta,
                                },
                                supabase
                            );
                            await refreshMessages();
                        }}
                        onSend={async ({ content, reply_to_message_id }) => {
                            const uid = session?.user?.id;
                            if (!uid || !sceneId) return;
                            setSendError(null);
                            const parsed = resolveCharacterFromMention(content, spaceCharacters);
                            if (parsed.characterId && !ownCharacterIds.has(parsed.characterId)) {
                                setSendError('Нельзя писать от лица чужого персонажа. Выберите своего через @Имя.');
                                return;
                            }
                            const messageType = detectMessageType(parsed.content, !!parsed.characterId);
                            let emotionId: string | null = null;
                            let emotionMeta: Record<string, unknown> = {};
                            if (parsed.characterId && parsed.emotionName) {
                                const emotions = await getCharacterEmotions(parsed.characterId, supabase);
                                const normalizeEmotion = (value: string) =>
                                    value
                                        .trim()
                                        .toLowerCase()
                                        .replace(/\s+/g, ' ');
                                const normalizedEmotionName = normalizeEmotion(parsed.emotionName);
                                const matchedEmotion = emotions.find(
                                    (emotion) => normalizeEmotion(emotion.name) === normalizedEmotionName
                                );
                                emotionId = matchedEmotion?.id ?? null;
                                if (matchedEmotion) {
                                    emotionMeta = {
                                        emotion_snapshot: {
                                            id: matchedEmotion.id,
                                            character_id: matchedEmotion.character_id,
                                            name: matchedEmotion.name,
                                            image_url: matchedEmotion.image_url,
                                            thumbnail_url: matchedEmotion.thumbnail_url,
                                        },
                                    };
                                }
                            }
                            await createSceneMessage(
                                {
                                    scene_id: sceneId,
                                    user_id: uid,
                                    character_id: parsed.characterId,
                                    emotion_id: emotionId,
                                    type: messageType,
                                    content: parsed.content,
                                    reply_to_message_id,
                                    metadata: emotionMeta,
                                },
                                supabase
                            );
                            await refreshMessages();
                        }}
                    />
                    </div>
                </div>
            </section>
        </div>
    );
};
