import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import parse from 'html-react-parser';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useChronicleStore } from '../../store/useChronicleStore';
import { useCharacterStore } from '../../store/useCharacterStore';
import { ChronicleForm } from '../../features/chronicle/ChronicleForm';

export const ChronicleDetailPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const supabase = useSupabaseClient();
    const session = useSession();
    const { chronicles, fetchChronicles } = useChronicleStore();
    const { characters, fetchCharacters } = useCharacterStore();
    const [notFound, setNotFound] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchChronicles(supabase);
        if (session?.user?.id) {
            fetchCharacters(session.user.id, supabase);
        }
    }, []);

    const chronicle = chronicles.find((c) => c.id === id);

    useEffect(() => {
        if (chronicles.length > 0 && !chronicle) {
            setNotFound(true);
        }
    }, [chronicles]);

    const getCharacterName = (id: string) =>
        characters.find((c) => c.id === id)?.name || '???';

    if (notFound) {
        return (
            <div className="text-center mt-10 text-gray-500">
                Хроника не найдена 😢
                <br />
                <button onClick={() => navigate('/chronicles')} className="text-blue-600 underline mt-2">
                    Вернуться к списку
                </button>
            </div>
        );
    }

    if (!chronicle) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <button onClick={() => navigate('/chronicles')} className="text-blue-600 underline mb-4">
                ← Назад к хроникам
            </button>

            {isEditing ? (
                <ChronicleForm
                    initial={chronicle}
                    supabase={supabase}
                    onFinish={() => setIsEditing(false)}
                />
            ) : (
                <div className="bg-white rounded shadow p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold">{chronicle.title}</h1>
                        <span className="text-sm text-gray-500">
                            {new Date(chronicle.created_at).toLocaleDateString()}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {chronicle.tags.map((tag) => (
                            <span
                                key={tag}
                                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    <div className="text-sm text-gray-600">
                        Персонажи:{" "}
                        {chronicle.linked_characters.length > 0
                            ? chronicle.linked_characters.map(getCharacterName).join(', ')
                            : '—'}
                    </div>

                    <div className="text-sm text-gray-600">
                        Локации:{" "}
                        {chronicle.linked_locations.length > 0
                            ? chronicle.linked_locations.join(', ')
                            : '—'}
                    </div>


                    <div className="prose dark:prose-invert max-w-none">
                        {parse(chronicle.content)}
                    </div>

                    <button
                        className="mt-4 text-yellow-700 hover:underline"
                        onClick={() => setIsEditing(true)}
                    >
                        ✏️ Редактировать
                    </button>
                </div>
            )}
        </div >
    );
};
