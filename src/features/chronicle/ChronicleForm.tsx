import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Chronicle } from '../../types/chronicle';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useChronicleStore } from '../../store/useChronicleStore';
import { RichTextEditor } from '../../components/RichTextEditor';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BookOpen, Plus, X } from 'lucide-react';
import { Button } from '../../components/ChronicleButton';
import { useWorldStore } from '../../store/useWorldStore';
import { WorldDatePicker } from '../../components/WorldDatePicker';

interface ChronicleFormProps {
    onFinish: () => void;
    supabase: SupabaseClient;
    initial?: Chronicle;
}

const moodEmojis: Record<string, string[]> = {
    "начало": ["🌱", "🛤️", "🧭"],
    "романтика": ["💞", "💍", "❤️"],
    "комедия": ["😹", "🎭", "🤭"],
    "драма": ["💔", "🌩️", "🎭"],
    "грусть": ["🖤", "🌧️", "🥀"],
    "магия": ["🔮", "🌘", "✨"],
    "опасность": ["⚔️", "🔥", "😨"],
    "доверие": ["💠", "🛡️", "🎗️"],
    "путь": ["🧭", "🗺️", "🌄"],
    "размышления": ["🪞", "📖", "🌙"],
};

function moodStartsWithEmoji(text: string): boolean {
    if (!text) return false;
    const match = text.trim().match(/^\p{Emoji_Presentation}+/u);
    return Boolean(match);
}

function pickEmojiFromMood(rawMood: string): string {
    if (!rawMood) return "📖 Неопределённое";

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
            event_date: eventDate || "",
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



    return (
        <form className="bg-[#0e1b12] h-[90vh] overflow-auto scroll-touch no-scrollbar border border-[#c2a774] text-[#e5d9a5] font-lora rounded-3xl shadow-lg max-w-full md:max-w-3xl md:mx-auto space-y-10 px-3 md:px-6 py-10">
            <h2 className="text-2xl text-center tracking-wide flex items-center justify-center gap-2"><BookOpen /> Хроника</h2>
            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] mt-6 shadow-md gap-6">
                <label className="mb-2 font-lora">Название</label>
                <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg bg-[#0e1b12] mt-2 text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
                    placeholder="Введите название"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </section>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] mt-6 shadow-md">
                <label className="block mb-2 font-lora">Выберите мир:</label>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsWorldDropdownOpen((prev) => !prev)}
                        className="w-full px-4 py-2 bg-[#0e1b12] border border-[#c2a774] text-[#f5e9c6] rounded-xl flex justify-between items-center"
                    >
                        {selectedWorld
                            ? worlds.find((w) => w.id === selectedWorld)?.name
                            : '— Мир не выбран —'}
                        <span className="ml-2 text-[#c2a774]">▼</span>
                    </button>

                    {isWorldDropdownOpen && (
                        <ul className="absolute left-0 mt-2 min-w-full bg-[#0e1b12] border border-[#c2a774] rounded-xl shadow-lg text-[#f5e9c6] z-30 overflow-hidden">
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
                                    className={`px-4 py-2 cursor-pointer hover:bg-[#3a4c3a] ${selectedWorld === world.id ? 'bg-[#3a4c3a]' : ''
                                        }`}
                                >
                                    {world.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {worldError && (
                    <p className="text-sm text-red-500 mt-2">Пожалуйста, выберите мир.</p>
                )}
            </section>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] mt-6 shadow-md">
                <label className="block mb-2 font-medium">Контент:</label>
                <RichTextEditor content={content} onChange={setContent} />
            </section>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] mt-6 shadow-md">
                <label className="block mb-2 font-semibold text-[#e5d9a5]">Привязанные персонажи:</label>
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
                                className={`px-3 py-1 rounded-xl border text-sm transition 
                                ${selected
                                        ? 'bg-[#c2a774] text-[#0e1b12] border-[#c2a774]'
                                        : 'bg-[#0e1b12] text-[#e5d9a5] border-[#c2a774] hover:bg-[#3c4d39]'}`}
                            >
                                {char.name}
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] mt-6 shadow-md">
                <label className="block mb-2 font-semibold text-[#e5d9a5]">Локации:</label>
                {linkedLocations.length > 0 &&
                    <div className="flex flex-wrap gap-2 mb-4">
                        {linkedLocations.map((loc, index) => (
                            <span
                                key={index}
                                className="bg-[#C2A774] text-[#0E1B12] px-3 py-1 rounded-xl text-sm flex items-center gap-2"
                            >
                                {loc}
                                <button
                                    type="button"
                                    className="text-red-700 hover:text-red-900"
                                    onClick={() =>
                                        setLinkedLocations(linkedLocations.filter((_, i) => i !== index))
                                    }
                                >
                                    <X size={16} />
                                </button>
                            </span>
                        ))}
                    </div>}

                <div className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="Введите локацию"
                        className="flex-1 w-full mt-1 px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
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
                        icon={<Plus />}
                    >
                    </Button>
                </div>
            </section>



            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] mt-6 shadow-md">
                <h3 className="block text-[#e5d9a5] text-lg mb-2 font-lora">Теги:</h3>

                {tags.length > 0 &&
                    <div className="flex flex-wrap gap-2 mb-4">
                        {tags.map((tag, index) => (
                            <span
                                key={index}
                                className="bg-[#C2A774] text-[#0E1B12] px-3 py-1 rounded-xl text-sm flex items-center gap-2"
                            >
                                {tag}
                                <button
                                    type="button"
                                    className="text-red-700 hover:text-red-900"
                                    onClick={() => setTags(tags.filter((_, i) => i !== index))}
                                >
                                    <X size={16} />
                                </button>
                            </span>
                        ))}
                    </div>}

                <div className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Введите тег"
                        className="flex-1 w-full mt-1 px-4 py-2 rounded-xl bg-[#0e1b12] text-[#f5e9c6] border border-[#c2a774] placeholder:text-[#f5e9c6]/50"
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
                        icon={<Plus />}
                    />
                </div>
            </section>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] mt-6 shadow-md">
                <label className="block mb-2 font-medium">Дата события:</label>
                {calendar ? (
                    <WorldDatePicker
                        calendar={calendar}
                        initialDate={eventDate}
                        onChange={(value) => setEventDate(value)}
                    />
                ) : (
                    <input
                        type="date"
                        className="w-full px-3 py-2 bg-[#0e1b12] border border-[#c2a774] text-[#e5d9a5] rounded-xl
                    [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                    />
                )}
            </section>

            <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] mt-6 shadow-md">
                <label className="block mb-2 font-medium">Настроение (опционально):</label>
                <input
                    type="text"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    placeholder="Введите настроение"
                    className="w-full px-3 py-2 bg-[#0e1b12] border border-[#c2a774] rounded-xl placeholder:text-[#f5e9c6]/50"
                />
            </section>

            <div className="flex justify-end">
                <Button
                    onClick={handleSubmit}
                    className="font-semibold"
                >
                    {initial ? 'Сохранить изменения' : 'Добавить хронику'}
                </Button>
            </div>
        </form>
    );
};
