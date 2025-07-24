import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import parse from 'html-react-parser';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useChronicleStore } from '../../store/useChronicleStore';
import { useCharacterStore } from '../../store/useCharacterStore';
import { ChronicleForm } from '../../features/chronicle/ChronicleForm';
import { BookCopy, Dot, MapPin, Pencil, Smile, Sparkle, Trash2, User2 } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/ChronicleButton';
import { formatWorldDate } from '../../lib/formatWorldDate';
import { useWorldStore } from '../../store/useWorldStore';

export const ChronicleDetailPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const supabase = useSupabaseClient();
    const session = useSession();
    const { chronicles, fetchChronicles } = useChronicleStore();
    const { characters, fetchCharacters } = useCharacterStore();
    const { worlds, fetchWorlds } = useWorldStore();
    const [notFound, setNotFound] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            fetchWorlds(session.user.id, supabase);
            fetchChronicles(supabase);
            fetchCharacters(session.user.id, supabase);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    const chronicle = chronicles.find((c) => c.id === id);
    const chronicleWorld = worlds.find((w) => w.id === chronicle?.world_id) || null;

    useEffect(() => {
        if (chronicles.length > 0 && !chronicle) {
            setNotFound(true);
        }
    }, [chronicles]);

    const getCharacterName = (id: string) =>
        characters.find((c) => c.id === id)?.name || '???';

    const handleDelete = async () => {
        if (!chronicle?.id) return;

        const { error } = await supabase.from('chronicles').delete().eq('id', chronicle.id);

        if (!error) {
            setIsDeleting(false);
            navigate('/chronicles');
        } else {
            console.error('Ошибка при удалении:', error);
        }
    };

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
                        <Button
                            variant='danger'
                            onClick={() => setIsDeleting(true)}
                            icon={<Trash2 className="w-5 h-5" />}
                            className='text-base hidden lg:flex shrink-0'
                        >
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 text-[#c7bc98] text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                        <Sparkle className="w-4 h-4 text-[#C2A774]" />
                        <span className="font-semibold text-[#C2A774]">Дата события:</span>
                        {chronicle.event_date && chronicleWorld?.calendar
                            ? formatWorldDate(chronicle.event_date, chronicleWorld.calendar)
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

                <div className='flex gap-2'>
                    <Button
                        onClick={() => setIsEditing(true)}
                        icon={<Pencil className='w-5 h-5' />}
                        className='text-base lg:hidden'
                    >
                        Редактировать
                    </Button>
                    <Button
                        variant='danger'
                        onClick={() => setIsDeleting(true)}
                        icon={<Trash2 className="w-5 h-5" />}
                        className='text-base lg:hidden'
                    >
                    </Button>
                </div>
            </div>

            <Modal isOpen={isEditing} onClose={() => setIsEditing(false)}>
                <ChronicleForm
                    initial={chronicle}
                    supabase={supabase}
                    onFinish={() => setIsEditing(false)}
                />
            </Modal>

            <Modal isOpen={isDeleting} onClose={() => setIsDeleting(false)}>
                <div className="bg-[#0e1b12] p-6 rounded-2xl text-[#e5d9a5] border border-[#c2a774] shadow-xl space-y-4">
                    <h3 className="text-xl font-bold">Удалить хронику?</h3>
                    <p className="text-[#c7bc98]">Это действие необратимо. Вы уверены?</p>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button
                            onClick={() => setIsDeleting(false)}
                            variant='outline'
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={handleDelete}
                            variant='danger'
                            icon={<Trash2 className="w-5 h-5" />}
                        >
                            Удалить
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
