import { useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useChronicleStore } from '../../store/useChronicleStore';
import { useCharacterStore } from '../../store/useCharacterStore';
import { Link } from 'react-router-dom';
import parse from 'html-react-parser';
import { Select } from '../../components/Select';
import { normalizeText } from '../../lib/NormalizeText';
import { useWorldSelectionStore } from '../../store/useWorldSelectionStore';
import { useWorldStore } from '../../store/useWorldStore';
import { formatWorldDate } from '../../lib/formatWorldDate';
import type { Chronicle } from '../../types/chronicle';
import { BookOpen, Sparkles } from 'lucide-react';

interface ChronicleViewSwitcherProps {
    searchTerm?: string;
}

export const ChronicleViewSwitcher = ({ searchTerm }: ChronicleViewSwitcherProps) => {
    const supabase = useSupabaseClient();
    const { fetchChronicles, chronicles } = useChronicleStore();
    const { characters, fetchCharacters } = useCharacterStore();
    const session = useSession();

    const [filterCharacter, setFilterCharacter] = useState<string | null>(null);
    const [filterTag, setFilterTag] = useState<string | null>(null);

    const { worlds, fetchWorlds } = useWorldStore();
    const { selectedWorldId, setSelectedWorldId } = useWorldSelectionStore();

    const selectedWorld = worlds.find((w) => w.id === selectedWorldId);
    const worldCalendar = selectedWorld?.calendar ?? null;

    const sortChronicles = (a: Chronicle, b: Chronicle) => {
        if (worldCalendar && a.event_date && b.event_date) {
            return parseInt(a.event_date) - parseInt(b.event_date);
        } else {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
    };

    useEffect(() => {
        if (session?.user?.id) {
            fetchWorlds(session.user.id, supabase);
        }
    }, [session]);

    useEffect(() => {
        if (!session?.user?.id) return;

        if (selectedWorldId) {
            fetchChronicles(supabase, selectedWorldId);
            fetchCharacters(session.user.id, supabase, selectedWorldId);
        } else {
            supabase
                .from('chronicles')
                .select('*')
                .then(({ data, error }) => {
                    if (!error && data) {
                        useChronicleStore.setState({ chronicles: data });
                    }
                });

            fetchCharacters(session.user.id, supabase);
        }
    }, [session, selectedWorldId]);

    const normalizedSearch = normalizeText(searchTerm ?? '');

    const filteredChronicles = chronicles.filter((chronicle) => {
        const matchCharacter = filterCharacter
            ? chronicle.linked_characters.includes(filterCharacter)
            : true;
        const matchTag = filterTag ? chronicle.tags.includes(filterTag) : true;

        const matchSearch = normalizedSearch
            ? normalizeText(chronicle.title ?? '').includes(normalizedSearch) ||
            normalizeText(chronicle.content ?? '').includes(normalizedSearch)
            : true;

        return matchCharacter && matchTag && matchSearch;
    });

    const getCharacterName = (id: string) =>
        characters.find((c) => c.id === id)?.name || '???';

    const allTags = Array.from(new Set(chronicles.flatMap((c) => c.tags)));

    return (
        <div className="space-y-8">
            <section className="bg-[#151f16]/90 border border-[#3a4a34] rounded-2xl px-4 py-4 md:px-6 md:py-5 shadow-[0_0_18px_#000]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#3a4a34] bg-[#101712]/80 text-[11px] uppercase tracking-[0.18em] text-[#c7bc98]">
                            <Sparkles size={14} className="text-[#c2a774]" />
                            <span>Фильтры хроник</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        <Select
                            value={selectedWorldId}
                            onChange={(val) => setSelectedWorldId(val)}
                            placeholder="Все миры"
                            options={worlds.map((w) => ({ value: w.id, label: w.name }))}
                        />
                        <Select
                            value={filterCharacter}
                            onChange={(val) => setFilterCharacter(val)}
                            placeholder="Все персонажи"
                            options={characters.map((c) => ({ value: c.id, label: c.name }))}
                        />
                        <Select
                            value={filterTag}
                            onChange={(val) => setFilterTag(val)}
                            placeholder="Все теги"
                            options={allTags.map((tag) => ({
                                value: tag,
                                label: tag,
                            }))}
                        />
                    </div>
                </div>
            </section>

            {filteredChronicles.length === 0 ? (
                <div className="mt-10 flex flex-col items-center justify-center gap-3 text-center font-lora">
                    <div className="px-4 py-3 rounded-2xl border border-[#3a4a34] bg-[#151f16]/90 shadow-sm max-w-md">
                        <p className="text-sm text-[#d6c5a2]">
                            Под ваши условия не нашлось ни одной записи хроники.
                        </p>
                        <p className="mt-1 text-[12px] text-[#c7bc98]">
                            Попробуйте убрать часть фильтров или изменить запрос поиска.
                        </p>
                    </div>
                    <BookOpen className="text-[#c2a774]" />
                    <span className="text-xs text-[#c7bc98]">
                        Каждая история начинается с первой записи.
                    </span>
                </div>
            ) : (
                <div className="relative pl-6 md:pl-8 space-y-8">
                    <div className="pointer-events-none absolute left-2 top-0 bottom-0">
                        <div className="w-[2px] h-full bg-gradient-to-b from-[#c2a774cc] via-[#c2a77455] to-transparent shadow-[0_0_12px_#c2a77488]" />
                    </div>

                    {[...filteredChronicles].sort(sortChronicles).map((c, index) => {
                        const previewHtml =
                            c.content.length > 400
                                ? c.content.slice(0, 400) + '...'
                                : c.content;

                        return (
                            <div
                                key={c.id}
                                className="relative group opacity-0 animate-fade-in-down"
                                style={{ animationDelay: `${index * 80}ms` }}
                            >
                                <div className="absolute -left-4 top-6 w-6 h-6 rounded-full bg-[#111712] border border-[#c2a774aa] shadow-[0_0_12px_#c2a774aa] flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-[#c2a774]" />
                                </div>

                                <Link
                                    to={`/chronicles/${c.id}`}
                                    className="block rounded-2xl border border-[#3a4a34] bg-gradient-to-br from-[#151f16] via-[#1b261c] to-[#151f16] p-4 md:p-6 shadow-md hover:shadow-[0_0_25px_#c2a77466] hover:border-[#c2a774aa] transition"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-[11px] md:text-xs font-lora text-[#c7bc98]">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-full border border-[#3a4a34] bg-[#101712]/80">
                                                {worldCalendar && c.event_date
                                                    ? formatWorldDate(
                                                        c.event_date,
                                                        worldCalendar
                                                    )
                                                    : new Date(
                                                        c.created_at
                                                    ).toLocaleDateString()}
                                            </span>
                                            {selectedWorld && (
                                                <span className="px-2 py-0.5 rounded-full bg-[#141f16]/90 border border-[#3a4a34]">
                                                    {selectedWorld.name}
                                                </span>
                                            )}
                                            {c.mood && (
                                                <span className="px-2 py-0.5 rounded-full bg-[#141f16]/90 border border-[#3a4a34]">
                                                    {c.mood}
                                                </span>
                                            )}
                                        </div>

                                        {c.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 justify-end">
                                                {c.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="bg-[#c2a774] text-[#223120] px-2 py-0.5 rounded-full text-[10px] shadow-sm"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-lg md:text-xl font-garamond font-bold mb-2 text-[#f4ecd0] group-hover:text-[#fff8dd] group-hover:drop-shadow-[0_0_6px_#c2a774aa]">
                                        {c.title || 'Без названия'}
                                    </h3>

                                    <div className="prose prose-sm max-w-none text-[#d6c5a2] font-lora leading-relaxed prose-invert">
                                        {parse(previewHtml)}
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] md:text-xs text-[#c7bc98] font-lora">
                                        <span>
                                            Персонажи:{' '}
                                            {c.linked_characters.length > 0
                                                ? c.linked_characters
                                                    .map(getCharacterName)
                                                    .join(', ')
                                                : '—'}
                                        </span>
                                        <span className="italic opacity-80">
                                            Нажмите, чтобы открыть полную запись
                                        </span>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
