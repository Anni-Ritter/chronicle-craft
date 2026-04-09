import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleHelp, Send } from 'lucide-react';
import { Button } from '../../components/ChronicleButton';
import { Modal } from '../../components/Modal';
import type { RoleplaySpaceCharacterView } from '../../types/roleplay';

interface SceneComposerProps {
    availableCharacters: RoleplaySpaceCharacterView[];
    onSend: (payload: {
        content: string;
        reply_to_message_id: string | null;
    }) => Promise<void>;
    replyToMessageId: string | null;
    onClearReply: () => void;
    editMessageId: string | null;
    editInitialContent: string;
    onCancelEdit: () => void;
    onSaveEdit: (messageId: string, content: string) => Promise<void>;
    /** Масштаб шрифта в поле ввода (как в сообщениях) */
    fontScale?: number;
}

export const SceneComposer = ({
    availableCharacters,
    onSend,
    replyToMessageId,
    onClearReply,
    editMessageId,
    editInitialContent,
    onCancelEdit,
    onSaveEdit,
    fontScale = 1,
}: SceneComposerProps) => {
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const [cursorPos, setCursorPos] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const canSubmit = content.trim().length > 0;
    const isEditMode = !!editMessageId;
    const s = fontScale;

    useEffect(() => {
        if (editMessageId) {
            setContent(editInitialContent);
            requestAnimationFrame(() => {
                textareaRef.current?.focus();
            });
        }
    }, [editMessageId, editInitialContent]);

    const mentionState = useMemo(() => {
        const textarea = textareaRef.current;
        const cursor = textarea?.selectionStart ?? cursorPos;
        const beforeCursor = content.slice(0, cursor);
        const mentionMatch = /(^|\s)@([^\n@:]{0,40})$/.exec(beforeCursor);
        if (!mentionMatch) return null;

        const prefixLen = mentionMatch[1].length;
        const mentionStart = (mentionMatch.index ?? 0) + prefixLen;
        const query = mentionMatch[2].toLowerCase().trim();
        const suggestions = availableCharacters
            .filter((character) => {
                if (!query) return true;
                return character.character.name.toLowerCase().includes(query);
            })
            .slice(0, 8);

        return { mentionStart, cursor, suggestions };
    }, [content, availableCharacters, cursorPos]);

    useEffect(() => {
        const total = mentionState?.suggestions.length ?? 0;
        if (total === 0) {
            setActiveSuggestionIndex(0);
            return;
        }
        if (activeSuggestionIndex >= total) {
            setActiveSuggestionIndex(0);
        }
    }, [mentionState, activeSuggestionIndex]);

    const applySuggestion = (name: string) => {
        if (!mentionState) return;
        const nextValue =
            content.slice(0, mentionState.mentionStart) +
            `@${name}: ` +
            content.slice(mentionState.cursor);
        setContent(nextValue);
        setActiveSuggestionIndex(0);

        const nextCursor = mentionState.mentionStart + name.length + 3;
        requestAnimationFrame(() => {
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(nextCursor, nextCursor);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setIsSending(true);
        if (editMessageId) {
            await onSaveEdit(editMessageId, content.trim());
        } else {
            await onSend({
                content: content.trim(),
                reply_to_message_id: replyToMessageId,
            });
        }
        setContent('');
        setIsSending(false);
        if (replyToMessageId) onClearReply();
        if (editMessageId) onCancelEdit();
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="relative rounded-xl bg-[#0a0f0c]/70"
            style={{ padding: `${10 * s}px` }}
        >
            <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className={`absolute right-14 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full text-[#c7bc98] transition hover:bg-white/5 hover:text-[#f4ecd0] ${
                    replyToMessageId || isEditMode ? 'top-10' : 'top-3'
                }`}
                aria-label="Подсказка по формату"
                title="Подсказка по формату"
            >
                <CircleHelp size={20} />
            </button>
            {replyToMessageId && (
                <div
                    className="flex items-center justify-between border-[#555] text-[#c7bc98]"
                    style={{
                        marginBottom: `${8 * s}px`,
                        paddingLeft: `${12 * s}px`,
                        borderLeftWidth: `${Math.max(1, Math.round(2 * s))}px`,
                        borderLeftStyle: 'solid',
                        fontSize: `${12 * s}px`,
                    }}
                >
                    <span>Ответ на сообщение</span>
                    <button type="button" onClick={onClearReply} className="text-[#f1e7c6]">
                        Очистить
                    </button>
                </div>
            )}
            {isEditMode && (
                <div
                    className="flex items-center justify-between border-[#c2a774] text-[#e5d9a5]"
                    style={{
                        marginBottom: `${8 * s}px`,
                        paddingLeft: `${12 * s}px`,
                        borderLeftWidth: `${Math.max(1, Math.round(2 * s))}px`,
                        borderLeftStyle: 'solid',
                        fontSize: `${12 * s}px`,
                    }}
                >
                    <span>Редактирование сообщения</span>
                    <button type="button" onClick={onCancelEdit} className="text-[#f1e7c6]">
                        Отмена
                    </button>
                </div>
            )}
            <div className="relative flex items-end" style={{ marginTop: `${4 * s}px`, gap: `${8 * s}px` }}>
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => {
                        setContent(e.target.value);
                        setCursorPos(e.target.selectionStart ?? e.target.value.length);
                    }}
                    onClick={(e) => setCursorPos(e.currentTarget.selectionStart ?? 0)}
                    onSelect={(e) => setCursorPos(e.currentTarget.selectionStart ?? 0)}
                    onKeyDown={(e) => {
                        const suggestions = mentionState?.suggestions ?? [];
                        if (suggestions.length === 0) return;

                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
                            return;
                        }
                        if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setActiveSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
                            return;
                        }
                        if (e.key === 'Enter' || e.key === 'Tab') {
                            e.preventDefault();
                            const selected = suggestions[activeSuggestionIndex] ?? suggestions[0];
                            if (selected) applySuggestion(selected.character.name);
                            return;
                        }
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            setActiveSuggestionIndex(0);
                        }
                    }}
                    rows={3}
                    className="w-full rounded-lg bg-[#0e1410] text-[#e5d9a5] outline-none ring-1 ring-[#2f3a34] focus:ring-[#c2a774]"
                    style={{
                        fontSize: `${14 * fontScale}px`,
                        paddingLeft: `${12 * s}px`,
                        paddingRight: `${Math.round(48 * s)}px`,
                        paddingTop: `${8 * s}px`,
                        paddingBottom: `${8 * s}px`,
                        borderRadius: `${Math.min(14, Math.max(8, Math.round(8 * s)))}px`,
                    }}
                />
                <Button
                    type="submit"
                    className="h-10 w-10 !min-w-10 !px-0 !gap-0 md:w-auto md:!px-3 md:!gap-2"
                    icon={<Send size={16} />}
                >
                    <span className="hidden md:inline">
                        {isEditMode ? (isSending ? 'Сохранение...' : 'Сохранить') : isSending ? 'Отправка...' : 'Отправить'}
                    </span>
                </Button>
                {(mentionState?.suggestions.length ?? 0) > 0 && (
                <div
                    className="absolute bottom-full left-0 right-0 z-20 rounded-lg border border-[#2f3a34] bg-[#0d130f] shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
                    style={{ marginBottom: `${8 * s}px`, padding: `${4 * s}px` }}
                >
                    <p className="text-[#9fa68a]" style={{ padding: `${4 * s}px ${8 * s}px`, fontSize: `${11 * s}px` }}>
                        Подсказки персонажей
                    </p>
                    <div className="max-h-40 overflow-y-auto">
                        {mentionState!.suggestions.map((item, index) => (
                            <button
                                key={item.character.id}
                                type="button"
                                onClick={() => applySuggestion(item.character.name)}
                                className={`flex w-full items-center justify-between rounded-lg text-left transition ${
                                    index === activeSuggestionIndex
                                        ? 'bg-[#2a3a2e] text-[#f4ecd0]'
                                        : 'text-[#d3c89f] hover:bg-[#1a241d]'
                                }`}
                                style={{ padding: `${6 * s}px ${8 * s}px`, fontSize: `${14 * s}px` }}
                            >
                                <span>{item.character.name}</span>
                                {item.owner?.username && (
                                    <span className="text-[#9fa68a]" style={{ fontSize: `${12 * s}px` }}>
                                        @{item.owner.username}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
                )}
            </div>
            <Modal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)}>
                <div className="space-y-4">
                    <h3 className="text-2xl font-garamond text-[#e5d9a5]">Подсказка по формату</h3>
                    <div className="space-y-2 text-sm text-[#c7bc98]">
                        <p>
                            <span className="text-[#e5d9a5]">@Имя:</span> в начале сообщения — писать от лица персонажа; в
                            том же сообщении можно снова написать <span className="text-[#e5d9a5]">@Другой:</span> —
                            реплика покажется отдельным блоком с подписью.
                        </p>
                        <p>
                            <span className="text-[#e5d9a5]">-</span> в начале фрагмента — речь.
                        </p>
                        <p>
                            <span className="text-[#e5d9a5]">*действие*</span> — действие (отдельная капсула по центру
                            чата).
                        </p>
                        <p>
                            <span className="text-[#e5d9a5]">`описание`</span> — описание/ремарка курсивом в пузыре.
                        </p>
                    </div>
                    <div className="rounded-lg bg-[#111712] p-3 text-sm text-[#e5d9a5]">
                        <p className="mb-1 text-xs text-[#9fa68a]">Примеры</p>
                        <p>@Лиа: - Я пришла вовремя.</p>
                        <p>@Лиа: *садится у окна*</p>
                        <p>@Лиа: `Вечерний туман стелется по мостовой`</p>
                        <p>@Лиа: - Я пришла. *улыбается* `Ветер усиливается`</p>
                    </div>
                    <div className="flex justify-end">
                        <Button variant="outline" onClick={() => setIsHelpOpen(false)}>
                            Понятно
                        </Button>
                    </div>
                </div>
            </Modal>
        </form>
    );
};
