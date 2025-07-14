import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import parse from 'html-react-parser';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useChronicleStore } from '../../store/useChronicleStore';
import { useCharacterStore } from '../../store/useCharacterStore';
import { ChronicleForm } from '../../features/chronicle/ChronicleForm';
import { BookCopy, Clock, Dot, MapPin, Pencil, Smile, Sparkle, User2 } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/ChronicleButton';

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
    
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

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
            <div className="text-center mt-10 text-[#c2a774]">
                Хроника не найдена 😢
                <br />
                <button onClick={() => navigate('/chronicles')} className="underline mt-2">
                    ← Вернуться к списку
                </button>
            </div>
        );
    }

    if (!chronicle) {
        return (
            <div className="text-center mt-10 text-[#c2a774]">
                Загрузка...
            </div>
        );
    }

    return (
        <div className="text-[#e5d9a5] font-lora mt-6 md:mt-8 px-2">
            <div className="text-sm sm:text-lg text-[#c7bc98] flex flex-wrap items-center mb-4 sm:mb-6">
                <Link to="/" className="text-[#c2a774] hover:underline">Главная</Link>
                <span className="mx-1"><Dot className="w-4 h-4" /></span>
                <Link to="/chronicles" className="text-[#c2a774] hover:underline">Хроники</Link>
                <span className="mx-1"><Dot className="w-4 h-4" /></span>
                <span className="text-[#e5d9a5] font-semibold line-clamp-1">{chronicle.title}</span>
            </div>

            <div className="mt-12 space-y-6">
                <div className="flex flex-col gap-1 sm:gap-2">
                    <div className="w-full flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                        <h1 className="text-2xl md:text-3xl font-bold text-[#D6C5A2] flex items-center gap-2 flex-shrink sm:flex-grow">
                            <BookCopy className="min-w-[20px] min-h-[20px] shrink-0 max-sm:hidden" />
                            <span className="break-words">{chronicle.title}</span>
                        </h1>

                        <Button
                            onClick={() => setIsEditing(true)}
                            icon={<Pencil size={20} />}
                            className='text-base hidden lg:flex shrink-0'
                        >
                            Редактировать
                        </Button>
                    </div>
                    <p className="text-[#c7bc98] text-sm sm:text-base flex flex-row gap-1 items-center">
                        <Clock className='w-4 h-4' /> {new Date(chronicle.created_at).toLocaleDateString('ru-RU')}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 text-[#c7bc98] text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                        <Sparkle className="w-4 h-4 text-[#C2A774]" />
                        <span className="font-semibold text-[#C2A774]">Дата события:</span>
                        {chronicle.event_date
                            ? new Date(chronicle.event_date).toLocaleDateString('ru-RU')
                            : 'не указано'}
                    </div>
                    {chronicle.mood && (
                        <div className="flex items-center gap-2">
                            <Smile className="w-4 h-4 text-[#C2A774]" />
                            <span className="font-semibold text-[#C2A774]">Настроение:</span>
                            {chronicle.mood}
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <User2 className="w-4 h-4 text-[#C2A774]" />
                        <span className="font-semibold text-[#C2A774]">Персонажи:</span>
                        {chronicle.linked_characters.length > 0
                            ? chronicle.linked_characters.map(getCharacterName).join(', ')
                            : '—'}
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#C2A774]" />
                        <span className="font-semibold text-[#C2A774]">Локации:</span>
                        {chronicle.linked_locations.length > 0
                            ? chronicle.linked_locations.join(', ')
                            : '—'}
                    </div>
                </div>

                {chronicle.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {chronicle.tags.map((tag) => (
                            <span
                                key={tag}
                                className="bg-[#2f382c] text-[#c7f9cc] px-2 py-1 rounded-full text-base"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="prose dark:prose-invert max-w-none text-[#e6e0c7] text-sm sm:text-base mt-2 sm:mt-4">
                    {parse(chronicle.content)}
                </div>

                <Button
                    onClick={() => setIsEditing(true)}
                    icon={<Pencil className='w-5 h-5' />}
                    className='text-base lg:hidden'
                >
                    Редактировать
                </Button>

            </div>

            <Modal isOpen={isEditing} onClose={() => setIsEditing(false)}>
                <ChronicleForm
                    initial={chronicle}
                    supabase={supabase}
                    onFinish={() => setIsEditing(false)}
                />
            </Modal>
        </div>
    );
};
