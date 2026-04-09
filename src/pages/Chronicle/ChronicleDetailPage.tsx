import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import parse from 'html-react-parser';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useChronicleStore } from '../../store/useChronicleStore';
import { useCharacterStore } from '../../store/useCharacterStore';
import { ChronicleForm } from '../../features/chronicle/ChronicleForm';
import {
    BookCopy,
    Dot,
    MapPin,
    Pencil,
    Smile,
    Sparkle,
    Trash2,
    User2,
    ArrowLeft,
    Sparkles,
} from 'lucide-react';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/ChronicleButton';
import { formatWorldDate } from '../../lib/formatWorldDate';
import { useWorldStore } from '../../store/useWorldStore';

export const ChronicleDetailPage = () => {
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
    }, [chronicles, chronicle]);

    const getCharacterName = (id: string) =>
        characters.find((c) => c.id === id)?.name || '???';

    const handleDelete = async () => {
        if (!chronicle?.id) return;

        const { error } = await supabase
            .from('chronicles')
            .delete()
            .eq('id', chronicle.id);

        if (!error) {
            setIsDeleting(false);
            navigate('/chronicles');
        } else {
            console.error('Ошибка при удалении:', error);
        }
    };

    if (notFound) {
        return (
            <div className="max-w-3xl mx-auto mt-16 px-4 font-lora text-center">
                <div className="inline-block rounded-3xl border border-[#3a4a34] bg-[#151f16]/90 px-6 py-6 shadow-[0_0_24px_#000]">
                    <p className="text-[#e5d9a5] text-lg mb-2">
                        Хроника не найдена <span className="inline-block">😢</span>
                    </p>
                    <p className="text-[#c7bc98] text-sm mb-4">
                        Возможно, запись была удалена или ссылка устарела.
                    </p>
                    <Button
                        onClick={() => navigate('/chronicles')}
                        icon={<ArrowLeft size={18} />}
                        className="text-sm"
                    >
                        Вернуться к списку хроник
                    </Button>
                </div>
            </div>
        );
    }

    if (!chronicle) {
        return (
            <div className="max-w-3xl mx-auto mt-20 px-4 font-lora text-center">
                <div className="inline-flex flex-col items-center gap-3 rounded-3xl border border-[#3a4a34] bg-[#151f16]/90 px-6 py-6 shadow-[0_0_24px_#000]">
                    <Sparkles className="text-[#c2a774] animate-pulse" />
                    <p className="text-[#e5d9a5]">Загружаем хронику...</p>
                    <p className="text-[#c7bc98] text-xs">
                        Перелистываем страницы архива.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-6 md:mt-10 px-2 md:px-4 text-[#e5d9a5] font-lora">
            <div className="text-xs sm:text-sm text-[#c7bc98] flex flex-wrap items-center gap-1 mb-4 md:mb-6">
                <Link
                    to="/"
                    className="inline-flex items-center gap-1 text-[#c2a774] hover:text-[#e5d9a5] hover:underline transition"
                >
                    Главная
                </Link>
                <Dot className="w-4 h-4 text-[#555]" />
                <Link
                    to="/chronicles"
                    className="text-[#c2a774] hover:text-[#e5d9a5] hover:underline transition"
                >
                    Хроники
                </Link>
                <Dot className="w-4 h-4 text-[#555]" />
                <span className="text-[#e5d9a5] line-clamp-1">
                    {chronicle.title || 'Без названия'}
                </span>
            </div>

            <div className="relative rounded-3xl border border-[#3a4a34] bg-gradient-to-br from-[#151f16] via-[#1b261c] to-[#111712] shadow-[0_0_40px_#000] overflow-hidden">
                <div className="pointer-events-none absolute -top-20 -right-10 w-64 h-64 rounded-full bg-[#c2a77422] blur-3xl" />

                <div className="relative z-10 px-4 py-5 md:px-8 md:py-7 space-y-6">
                    <div className="flex flex-col gap-3">
                        <div className="space-y-2 md:space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#3a4a34] bg-[#101712]/80 text-[10px] md:text-xs uppercase tracking-[0.18em] text-[#c7bc98]">
                                    <Sparkles size={14} className="text-[#c2a774]" />
                                    <span>Запись хроники</span>
                                </div>
                                <div className="flex items-center gap-3 text-[#c7bc98]">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="inline-flex h-8 w-8 items-center justify-center text-[#c7bc98] hover:text-[#e5d9a5] transition"
                                    aria-label="Редактировать"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsDeleting(true)}
                                    className="inline-flex h-8 w-8 items-center justify-center text-[#ff9b9b] hover:text-[#ffb2b2] transition"
                                    aria-label="Удалить"
                                >
                                    <Trash2 size={18} />
                                </button>
                                </div>
                            </div>
                            <h1 className="flex items-start gap-2 text-2xl md:text-3xl lg:text-[32px] font-garamond font-bold text-[#f4ecd0] drop-shadow-[0_0_10px_#000]">
                                <BookCopy className="w-6 h-6 mt-1 text-[#c2a774] max-sm:hidden flex-shrink-0" />
                                <span className="break-words">{chronicle.title}</span>
                            </h1>
                        </div>
                    </div>

                    <section className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-xs sm:text-sm text-[#d6c5a2]">
                        <div className="flex items-center gap-2">
                            <Sparkle className="w-4 h-4 text-[#c2a774]" />
                            <span className="font-semibold text-[#c2a774]">
                                Дата события:
                            </span>
                            <span>
                                {chronicle.event_date && chronicleWorld?.calendar
                                    ? formatWorldDate(
                                        chronicle.event_date,
                                        chronicleWorld.calendar
                                    )
                                    : 'не указано'}
                            </span>
                        </div>

                        {chronicle.mood && (
                            <div className="flex items-center gap-2">
                                <Smile className="w-4 h-4 text-[#c2a774]" />
                                <span className="font-semibold text-[#c2a774]">
                                    Настроение:
                                </span>
                                <span>{chronicle.mood}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <User2 className="w-4 h-4 text-[#c2a774]" />
                            <span className="font-semibold text-[#c2a774]">
                                Персонажи:
                            </span>
                            <span>
                                {chronicle.linked_characters.length > 0
                                    ? chronicle.linked_characters
                                        .map(getCharacterName)
                                        .join(', ')
                                    : '—'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#c2a774]" />
                            <span className="font-semibold text-[#c2a774]">
                                Локации:
                            </span>
                            <span>
                                {chronicle.linked_locations.length > 0
                                    ? chronicle.linked_locations.join(', ')
                                    : '—'}
                            </span>
                        </div>
                    </section>

                    {chronicle.tags.length > 0 && (
                        <section className="pt-2">
                            <div className="flex flex-wrap gap-2">
                                {chronicle.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1 rounded-full bg-[#c2a774] text-[#223120] text-[11px] sm:text-xs shadow-sm"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="mt-2 md:mt-4 rounded-2xl border border-[#3a4a34] bg-[#111712]/80 px-3 md:px-5 py-4 md:py-6">
                        <div className="prose prose-sm md:prose-base max-w-none text-[#e6e0c7] font-lora leading-relaxed prose-invert">
                            {parse(chronicle.content)}
                        </div>
                    </section>

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
                <div className="p-6 sm:p-7 w-full space-y-4 text-[#e5d9a5] font-lora">
                    <h3 className="text-xl font-garamond font-bold flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-[#D76F6F]" />
                        Удалить хронику?
                    </h3>
                    <p className="text-sm text-[#c7bc98]">
                        Это действие необратимо. Запись будет удалена из архива навсегда.
                    </p>
                    <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                        <Button
                            onClick={() => setIsDeleting(false)}
                            variant="outline"
                            className="w-full text-sm sm:w-auto"
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={handleDelete}
                            variant="danger"
                            icon={<Trash2 className="h-4 w-4" />}
                            className="w-full text-sm sm:w-auto"
                        >
                            Удалить
                        </Button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};
