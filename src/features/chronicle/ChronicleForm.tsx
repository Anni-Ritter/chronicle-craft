import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Chronicle } from '../../types/chronicle';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useChronicleStore } from '../../store/useChronicleStore';
import { RichTextEditor } from '../../components/RichTextEditor';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BookOpen } from 'lucide-react';
import { Button } from '../../components/ChronicleButton';
import { useWorldStore } from '../../store/useWorldStore';
import { WorldDatePicker } from '../../components/WorldDatePicker';
import { X, Plus } from 'lucide-react';

interface ChronicleFormProps {
    onFinish: () => void;
    supabase: SupabaseClient;
    initial?: Chronicle;
}

const moodEmojis: Record<string, string[]> = {
    'начало': ['🌱', '🛤️', '🧭'],
    'романтика': ['💞', '💍', '❤️'],
    'комедия': ['😹', '🎭', '🤭'],
    'драма': ['💔', '🌩️', '🎭'],
    'грусть': ['🖤', '🌧️', '🥀'],
    'магия': ['🔮', '🌘', '✨'],
    'опасность': ['⚔️', '🔥', '😨'],
    'доверие': ['💠', '🛡️', '🎗️'],
    'путь': ['🧭', '🗺️', '🌄'],
    'размышления': ['🪞', '📖', '🌙'],
};

function moodStartsWithEmoji(text: string): boolean {
    if (!text) return false;
    const match = text.trim().match(/^\p{Emoji_Presentation}+/u);
    return Boolean(match);
}

function pickEmojiFromMood(rawMood: string): string {
    if (!rawMood) return '📖 Неопределённое';

    if (moodStartsWithEmoji(rawMood)) return rawMood;

    const trimmed = rawMood.trim().toLowerCase();

    for (const [category, emojis] of Object.entries(moodEmojis)) {
        if (trimmed.includes(category)) {
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            return `${emoji} ${rawMood.trim()}`;
        }
    }

    return `📖 ${rawMood.trim()}`;
}

export const ChronicleForm = ({ onFinish, supabase, initial }: ChronicleFormProps) => {
    const { characters } = useCharacterStore();
    const { addChronicle, updateChronicle } = useChronicleStore();

    const [title, setTitle] = useState(initial?.title || '');
    const [content, setContent] = useState(initial?.content || '');
    const [tags, setTags] = useState<string[]>(initial?.tags || []);
    const [linkedCharacters, setLinkedCharacters] = useState<string[]>(initial?.linked_characters || []);
    const [linkedLocations, setLinkedLocations] = useState<string[]>(initial?.linked_locations || []);
    const [newLocation, setNewLocation] = useState('');
    const [newTag, setNewTag] = useState('');
    const [eventDate, setEventDate] = useState(
        initial?.event_date ? initial.event_date.slice(0, 10) : ''
    );
    const [mood, setMood] = useState(initial?.mood || '');
    const { worlds } = useWorldStore();
    const [selectedWorld, setSelectedWorld] = useState(initial?.world_id || '');
    const selectedWorldData = worlds.find((w) => w.id === selectedWorld);
    const calendar = selectedWorldData?.calendar;
    const [worldError, setWorldError] = useState(false);
    const [isWorldDropdownOpen, setIsWorldDropdownOpen] = useState(false);

    const handleSubmit = async () => {
        let finalMood = mood;

        if (!finalMood || finalMood === '📖 Неопределённое' || !moodStartsWithEmoji(finalMood)) {
            if (finalMood && !moodStartsWithEmoji(finalMood)) {
                finalMood = pickEmojiFromMood(finalMood);
            } else {
                try {
                    const { data, error } = await supabase.functions.invoke('detect-mood', {
                        body: { text: content },
                    });
                    if (!error && data?.mood) {
                        finalMood = data.mood;
                    }

                    if (Array.isArray(data?.tags)) {
                        const combinedTags = Array.from(new Set([...tags, ...data.tags]));
                        setTags(combinedTags);
                    }
                } catch (err) {
                    console.warn('Ошибка определения настроения:', err);
                }
            }
        }

        setWorldError(false);

        const finalTags = [...tags];
        const finalLocations = [...linkedLocations];

        const trimmedTag = newTag.trim();
        const trimmedLoc = newLocation.trim();

        if (trimmedTag && !finalTags.includes(trimmedTag)) {
            finalTags.push(trimmedTag);
        }
        if (trimmedLoc && !finalLocations.includes(trimmedLoc)) {
            finalLocations.push(trimmedLoc);
        }

        const entry: Chronicle = {
            id: initial?.id || uuidv4(),
            title,
            content,
            tags: finalTags,
            linked_characters: linkedCharacters,
            linked_locations: finalLocations,
            created_at: initial?.created_at || new Date().toISOString(),
            event_date: eventDate || '',
            mood: finalMood || undefined,
            world_id: selectedWorld || null,
        };

        const result = initial
            ? await updateChronicle(entry, supabase)
            : await addChronicle(entry, supabase);

        if (!result.error) {
            onFinish();
        } else {
            console.error(result.error.message);
        }
    };

    const inputBase =
        'w-full px-4 py-2.5 rounded-xl bg-[#0b1510] text-[#f5e9c6] border border-[#3a4a34] ' +
        'placeholder:text-[#f5e9c6]/45 text-[14px] focus:border-[#c2a774aa] ' +
        'focus:outline-none focus:ring-2 focus:ring-[#c2a77433]';

    const pillBase =
        'px-3 py-1 rounded-full border text-xs md:text-sm transition flex items-center gap-2';

    return (
        <form className="relative w-full max-w-3xl mx-auto no-scrollbar text-[#e5d9a5] rounded-2xl space-y-8">
            <div className="pointer-events-none absolute -top-24 -right-10 w-40 h-40 rounded-full bg-[#c2a77433] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 w-52 h-52 rounded-full bg-[#4ade8030] blur-3xl" />

            <header className="relative z-10 text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-[#3a4a34] bg-[#151f16]/80 text-[11px] tracking-[0.18em] uppercase text-[#c7bc98]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c2a774]" />
                    <span>{initial ? 'Редактирование хроники' : 'Новая запись хроники'}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-garamond font-bold flex items-center justify-center gap-2">
                    <BookOpen className="text-[#c2a774]" />
                    Хроника
                </h2>
            </header>

            <section className="relative z-10 grid gap-4 md:grid-cols-[2fr,1.3fr] bg-[#151f16]/90 rounded-2xl border border-[#3a4a34] p-4 md:p-5 shadow-sm">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[#e5d9a5]">Название хроники</label>
                    <input
                        type="text"
                        className={inputBase}
                        placeholder="Например: Ночь перед экзаменом по некромантии"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[#c7bc98]">Мир</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() =>
                                    setIsWorldDropdownOpen((prev) => !prev)
                                }
                                className="w-full text-left px-4 py-2.5 rounded-xl bg-[#0b1510] border border-[#3a4a34] text-[13px] flex items-center justify-between hover:border-[#c2a774aa] transition"
                            >
                                <span>
                                    {selectedWorld
                                        ? worlds.find((w) => w.id === selectedWorld)?.name
                                        : '— Мир не выбран —'}
                                </span>
                                <span className="ml-2 text-[#c2a774] text-xs">▼</span>
                            </button>

                            {isWorldDropdownOpen && (
                                <ul className="absolute left-0 mt-2 min-w-full bg-[#0b1510] border border-[#3a4a34] rounded-xl shadow-lg text-[#f5e9c6] z-30 overflow-hidden text-sm">
                                    <li
                                        className="px-4 py-2 hover:bg-[#3a4c3a] cursor-pointer"
                                        onClick={() => {
                                            setSelectedWorld('');
                                            setIsWorldDropdownOpen(false);
                                        }}
                                    >
                                        — Мир не выбран —
                                    </li>
                                    {worlds.map((world) => (
                                        <li
                                            key={world.id}
                                            onClick={() => {
                                                setSelectedWorld(world.id);
                                                setIsWorldDropdownOpen(false);
                                            }}
                                            className={`px-4 py-2 cursor-pointer hover:bg-[#3a4c3a] ${selectedWorld === world.id
                                                ? 'bg-[#3a4c3a]'
                                                : ''
                                                }`}
                                        >
                                            {world.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {worldError && (
                            <p className="text-xs text-[#ff9b9b] mt-1">
                                Пожалуйста, выберите мир.
                            </p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[#c7bc98]">
                            Дата события
                        </label>
                        {calendar ? (
                            <WorldDatePicker
                                calendar={calendar}
                                initialDate={eventDate}
                                onChange={(value) => setEventDate(value)}
                            />
                        ) : (
                            <input
                                type="date"
                                className={`${inputBase} text-[13px] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                            />
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[#c7bc98]">
                            Настроение (опционально)
                        </label>
                        <input
                            type="text"
                            value={mood}
                            onChange={(e) => setMood(e.target.value)}
                            placeholder="Например: магия, тревога, надежда…"
                            className={inputBase}
                        />
                    </div>
                </div>
            </section>

            <section className="relative z-10 bg-[#151f16]/90 rounded-2xl border border-[#3a4a34] p-4 md:p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[#e5d9a5]">
                        Текст хроники
                    </label>
                    <span className="text-[11px] text-[#c7bc98]">
                        Можно писать как сцену, дневниковую запись или заметку
                    </span>
                </div>
                <RichTextEditor content={content} onChange={setContent} />
            </section>

            <section className="relative z-10 bg-[#151f16]/90 rounded-2xl border border-[#3a4a34] p-4 md:p-5 shadow-sm space-y-3">
                <h3 className="text-sm font-semibold text-[#e5d9a5]">
                    Привязанные персонажи
                </h3>
                <p className="text-[12px] text-[#c7bc98]">
                    Отметьте, кто участвует в событии — это поможет потом фильтровать
                    и строить связи.
                </p>

                <div className="flex flex-wrap gap-2">
                    {characters.map((char) => {
                        const selected = linkedCharacters.includes(char.id);
                        return (
                            <button
                                key={char.id}
                                type="button"
                                onClick={() =>
                                    setLinkedCharacters((prev) =>
                                        selected
                                            ? prev.filter((id) => id !== char.id)
                                            : [...prev, char.id]
                                    )
                                }
                                className={`${pillBase} ${selected
                                    ? 'bg-gradient-to-r from-[#c2a774] to-[#e5d9a5] text-[#223120] border-transparent shadow-[0_0_10px_#c2a77455]'
                                    : 'bg-[#0b1510] text-[#e5d9a5] border-[#3a4a34] hover:bg-[#1c261b]'
                                    }`}
                            >
                                {char.name}
                            </button>
                        );
                    })}
                    {characters.length === 0 && (
                        <span className="text-xs text-[#c7bc98]">
                            У вас пока нет персонажей — их можно добавить на вкладке
                            «Персонажи».
                        </span>
                    )}
                </div>
            </section>

            <section className="relative z-10 bg-[#151f16]/90 rounded-2xl border border-[#3a4a34] p-4 md:p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-[#e5d9a5]">Локации</h3>

                {linkedLocations.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {linkedLocations.map((loc, index) => (
                            <span
                                key={index}
                                className="bg-[#c2a774] text-[#223120] px-3 py-1 rounded-full text-xs md:text-sm flex items-center gap-1 shadow-sm"
                            >
                                {loc}
                                <button
                                    type="button"
                                    className="ml-1 text-[#6b1f1f] hover:text-[#8f2626]"
                                    onClick={() =>
                                        setLinkedLocations(
                                            linkedLocations.filter((_, i) => i !== index)
                                        )
                                    }
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="Добавьте локацию (академия, таверна, город...)"
                        className={`${inputBase} flex-1`}
                    />
                    <Button
                        type="button"
                        onClick={() => {
                            const trimmed = newLocation.trim();
                            if (trimmed && !linkedLocations.includes(trimmed)) {
                                setLinkedLocations([...linkedLocations, trimmed]);
                                setNewLocation('');
                            }
                        }}
                        icon={<Plus size={16} />}
                        className="shrink-0"
                    />
                </div>
            </section>

            <section className="relative z-10 bg-[#151f16]/90 rounded-2xl border border-[#3a4a34] p-4 md:p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-[#e5d9a5]">Теги</h3>
                <p className="text-[12px] text-[#c7bc98]">
                    Ключевые слова помогут находить нужные сцены: «экзамен», «боевой дуэль»,
                    «семья», «лето», «флэшбек» и т.п.
                </p>

                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                            <span
                                key={index}
                                className="bg-[#c2a774] text-[#223120] px-3 py-1 rounded-full text-xs md:text-sm flex items-center gap-1 shadow-sm"
                            >
                                {tag}
                                <button
                                    type="button"
                                    className="ml-1 text-[#6b1f1f] hover:text-[#8f2626]"
                                    onClick={() =>
                                        setTags(tags.filter((_, i) => i !== index))
                                    }
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Добавьте тег (например, дуэль, заговор, флэшбек)"
                        className={`${inputBase} flex-1`}
                    />
                    <Button
                        type="button"
                        onClick={() => {
                            const trimmed = newTag.trim();
                            if (trimmed && !tags.includes(trimmed)) {
                                setTags([...tags, trimmed]);
                                setNewTag('');
                            }
                        }}
                        icon={<Plus size={16} />}
                        className="shrink-0"
                    />
                </div>
            </section>

            <div className="relative z-10 flex justify-end pt-2">
                <Button onClick={handleSubmit} className="font-semibold min-w-[210px]">
                    {initial ? 'Сохранить изменения' : 'Добавить хронику'}
                </Button>
            </div>
        </form>
    );
};
