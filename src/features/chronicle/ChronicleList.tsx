import React, { useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import parse from 'html-react-parser';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useChronicleStore } from '../../store/useChronicleStore';

export const ChronicleList: React.FC = () => {
    const supabase = useSupabaseClient();
    const { fetchChronicles, chronicles, removeChronicle } = useChronicleStore();
    const { characters, fetchCharacters } = useCharacterStore();
    const session = useSession();
    const [filterCharacter, setFilterCharacter] = useState<string | null>(null);
    const [filterTag, setFilterTag] = useState<string | null>(null);

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
        const matchTag = filterTag
            ? chronicle.tags.includes(filterTag)
            : true;
        return matchCharacter && matchTag;
    });

    const getCharacterName = (id: string) => {
        const char = characters.find((c) => c.id === id);
        return char ? char.name : '???';
    };

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            <div className="flex flex-wrap gap-4 mb-4">
                <select
                    className="border px-3 py-2 rounded"
                    value={filterCharacter || ''}
                    onChange={(e) =>
                        setFilterCharacter(e.target.value || null)
                    }
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
                    onChange={(e) =>
                        setFilterTag(e.target.value || null)
                    }
                >
                    <option value="">Все теги</option>
                    {Array.from(new Set(chronicles.flatMap((c) => c.tags))).map((tag) => (
                        <option key={tag}>{tag}</option>
                    ))}
                </select>
            </div>

            {filteredChronicles.length === 0 && (
                <div className="text-gray-500">Нет хроник по выбранным фильтрам.</div>
            )}

            {filteredChronicles.map((chronicle) => (
                <div key={chronicle.id} className="border rounded p-4 shadow bg-white space-y-2">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold">{chronicle.title}</h3>
                        <div className="text-sm text-gray-500">
                            {new Date(chronicle.created_at).toLocaleDateString()}
                        </div>
                    </div>

                    <div className="text-sm text-gray-700">
                        {parse(
                            chronicle.content.length > 300
                                ? chronicle.content.slice(0, 300) + '...'
                                : chronicle.content
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm">
                        {chronicle.tags.map((tag) => (
                            <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <div className="text-sm text-gray-600">
                        Персонажи:{" "}
                        {chronicle.linked_characters.map((id) => getCharacterName(id)).join(', ') || '—'}
                    </div>

                    <div className="flex gap-2 mt-2">
                        <button
                            className="text-blue-600 hover:underline"
                            onClick={() => alert('Открыть подробности или режим редактирования')}
                        >
                            Подробнее
                        </button>
                        <button
                            className="text-red-500 hover:underline"
                            onClick={() => {
                                if (confirm('Удалить хронику?')) {
                                    removeChronicle(chronicle.id, supabase);
                                }
                            }}
                        >
                            Удалить
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
