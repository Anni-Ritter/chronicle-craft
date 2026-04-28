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
import type {
    RoleplayMessageType,
    RoleplayScene,
    RoleplaySceneBackgroundPreset,
    SceneMessageView,
    RoleplaySpaceCharacterView,
} from '../../types/roleplay';

const DEFAULT_CHAT_TIME_DISPLAY = { show: true, withSeconds: true };
/** Непрозрачность тёмного слоя поверх фоновой картинки (0–100), по умолчанию как раньше (~77%). */
const DEFAULT_SCENE_BG_DIM_PERCENT = 77;
const SCENE_BG_OVERLAY_RGB = '6, 10, 8';

export const RoleplayScenePage = () => {
    const { spaceId, sceneId } = useParams<{ spaceId: string; sceneId: string }>();
    const navigate = useNavigate();
    const session = useSession();
    const supabase = useSupabaseClient();
    const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editingInitialContent, setEditingInitialContent] = useState('');
    const [sceneBackgroundImage, setSceneBackgroundImage] = useState<string | null>(null);
    const [timelineBackgroundImage, setTimelineBackgroundImage] = useState<string | null>(null);
    const [sceneBaseBackgroundImage, setSceneBaseBackgroundImage] = useState<string | null>(null);
    const [sceneTitle, setSceneTitle] = useState('Сцена');
    const [sceneSettingsOpen, setSceneSettingsOpen] = useState(false);
    const [sceneForEdit, setSceneForEdit] = useState<RoleplayScene | null>(null);
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [sceneBackgroundPresets, setSceneBackgroundPresets] = useState<RoleplaySceneBackgroundPreset[]>([]);
    const [chatFontScale, setChatFontScale] = useState(1);
    const [sendError, setSendError] = useState<string | null>(null);
    const [messageSearchQuery, setMessageSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SceneMessageView[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [sceneSearchOpen, setSceneSearchOpen] = useState(false);
    const [searchMatchIndex, setSearchMatchIndex] = useState(0);
    const [hasMoreOlderMessages, setHasMoreOlderMessages] = useState(true);
    const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
    const [oldestMessageCursor, setOldestMessageCursor] = useState<string | null>(null);
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
        error: roleplayError,
        getRoleplaySpaceCharacters,
        getSceneMessagesPage,
        searchSceneMessages,
        getCharacterEmotions,
        createSceneMessage,
        updateSceneMessage,
        deleteSceneMessage,
        updateRoleplayScene,
        getRoleplaySpaceById,
    } = useRoleplayStore();
    const { worlds, fetchWorlds } = useWorldStore();
    const { chronicles, fetchChronicles } = useChronicleStore();

    const refreshMessages = useCallback(async () => {
        if (!sceneId) return;
        await getSceneMessagesPage(sceneId, supabase, {
            limit: 200,
            preserveExisting: true,
        });
    }, [sceneId, supabase, getSceneMessagesPage]);

    useEffect(() => {
        if (!spaceId || !sceneId) return;
        setHasMoreOlderMessages(true);
        setOldestMessageCursor(null);
        getSceneMessagesPage(sceneId, supabase, { limit: 200 }).then((result) => {
            setHasMoreOlderMessages(result.hasMore);
            setOldestMessageCursor(result.oldestCursor);
        });
    }, [spaceId, sceneId, supabase, getSceneMessagesPage]);

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
                setTimelineBackgroundImage(data?.background_image ?? null);
                setSceneBaseBackgroundImage(data?.background_image ?? null);
                getRoleplaySpaceCharacters(spaceId, supabase, data?.world_id ?? null);
            });
    }, [sceneId, spaceId, supabase, getRoleplaySpaceCharacters]);

    useEffect(() => {
        if (!spaceId) return;
        supabase
            .from('roleplay_scene_background_presets')
            .select('*')
            .eq('space_id', spaceId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true })
            .then(({ data }) => {
                setSceneBackgroundPresets((data ?? []) as RoleplaySceneBackgroundPreset[]);
            });
    }, [spaceId, supabase]);

    useSceneMessagesRealtime(sceneId ?? null, refreshMessages);

    const sceneFontStorageKey = sceneId ? `cc:roleplay-scene-chat-font:${sceneId}` : '';
    const sceneChatTimeStorageKey = sceneId ? `cc:roleplay-scene-chat-time:${sceneId}` : '';
    const sceneBgDimStorageKey = sceneId ? `cc:roleplay-scene-bg-dim:${sceneId}` : '';
    const sceneDraftStorageKey = sceneId ? `cc:roleplay-scene-draft:${sceneId}` : '';

    const [chatTimeDisplay, setChatTimeDisplay] = useState(DEFAULT_CHAT_TIME_DISPLAY);
    const [sceneBackgroundDimPercent, setSceneBackgroundDimPercent] = useState(DEFAULT_SCENE_BG_DIM_PERCENT);

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

    useEffect(() => {
        if (!sceneBgDimStorageKey) {
            setSceneBackgroundDimPercent(DEFAULT_SCENE_BG_DIM_PERCENT);
            return;
        }
        try {
            const raw = localStorage.getItem(sceneBgDimStorageKey);
            const parsed = raw != null && raw !== '' ? parseFloat(raw) : DEFAULT_SCENE_BG_DIM_PERCENT;
            if (!Number.isFinite(parsed)) {
                setSceneBackgroundDimPercent(DEFAULT_SCENE_BG_DIM_PERCENT);
            } else {
                setSceneBackgroundDimPercent(Math.min(100, Math.max(0, Math.round(parsed))));
            }
        } catch {
            setSceneBackgroundDimPercent(DEFAULT_SCENE_BG_DIM_PERCENT);
        }
    }, [sceneBgDimStorageKey]);

    const persistSceneBackgroundDim = useCallback(
        (nextPercent: number) => {
            const clamped = Math.min(100, Math.max(0, Math.round(nextPercent)));
            setSceneBackgroundDimPercent(clamped);
            if (!sceneBgDimStorageKey) return;
            try {
                localStorage.setItem(sceneBgDimStorageKey, String(clamped));
            } catch {
                /* ignore */
            }
        },
        [sceneBgDimStorageKey],
    );

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
            const { data: presetRows } = await supabase
                .from('roleplay_scene_background_presets')
                .select('*')
                .eq('space_id', spaceId)
                .order('sort_order', { ascending: true })
                .order('name', { ascending: true });
            setSceneBackgroundPresets((presetRows ?? []) as RoleplaySceneBackgroundPreset[]);
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
    const allSceneMessages = useMemo(
        () => (sceneId ? sceneMessagesByScene[sceneId] ?? [] : []),
        [sceneId, sceneMessagesByScene]
    );

    const filteredMessages = useMemo(() => {
        if (!sceneSearchOpen) return messages;
        const q = messageSearchQuery.trim().toLowerCase();
        if (!q) return messages;
        return searchResults;
    }, [messages, messageSearchQuery, sceneSearchOpen, searchResults]);

    useEffect(() => {
        if (!sceneId || !sceneSearchOpen) return;
        const q = messageSearchQuery.trim();
        if (!q) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }
        let cancelled = false;
        setSearchLoading(true);
        const timer = window.setTimeout(async () => {
            const results = await searchSceneMessages(sceneId, q, supabase);
            if (!cancelled) {
                setSearchResults(results.filter((item) => item.message.type !== 'system'));
                setSearchLoading(false);
            }
        }, 220);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [sceneId, sceneSearchOpen, messageSearchQuery, searchSceneMessages, supabase]);

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
        setSearchResults([]);
        setSearchLoading(false);
        setSceneSearchOpen(false);
        setSearchMatchIndex(0);
        setIsNearChatBottom(true);
        setTimelineBackgroundImage(null);
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

    const backgroundEvents = useMemo(() => {
        return allSceneMessages
            .map((item) => {
                const meta = (item.message.metadata ?? {}) as Record<string, unknown>;
                const backgroundSwitch = (meta.background_switch ?? null) as
                    | {
                          image_url?: string;
                          prev_image_url?: string;
                      }
                    | null;
                if (!backgroundSwitch?.image_url) return null;
                return {
                    messageId: item.message.id,
                    createdAt: item.message.created_at,
                    imageUrl: backgroundSwitch.image_url,
                    prevImageUrl: backgroundSwitch.prev_image_url ?? null,
                };
            })
            .filter(Boolean)
            .sort((a, b) => new Date(a!.createdAt).getTime() - new Date(b!.createdAt).getTime()) as Array<{
            messageId: string;
            createdAt: string;
            imageUrl: string;
            prevImageUrl: string | null;
        }>;
    }, [allSceneMessages]);

    const resolveTimelineBackgroundByTimestamp = useCallback(
        (referenceTime: string | null): string | null => {
            if (backgroundEvents.length === 0) return sceneBackgroundImage;
            if (!referenceTime) return sceneBackgroundImage;
            const refTs = new Date(referenceTime).getTime();
            let matched: string | null = null;
            for (const event of backgroundEvents) {
                if (new Date(event.createdAt).getTime() <= refTs) {
                    matched = event.imageUrl;
                } else {
                    break;
                }
            }
            if (matched) return matched;
            const firstEvent = backgroundEvents[0];
            return firstEvent?.prevImageUrl ?? sceneBaseBackgroundImage ?? sceneBackgroundImage;
        },
        [backgroundEvents, sceneBaseBackgroundImage, sceneBackgroundImage]
    );

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
        if (!sceneSearchOpen || !messageSearchQuery.trim() || !activeSearchMessageId) return;
        const activeItem = filteredMessages.find((item) => item.message.id === activeSearchMessageId) ?? null;
        const nextBg = resolveTimelineBackgroundByTimestamp(activeItem?.message.created_at ?? null);
        setTimelineBackgroundImage(nextBg);
    }, [
        sceneSearchOpen,
        messageSearchQuery,
        activeSearchMessageId,
        filteredMessages,
        resolveTimelineBackgroundByTimestamp,
    ]);

    const syncTimelineBackgroundFromViewport = useCallback(() => {
        if (sceneSearchOpen && messageSearchQuery.trim()) return;
        const container = messagesContainerRef.current;
        if (!container || filteredMessages.length === 0) {
            setTimelineBackgroundImage(sceneBackgroundImage);
            return;
        }
        if (isNearChatBottom) {
            const latestVisible = filteredMessages[filteredMessages.length - 1] ?? null;
            const nextBg = resolveTimelineBackgroundByTimestamp(latestVisible?.message.created_at ?? null);
            setTimelineBackgroundImage(nextBg);
            return;
        }
        const containerRect = container.getBoundingClientRect();
        let firstVisible: (typeof filteredMessages)[number] | null = null;
        for (const item of filteredMessages) {
            const node = document.getElementById(`scene-msg-${item.message.id}`);
            if (!node) continue;
            const rect = node.getBoundingClientRect();
            if (rect.bottom >= containerRect.top + 8) {
                firstVisible = item;
                break;
            }
        }
        const nextBg = resolveTimelineBackgroundByTimestamp(firstVisible?.message.created_at ?? null);
        setTimelineBackgroundImage(nextBg);
    }, [
        sceneSearchOpen,
        messageSearchQuery,
        filteredMessages,
        resolveTimelineBackgroundByTimestamp,
        sceneBackgroundImage,
        isNearChatBottom,
    ]);

    useEffect(() => {
        const id = window.requestAnimationFrame(() => {
            updateNearChatBottom();
            syncTimelineBackgroundFromViewport();
        });
        return () => cancelAnimationFrame(id);
    }, [
        messages.length,
        filteredMessages.length,
        chatFontScale,
        updateNearChatBottom,
        syncTimelineBackgroundFromViewport,
    ]);

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
        setTimelineBackgroundImage(sceneBackgroundImage);
    }, [sceneBackgroundImage]);

    const loadOlderMessages = useCallback(async () => {
        if (!sceneId || !hasMoreOlderMessages || loadingOlderMessages || !oldestMessageCursor) return;
        setLoadingOlderMessages(true);
        const result = await getSceneMessagesPage(sceneId, supabase, {
            limit: 200,
            before: oldestMessageCursor,
            appendOlder: true,
        });
        setHasMoreOlderMessages(result.hasMore);
        setOldestMessageCursor(result.oldestCursor);
        setLoadingOlderMessages(false);
    }, [
        sceneId,
        hasMoreOlderMessages,
        loadingOlderMessages,
        oldestMessageCursor,
        getSceneMessagesPage,
        supabase,
    ]);

    if (!spaceId || !sceneId) return null;

    const resolveCharacterFromMention = (raw: string, characters: RoleplaySpaceCharacterView[]) => {
        const mentionWithColonMatch = raw.match(/^\s*@([^:]+)\s*:\s*/);
        if (mentionWithColonMatch) {
            const mentionedName = mentionWithColonMatch[1].trim().toLowerCase();
            const character = characters.find((c) => c.character.name.toLowerCase() === mentionedName);
            const baseContent = raw.replace(/^\s*@([^:]+)\s*:\s*/, '');
            const emotionMatch = raw.match(/\[([^\]\n]{1,80})\]/);
            const content = baseContent.replace(/\[([^\]\n]{1,80})\]/, '').trim();
            return {
                characterId: character?.character.id ?? null,
                emotionName: emotionMatch?.[1]?.trim() ?? null,
                content,
            };
        }

        const mentionMatch = raw.match(/^\s*@([^\s:]+)\s*:?\s*/);
        if (!mentionMatch) {
            const emotionMatch = raw.match(/\[([^\]\n]{1,80})\]/);
            const contentWithoutEmotion = raw.replace(/\[([^\]\n]{1,80})\]/, '').trim();
            return {
                characterId: null as string | null,
                emotionName: emotionMatch?.[1]?.trim() ?? null,
                content: contentWithoutEmotion,
            };
        }

        const mentionedName = mentionMatch[1].toLowerCase();
        const character = characters.find((c) => c.character.name.toLowerCase() === mentionedName);
        const baseContent = raw.replace(/^\s*@([^\s:]+)\s*:?\s*/, '');
        const emotionMatch = raw.match(/\[([^\]\n]{1,80})\]/);
        const content = baseContent.replace(/\[([^\]\n]{1,80})\]/, '').trim();
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

    const extractBackgroundCommands = (
        raw: string
    ): { commands: string[]; contentWithoutCommands: string } => {
        const commands: string[] = [];
        const contentWithoutCommands = raw.replace(
            /(^|\s)\/([^/\n]{1,120})\/(?=\s|$)/g,
            (_full, lead: string, command: string) => {
                const normalized = command.trim();
                if (normalized) commands.push(normalized);
                return lead;
            }
        );
        return {
            commands,
            contentWithoutCommands: contentWithoutCommands.trim(),
        };
    };

    const normalizePresetToken = (value: string): string =>
        value
            .trim()
            .toLowerCase()
            .replace(/[_-]+/g, ' ')
            .replace(/\s+/g, ' ');

    return (
        <div className="mx-auto mt-0 flex h-[100dvh] max-w-[1440px] flex-col gap-2 overflow-hidden px-2 pb-0 md:px-4">
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
                        {searchLoading
                            ? 'Поиск по всей истории...'
                            : `Найдено: ${filteredMessages.length} по всей истории`}
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

                    <section className="mb-6 rounded-xl border border-[#2f3a34] bg-[#0d120f]/90 p-3">
                        <h3 className="mb-2 text-xs uppercase tracking-[0.14em] text-[#c7bc98]">
                            Затемнение фона
                        </h3>
                        <p className="mb-3 text-xs text-[#9fa68a]">
                            Настройка слоя поверх фонового изображения чата. Сохраняется для этой сцены на устройстве.
                            {!sceneBackgroundImage ? (
                                <span className="mt-1 block text-[#8a9278]">
                                    Сейчас фон не задан — ползунок сработает после добавления картинки в параметрах сцены ниже.
                                </span>
                            ) : null}
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={sceneBackgroundDimPercent}
                                onChange={(e) => persistSceneBackgroundDim(Number(e.target.value))}
                                className="min-w-0 flex-1 accent-[#c2a774]"
                                aria-label="Степень затемнения фона"
                            />
                            <span className="w-12 shrink-0 text-sm tabular-nums text-[#d8c693]">
                                {sceneBackgroundDimPercent}%
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
                                    background_preset_id: sceneForEdit.background_preset_id,
                                    status: sceneForEdit.status,
                                    settings: sceneForEdit.settings,
                                }}
                                backgroundPresets={sceneBackgroundPresets}
                                onCancel={() => setSceneSettingsOpen(false)}
                                onSubmit={async (values) => {
                                    const updated = await updateRoleplayScene(sceneForEdit.id, values, supabase);
                                    if (updated) {
                                        setSceneTitle(updated.title || 'Сцена');
                                        setSceneBackgroundImage(updated.background_image ?? null);
                                        setTimelineBackgroundImage(updated.background_image ?? null);
                                        setSceneBaseBackgroundImage(updated.background_image ?? null);
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
                            backgroundImage: `url(${timelineBackgroundImage ?? sceneBackgroundImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }
                        : undefined
                }
            >
                {sceneBackgroundImage ? (
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            backgroundColor: `rgba(${SCENE_BG_OVERLAY_RGB}, ${sceneBackgroundDimPercent / 100})`,
                        }}
                    />
                ) : null}
                <div
                    ref={messagesContainerRef}
                    onScroll={() => {
                        updateNearChatBottom();
                        syncTimelineBackgroundFromViewport();
                        const el = messagesContainerRef.current;
                        if (!el) return;
                        if (!sceneSearchOpen && el.scrollTop <= 48) {
                            void loadOlderMessages();
                        }
                    }}
                    className="relative z-[1] mb-1 flex min-h-0 flex-1 flex-col overflow-y-auto"
                    style={{
                        gap: `${8 * chatFontScale}px`,
                        paddingRight: `${4 * chatFontScale}px`,
                        paddingBottom: `${8 * chatFontScale}px`,
                    }}
                >
                    {!sceneSearchOpen && (loadingOlderMessages || hasMoreOlderMessages) ? (
                        <div className="p-2 text-center text-xs text-[#9fa68a]">
                            {loadingOlderMessages ? 'Загружаем более ранние сообщения...' : 'Прокрутите вверх для загрузки истории'}
                        </div>
                    ) : null}
                    {messages.length === 0 && (
                        <div className="p-3 text-center text-[#c7bc98]">
                            В этой сцене пока нет сообщений.
                        </div>
                    )}
                    {sceneSearchOpen && messageSearchQuery.trim() && !searchLoading && filteredMessages.length === 0 && (
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
                        draftStorageKey={sceneDraftStorageKey}
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
                            const { commands: backgroundCommands, contentWithoutCommands } = extractBackgroundCommands(content);
                            for (const backgroundCommand of backgroundCommands) {
                                const wanted = normalizePresetToken(backgroundCommand);
                                const matchedPreset = sceneBackgroundPresets.find((preset) => {
                                    const byName = normalizePresetToken(preset.name);
                                    const byKey = normalizePresetToken(preset.key);
                                    return wanted === byName || wanted === byKey;
                                });
                                if (!matchedPreset) {
                                    setSendError(`Пресет «${backgroundCommand}» не найден. Используйте name или key пресета.`);
                                    return;
                                }
                                const updated = await updateRoleplayScene(
                                    sceneId,
                                    {
                                        background_image: matchedPreset.image_url,
                                        background_preset_id: matchedPreset.id,
                                    },
                                    supabase
                                );
                                if (!updated) {
                                    const details = roleplayError || useRoleplayStore.getState().error;
                                    setSendError(details ? `Не удалось переключить фон сцены: ${details}` : 'Не удалось переключить фон сцены.');
                                    return;
                                }
                                const previousBackgroundImage = timelineBackgroundImage ?? sceneBackgroundImage;
                                setSceneBackgroundImage(updated.background_image ?? matchedPreset.image_url);
                                setTimelineBackgroundImage(updated.background_image ?? matchedPreset.image_url);
                                setSceneForEdit((prev) =>
                                    prev
                                        ? {
                                              ...prev,
                                              background_image: updated.background_image ?? matchedPreset.image_url,
                                              background_preset_id: matchedPreset.id,
                                          }
                                        : prev
                                );
                                await createSceneMessage(
                                    {
                                        scene_id: sceneId,
                                        user_id: uid,
                                        character_id: null,
                                        emotion_id: null,
                                        type: 'system',
                                        content: `/${matchedPreset.name}/`,
                                        reply_to_message_id: null,
                                        metadata: {
                                            background_switch: {
                                                preset_id: matchedPreset.id,
                                                preset_key: matchedPreset.key,
                                                preset_name: matchedPreset.name,
                                                image_url: matchedPreset.image_url,
                                                prev_image_url: previousBackgroundImage,
                                            },
                                        },
                                    },
                                    supabase
                                );
                                await createSceneMessage(
                                    {
                                        scene_id: sceneId,
                                        user_id: uid,
                                        character_id: null,
                                        emotion_id: null,
                                        type: 'narration',
                                        content: `\`Локация: ${matchedPreset.name}\``,
                                        reply_to_message_id: null,
                                        metadata: {
                                            location_marker: true,
                                            preset_id: matchedPreset.id,
                                            preset_key: matchedPreset.key,
                                            preset_name: matchedPreset.name,
                                        },
                                    },
                                    supabase
                                );
                            }
                            if (backgroundCommands.length > 0) {
                                await refreshMessages();
                            }
                            if (!contentWithoutCommands.trim()) {
                                return;
                            }
                            const parsed = resolveCharacterFromMention(contentWithoutCommands, spaceCharacters);
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
