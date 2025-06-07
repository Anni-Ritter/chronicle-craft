import React, { useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useChronicleStore } from '../../store/useChronicleStore';
import { useCharacterStore } from '../../store/useCharacterStore';
import { Link } from 'react-router-dom';
import parse from 'html-react-parser';

type ViewMode = 'list' | 'timeline';

export const ChronicleViewSwitcher: React.FC = () => {
    const supabase = useSupabaseClient();
    const { fetchChronicles, chronicles } = useChronicleStore();
    const { characters, fetchCharacters } = useCharacterStore();
    const session = useSession();
    const [filterCharacter, setFilterCharacter] = useState<string | null>(null);
    const [filterTag, setFilterTag] = useState<string | null>(null);
    const [view, setView] = useState<ViewMode>('timeline');

    useEffect(() => {
        fetchChronicles(supabase);
        if (session?.user?.id) {
            fetchCharacters(session.user.id, supabase);
        }
    }, []);

    const filteredChronicles = chronicles.filter((chronicle) => {
        const matchCharacter = filterCharacter
            ? chronicle.linked_characters.includes(filterCharacter)
            : true;
        const matchTag = filterTag ? chronicle.tags.includes(filterTag) : true;
        return matchCharacter && matchTag;
    });

    const getCharacterName = (id: string) =>
        characters.find((c) => c.id === id)?.name || '???';

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="flex gap-2">
                    <button
                        onClick={() => setView('list')}
                        className={`px-3 py-1 rounded border ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                            }`}
                    >
                        📜 Список
                    </button>
                    <button
                        onClick={() => setView('timeline')}
                        className={`px-3 py-1 rounded border ${view === 'timeline' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                            }`}
                    >
                        ⏳ Временная шкала
                    </button>
                </div>

                <div className="flex flex-wrap gap-4">
                    <select
                        className="border px-3 py-2 rounded"
                        value={filterCharacter || ''}
                        onChange={(e) => setFilterCharacter(e.target.value || null)}
                    >
                        <option value="">Все персонажи</option>
                        {characters.map((char) => (
                            <option key={char.id} value={char.id}>
                                {char.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="border px-3 py-2 rounded"
                        value={filterTag || ''}
                        onChange={(e) => setFilterTag(e.target.value || null)}
                    >
                        <option value="">Все теги</option>
                        {Array.from(new Set(chronicles.flatMap((c) => c.tags))).map((tag) => (
                            <option key={tag}>{tag}</option>
                        ))}
                    </select>
                </div>
            </div>

            {filteredChronicles.length === 0 ? (
                <div className="text-gray-500 text-center">Нет подходящих хроник 😔</div>
            ) : view === 'list' ? (
                <div className="space-y-6">
                    {filteredChronicles.map((chronicle) => (
                        <Link to={`/chronicles/${chronicle.id}`} key={chronicle.id} className="block border rounded p-4 shadow bg-white hover:bg-gray-50 transition">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold">{chronicle.title}</h3>
                                <div className="text-sm text-gray-500">
                                    {new Date(chronicle.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="text-sm text-gray-700 mt-1">
                                {parse(
                                    chronicle.content.length > 300
                                        ? chronicle.content.slice(0, 300) + '...'
                                        : chronicle.content
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2 mt-2 text-sm">
                                {chronicle.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="mt-1 text-sm text-gray-600">
                                Персонажи:{" "}
                                {chronicle.linked_characters
                                    .map((id) => getCharacterName(id))
                                    .join(', ') || '—'}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="relative pl-6 border-l-2 border-gray-300 space-y-10">
                    {[...filteredChronicles]
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((c, index) => (
                            <div
                                key={c.id}
                                className="relative group opacity-0 animate-fade-in-down"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="absolute -left-3 top-2 w-6 h-6 rounded-full bg-blue-500 border-4 border-white shadow" />

                                <Link to={`/chronicles/${c.id}`} className="block border rounded p-4 shadow bg-white hover:bg-gray-50 transition">
                                    <div className="flex justify-between text-sm text-gray-500  mb-1">
                                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                                        {c.tags.length > 0 && (
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                                {c.tags.join(', ')}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-semibold mb-1">{c.title}</h3>

                                    <div className="prose prose-sm max-w-none">
                                        {parse(
                                            c.content.length > 400
                                                ? c.content.slice(0, 400) + '...'
                                                : c.content
                                        )}
                                    </div>

                                    <div className="mt-1 text-sm text-gray-600">
                                        Персонажи:{" "}
                                        {c.linked_characters.map((id) => getCharacterName(id)).join(', ') || '—'}
                                    </div>
                                </Link>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};
