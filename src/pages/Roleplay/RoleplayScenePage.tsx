import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { ArrowLeft } from 'lucide-react';
import { useRoleplayStore } from '../../store/useRoleplayStore';
import { useSceneMessagesRealtime } from '../../hooks/useSceneMessagesRealtime';
import { SceneMessageItem } from '../../features/roleplay/SceneMessageItem';
import { SceneComposer } from '../../features/roleplay/SceneComposer';
import type { RoleplayMessageType, RoleplaySpaceCharacterView } from '../../types/roleplay';

export const RoleplayScenePage = () => {
    const { spaceId, sceneId } = useParams<{ spaceId: string; sceneId: string }>();
    const navigate = useNavigate();
    const session = useSession();
    const supabase = useSupabaseClient();
    const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
    const [sceneBackgroundImage, setSceneBackgroundImage] = useState<string | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const didInitialScrollRef = useRef(false);

    const {
        spaceCharactersBySpace,
        sceneMessagesByScene,
        getRoleplaySpaceCharacters,
        getSceneMessages,
        createSceneMessage,
        updateSceneMessage,
        deleteSceneMessage,
    } = useRoleplayStore();

    const refreshMessages = useCallback(() => {
        if (!sceneId) return;
        getSceneMessages(sceneId, supabase);
    }, [sceneId, supabase, getSceneMessages]);

    useEffect(() => {
        if (!spaceId || !sceneId) return;
        getRoleplaySpaceCharacters(spaceId, supabase);
        getSceneMessages(sceneId, supabase);
    }, [spaceId, sceneId, supabase, getRoleplaySpaceCharacters, getSceneMessages]);

    useEffect(() => {
        if (!sceneId) return;
        supabase
            .from('roleplay_scenes')
            .select('background_image')
            .eq('id', sceneId)
            .maybeSingle()
            .then(({ data }) => {
                setSceneBackgroundImage(data?.background_image ?? null);
            });
    }, [sceneId, supabase]);

    useSceneMessagesRealtime(sceneId ?? null, refreshMessages);

    const spaceCharacters = useMemo(
        () => (spaceId ? spaceCharactersBySpace[spaceId] ?? [] : []),
        [spaceId, spaceCharactersBySpace]
    );
    const messages = useMemo(
        () => (sceneId ? sceneMessagesByScene[sceneId] ?? [] : []),
        [sceneId, sceneMessagesByScene]
    );

    useEffect(() => {
        didInitialScrollRef.current = false;
    }, [sceneId]);

    useEffect(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        const scrollToBottom = () => {
            el.scrollTop = el.scrollHeight;
        };

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
    }, [messages, sceneId]);

    if (!spaceId || !sceneId) return null;

    const resolveCharacterFromMention = (raw: string, characters: RoleplaySpaceCharacterView[]) => {
        const mentionWithColonMatch = raw.match(/^\s*@([^:]+)\s*:\s*/);
        if (mentionWithColonMatch) {
            const mentionedName = mentionWithColonMatch[1].trim().toLowerCase();
            const character = characters.find((c) => c.character.name.toLowerCase() === mentionedName);
            const content = raw.replace(/^\s*@([^:]+)\s*:\s*/, '').trim();
            return {
                characterId: character?.character.id ?? null,
                content,
            };
        }

        const mentionMatch = raw.match(/^\s*@([^\s:]+)\s*:?\s*/);
        if (!mentionMatch) return { characterId: null as string | null, content: raw.trim() };

        const mentionedName = mentionMatch[1].toLowerCase();
        const character = characters.find((c) => c.character.name.toLowerCase() === mentionedName);
        const content = raw.replace(/^\s*@([^\s:]+)\s*:?\s*/, '').trim();
        return {
            characterId: character?.character.id ?? null,
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
        <div className="mx-auto mt-0 flex h-[100dvh] max-w-[1440px] flex-col gap-2 overflow-hidden px-2 pb-0 md:px-4">
            <header className="px-1 pt-2">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(`/roleplay/${spaceId}`)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#2f3a34] bg-[#101712] text-[#c7bc98] transition hover:border-[#c2a77466] hover:text-[#f4ecd0]"
                        aria-label="Назад"
                        title="Назад"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <h1 className="text-2xl md:text-3xl font-garamond text-[#f4ecd0]">Сцена ролевой</h1>
                </div>
            </header>

            <section
                className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#2f3a34] bg-[#0d120f]/85 p-2 md:p-2.5"
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
                {sceneBackgroundImage && <div className="pointer-events-none absolute inset-0 bg-[#060a08]/72" />}
                <div ref={messagesContainerRef} className="relative z-[1] mb-1 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 pb-2">
                    {messages.length === 0 && (
                        <div className="p-3 text-center text-[#c7bc98]">
                            В этой сцене пока нет сообщений.
                        </div>
                    )}
                    {messages.map((item) => (
                        <SceneMessageItem
                            key={item.message.id}
                            item={item}
                            onReply={setReplyToMessageId}
                            isOwn={item.message.user_id === session?.user?.id}
                            canManage={item.message.user_id === session?.user?.id}
                            onEdit={async (messageId, nextContent) => {
                                await updateSceneMessage(
                                    messageId,
                                    {
                                        content: nextContent,
                                        edited: true,
                                        metadata: {},
                                    },
                                    supabase
                                );
                                await refreshMessages();
                            }}
                            onDelete={async (messageId) => {
                                await deleteSceneMessage(messageId, supabase);
                                await refreshMessages();
                            }}
                        />
                    ))}
                </div>

                <div className="sticky bottom-0 z-[2] mt-auto border-t border-[#2f3a34]/80 bg-[#0a0f0c]/92 pt-1.5 backdrop-blur-[2px]">
                    <SceneComposer
                        availableCharacters={spaceCharacters}
                        replyToMessageId={replyToMessageId}
                        onClearReply={() => setReplyToMessageId(null)}
                        onSend={async ({ content, reply_to_message_id }) => {
                            const uid = session?.user?.id;
                            if (!uid || !sceneId) return;
                            const parsed = resolveCharacterFromMention(content, spaceCharacters);
                            const messageType = detectMessageType(parsed.content, !!parsed.characterId);
                            await createSceneMessage(
                                {
                                    scene_id: sceneId,
                                    user_id: uid,
                                    character_id: parsed.characterId,
                                    emotion_id: null,
                                    type: messageType,
                                    content: parsed.content,
                                    reply_to_message_id,
                                    metadata: {},
                                },
                                supabase
                            );
                            await refreshMessages();
                        }}
                    />
                </div>
            </section>
        </div>
    );
};
