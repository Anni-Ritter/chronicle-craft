import React, { useEffect, useState } from 'react';
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

interface ChronicleViewSwitcherProps {
    searchTerm?: string;
}

export const ChronicleViewSwitcher: React.FC<ChronicleViewSwitcherProps> = ({ searchTerm }) => {
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

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex flex-wrap gap-4 w-full sm:w-auto">
                    <Select
                        value={selectedWorldId}
                        onChange={(val) => setSelectedWorldId(val)}
                        placeholder="Все миры"
                        options={[
                            ...worlds.map((w) => ({ value: w.id, label: w.name }))
                        ]}
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
                        options={Array.from(new Set(chronicles.flatMap((c) => c.tags))).map((tag) => ({
                            value: tag,
                            label: tag,
                        }))}
                    />
                </div>
            </div>

            {filteredChronicles.length === 0 ? (
                <div className="text-center text-[#aaa] font-lora">Нет подходящих хроник 😔</div>
            ) : (
                <div className="relative pl-6 border-l-2 border-[#c2a774]/60 space-y-12">
                    {[...filteredChronicles].sort(sortChronicles).map((c, index) => (
                        <div
                            key={c.id}
                            className="relative group opacity-0 animate-fade-in-down"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="absolute -left-3 top-2 w-6 h-6 rounded-full bg-[#c2a774] border-4 border-[#0e1b12] shadow-md" />

                            <Link
                                to={`/chronicles/${c.id}`}
                                className="block border border-[#c2a774] bg-[#223120] hover:shadow-[0_0_25px_#c2a77480] transition rounded-2xl p-6 shadow-md"
                            >
                                <div className="flex justify-between text-sm text-[#a0a0a0] mb-2 font-lora">
                                    <span>
                                        {worldCalendar && c.event_date
                                            ? formatWorldDate(c.event_date, worldCalendar)
                                            : new Date(c.created_at).toLocaleDateString()}
                                    </span>
                                    {c.tags.length > 0 && (
                                        <div className="flex gap-1 flex-wrap">
                                            {c.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="bg-[#c2a774] text-[#2D422B] px-2 py-0.5 rounded-full text-xs"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold mb-2 text-[#e5d9a5] font-lora group-hover:drop-shadow-[0_0_4px_#e5d9a5aa]">
                                    {c.title}
                                </h3>

                                <div className="prose prose-sm max-w-none text-[#d6c5a2] font-lora">
                                    {parse(
                                        c.content.length > 400
                                            ? c.content.slice(0, 400) + '...'
                                            : c.content
                                    )}
                                </div>

                                <div className="mt-3 text-sm italic text-[#c7bc98] font-lora">
                                    Персонажи:{' '}
                                    {c.linked_characters.length > 0
                                        ? c.linked_characters.map(getCharacterName).join(', ')
                                        : '—'}
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};