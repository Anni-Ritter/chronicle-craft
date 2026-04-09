import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useWorldStore } from '../../store/useWorldStore';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useChronicleStore } from '../../store/useChronicleStore';
import { useMapStore } from '../../store/useMapStore';
import { Globe2, BookMarked, MapPinned, Users, Pencil, Dot, Sparkles } from 'lucide-react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { WorldCalendarWidget } from '../../components/WorldCalendarWidget';
import { WorldForm } from '../../features/world/WorldForm';
import { Modal } from '../../components/Modal';
import { formatEventDate } from '../../lib/formatEventDate';
import { Button } from '../../components/ChronicleButton';
import { WorldDetailsBlock } from '../../components/WorldDetailsBlock';
import { motion, type Variants } from 'framer-motion';

const cardListVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
};

const cardItemVariants: Variants = {
    hidden: { opacity: 0, y: 18, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32 } },
};

export const WorldDetailsPage = () => {
    const { id } = useParams();
    const supabase = useSupabaseClient();
    const session = useSession();
    const { worlds, fetchWorlds } = useWorldStore();

    const world = worlds.find(w => w.id === id);

    const { characters, fetchCharacters } = useCharacterStore();
    const { chronicles, fetchChronicles } = useChronicleStore();
    const { maps, fetchMaps } = useMapStore();

    const [editModalOpen, setEditModalOpen] = useState(false);

    useEffect(() => {
        if (!id || !session?.user?.id) return;

        fetchWorlds(session.user.id, supabase);
        fetchCharacters(session.user.id, supabase, id);
        fetchChronicles(supabase, id);
        fetchMaps(session.user.id, supabase, id);
    }, [id, session?.user?.id]);

    if (!world) {
        return (
            <div className="max-w-2xl mx-auto mt-16 px-4 text-center text-[#e5d9a5] font-lora">
                <div className="inline-block rounded-3xl border border-[#c2a77455] bg-[#111712]/95 px-6 py-8 shadow-[0_0_40px_#000]">
                    <p className="text-lg mb-3">Мир не найден 😢</p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1 text-[#c2a774] hover:text-[#e5d9a5] hover:underline text-sm"
                    >
                        Вернуться на главную
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1440px] mx-auto px-3 md:px-4 pt-6 md:pt-10 pb-16 font-lora text-[#e5d9a5] space-y-10 relative z-10">
            <motion.div
                className="text-xs sm:text-sm text-[#c7bc98] flex flex-wrap items-center gap-1 mb-2"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Link to="/" className="text-[#c2a774] hover:underline">Главная</Link>
                <Dot className="w-4 h-4" />
                <Link to="/worlds" className="text-[#c2a774] hover:underline">Миры</Link>
                <Dot className="w-4 h-4" />
                <span className="text-[#e5d9a5] line-clamp-1">{world.name}</span>
            </motion.div>

            <motion.section
                className="relative rounded-3xl border border-[#c2a77455] bg-[#111712]/95 shadow-[0_0_45px_#000] px-5 py-6 md:px-8 md:py-8 space-y-6"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                <div className="pointer-events-none absolute -top-24 -right-16 w-64 h-64 rounded-full bg-[#c2a77422] blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-20 w-72 h-72 rounded-full bg-[#c2a77411] blur-3xl" />

                <div className="relative z-10 flex flex-col gap-4 border-b border-[#3a4a34] pb-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#3a4a34] bg-[#141f16]/80 text-[11px] md:text-xs uppercase tracking-[0.22em] text-[#c7bc98]">
                                <Sparkles className="w-3.5 h-3.5 text-[#c2a774]" />
                                <span>Мир</span>
                            </div>
                            <h1 className="text-2xl md:text-4xl font-garamond font-bold flex items-center gap-2 flex-wrap text-[#e5d9a5]">
                                <Globe2 className="w-7 h-7 text-[#c2a774] shrink-0" />
                                <span>{world.name}</span>
                            </h1>
                        </div>

                        <Button
                            onClick={() => setEditModalOpen(true)}
                            icon={<Pencil size={20} className="shrink-0" />}
                            className="w-full justify-center shadow-[0_4px_18px_rgba(0,0,0,0.3)] max-lg:min-h-[52px] lg:w-auto lg:self-start lg:text-xs xl:text-sm"
                        >
                            Редактировать мир
                        </Button>
                    </div>

                    {world.description && (
                        <p className="text-sm md:text-base text-[#c7bc98] max-w-3xl">
                            {world.description}
                        </p>
                    )}
                </div>

                {world.calendar && (
                    <div className="relative z-10 mt-3">
                        <h2 className="text-xs md:text-sm uppercase tracking-[0.22em] text-[#c7bc98] mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#c2a774]" />
                            Календарь мира
                        </h2>
                        <div className="border border-[#3a4a34] rounded-2xl px-3 py-3 md:px-4 md:py-4">
                            <WorldCalendarWidget calendar={world.calendar} />
                        </div>
                    </div>
                )}

                {world.details && (
                    <div className="mt-10">
                        <WorldDetailsBlock details={world.details} />
                    </div>
                )}

            </motion.section>

            <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}>
                <WorldForm
                    initialWorld={world}
                    onFinish={async () => {
                        await fetchWorlds(session!.user!.id, supabase);
                        setEditModalOpen(false);
                    }}
                />
            </Modal>

            <motion.section
                className="space-y-4"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
            >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h2 className="text-xl md:text-2xl font-garamond flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#c2a774]" />
                        Персонажи
                    </h2>
                    {characters.length > 0 && (
                        <span className="text-xs md:text-sm text-[#c7bc98]">
                            Всего: <span className="text-[#e5d9a5]">{characters.length}</span>
                        </span>
                    )}
                </div>

                {characters.length === 0 ? (
                    <p className="italic text-[#e5d9a5]/55 text-sm">
                        В этом мире пока нет персонажей. Самое время кого-то вписать в хроники.
                    </p>
                ) : (
                    <motion.ul
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                        variants={cardListVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {characters.map((c) => (
                            <motion.li
                                key={c.id}
                                variants={cardItemVariants}
                                whileHover={{ y: -3, boxShadow: '0 0 30px rgba(194,167,116,0.35)' }}
                                className="relative group overflow-hidden rounded-2xl border border-[#3a4a34] bg-[#141f16]/90 shadow-[0_0_22px_#000] hover:border-[#c2a774bb] transition-colors"
                            >
                                <Link
                                    to={`/character/${c.id}`}
                                    className="flex items-center gap-4 px-4 py-3"
                                >
                                    {c.avatar ? (
                                        <div className="relative shrink-0">
                                            <img
                                                src={c.avatar}
                                                alt={c.name}
                                                className="w-14 h-14 object-cover rounded-full border border-[#c2a774aa] shadow-md"
                                            />
                                            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#111712] border border-[#c2a77490] flex items-center justify-center text-[11px] text-[#c2a774]">
                                                ✦
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="w-14 h-14 rounded-full border border-dashed border-[#3a4a34] flex items-center justify-center text-xs text-[#c7bc98]">
                                            Нет аватара
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base md:text-lg font-semibold text-[#e5d9a5] truncate">
                                            {c.name}
                                        </h3>
                                        {c.status && (
                                            <p className="text-xs md:text-sm text-[#c7bc98] italic line-clamp-1">
                                                {c.status}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
            </motion.section>

            <motion.section
                className="space-y-4"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
            >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h2 className="text-xl md:text-2xl font-garamond flex items-center gap-2">
                        <BookMarked className="w-5 h-5 text-[#c2a774]" />
                        Хроники
                    </h2>
                    {chronicles.length > 0 && (
                        <span className="text-xs md:text-sm text-[#c7bc98]">
                            Всего: <span className="text-[#e5d9a5]">{chronicles.length}</span>
                        </span>
                    )}
                </div>

                {chronicles.length === 0 ? (
                    <p className="italic text-[#e5d9a5]/55 text-sm">
                        Хроник пока нет — но мир терпеливо ждёт первую запись.
                    </p>
                ) : (
                    <motion.ul
                        className="grid grid-cols-1 md:grid-cols-2 gap-5"
                        variants={cardListVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {chronicles.map((chronicle) => {
                            const moodEmoji = chronicle.mood?.split(' ')[0] || '📖';
                            const preview =
                                chronicle.content.length > 260
                                    ? chronicle.content.slice(0, 260) + '…'
                                    : chronicle.content;

                            return (
                                <motion.li
                                    key={chronicle.id}
                                    variants={cardItemVariants}
                                    whileHover={{ y: -3, boxShadow: '0 0 30px rgba(194,167,116,0.27)' }}
                                    className="relative group overflow-hidden rounded-2xl border border-[#3a4a34] bg-[#141f16]/90 shadow-[0_0_24px_#000] hover:border-[#c2a774bb] transition-colors"
                                >
                                    <Link to={`/chronicles/${chronicle.id}`} className="block p-4">
                                        <div className="flex items-start gap-3 mb-2">
                                            <div className="shrink-0 w-8 h-8 rounded-full bg-[#2a3a2a] flex items-center justify-center text-lg">
                                                {moodEmoji}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#c7bc98] mb-1">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#3a4a34] bg-[#111712]/80">
                                                        <span className="w-1 h-1 rounded-full bg-[#c2a774]" />
                                                        {formatEventDate(chronicle.event_date)}
                                                    </span>
                                                    {chronicle.tags?.length > 0 && (
                                                        <span className="truncate">
                                                            {chronicle.tags.slice(0, 3).map((t) => (
                                                                <span
                                                                    key={t}
                                                                    className="mr-1 text-[#c2a774]"
                                                                >
                                                                    #{t}
                                                                </span>
                                                            ))}
                                                            {chronicle.tags.length > 3 && '…'}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-base md:text-lg font-semibold text-[#e5d9a5] mb-1 line-clamp-2">
                                                    {chronicle.title}
                                                </h3>
                                            </div>
                                        </div>

                                        <p
                                            className="mt-1 text-xs md:text-sm text-[#c7bc98] italic line-clamp-3"
                                            dangerouslySetInnerHTML={{ __html: preview }}
                                        />
                                    </Link>
                                </motion.li>
                            );
                        })}
                    </motion.ul>
                )}
            </motion.section>

            <motion.section
                className="space-y-4"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
            >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h2 className="text-xl md:text-2xl font-garamond flex items-center gap-2">
                        <MapPinned className="w-5 h-5 text-[#c2a774]" />
                        Карты
                    </h2>
                    {maps.length > 0 && (
                        <span className="text-xs md:text-sm text-[#c7bc98]">
                            Всего: <span className="text-[#e5d9a5]">{maps.length}</span>
                        </span>
                    )}
                </div>

                {maps.length === 0 ? (
                    <p className="italic text-[#e5d9a5]/55 text-sm">
                        Пока здесь пусто — добавьте первую карту, чтобы мир обрел очертания.
                    </p>
                ) : (
                    <motion.ul
                        className="grid grid-cols-1 sm:grid-cols-2 gap-5"
                        variants={cardListVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {maps.map((map) => (
                            <motion.li
                                key={map.id}
                                variants={cardItemVariants}
                                whileHover={{ y: -3, boxShadow: '0 0 30px rgba(194,167,116,0.27)' }}
                                className="relative group overflow-hidden rounded-2xl border border-[#3a4a34] bg-[#141f16]/90 shadow-[0_0_24px_#000] hover:border-[#c2a774bb] transition-colors"
                            >
                                <Link to={`/maps/${map.id}`} className="block">
                                    <div className="relative">
                                        <img
                                            src={
                                                supabase.storage
                                                    .from('map')
                                                    .getPublicUrl(map.image_path).data.publicUrl
                                            }
                                            alt={map.name}
                                            className="w-full h-40 md:h-48 object-cover rounded-t-2xl"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#111712ee] via-transparent to-transparent opacity-80" />
                                        <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-[#111712dd] border border-[#c2a77488] text-[11px] md:text-xs text-[#e5d9a5]">
                                            {map.territory || 'Неизведанные земли'}
                                        </span>
                                    </div>
                                    <div className="px-4 py-3">
                                        <h3 className="text-base md:text-lg font-semibold text-[#e5d9a5]">
                                            {map.name}
                                        </h3>
                                        {map.territory && (
                                            <p className="text-xs md:text-sm text-[#c7bc98] mt-1 line-clamp-1">
                                                {map.territory}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
            </motion.section>
        </div>
    );
};
