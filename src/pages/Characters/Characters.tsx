import { useEffect, useState } from 'react';
import { CharacterCard } from '../../features/characters/CharacterCard';
import { CharacterForm } from '../../features/characters/CharacterForm';
import { useCharacterStore } from '../../store/useCharacterStore';
import { Modal } from '../../components/Modal';
import type { Character } from '../../types/character';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { CirclePlus, SlidersHorizontal, Sparkles, Users } from 'lucide-react';
import { Button } from '../../components/ChronicleButton';
import { normalizeText } from '../../lib/NormalizeText';
import { useWorldSelectionStore } from '../../store/useWorldSelectionStore';
import { useWorldStore } from '../../store/useWorldStore';
import { WorldSelector } from '../../components/WorldSelector';
import { motion, AnimatePresence } from 'framer-motion';

const CHARACTERS_PER_PAGE = 10;

export const CharactersPage = () => {
    const session = useSession();
    const supabase = useSupabaseClient();
    const { characters, fetchCharacters, addCharacter, clearCharacters } = useCharacterStore();
    const [isModalOpen, setModalOpen] = useState(false);
    const [isFilterOpen, setFilterOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const selectedWorldId = useWorldSelectionStore((s) => s.selectedWorldId);
    const { fetchWorlds } = useWorldStore();

    useEffect(() => {
        if (session?.user?.id && selectedWorldId) {
            fetchCharacters(session.user.id, supabase, selectedWorldId);
        } else if (session?.user?.id && !selectedWorldId) {
            fetchCharacters(session.user.id, supabase, undefined);
        } else {
            clearCharacters();
        }
    }, [session, selectedWorldId, fetchCharacters, clearCharacters, supabase]);

    useEffect(() => {
        if (session?.user?.id) {
            fetchWorlds(session.user.id, supabase);
        }
    }, [session, fetchWorlds, supabase]);

    const handleAdd = async (char: Character) => {
        const userId = session?.user?.id;
        if (!userId) return;
        await addCharacter(
            { ...char, user_id: userId, world_id: selectedWorldId || null },
            supabase
        );
        setModalOpen(false);
    };

    const normalizedSearch = normalizeText(searchTerm);

    const filteredCharacters = characters.filter((char) =>
        normalizeText(char.name).includes(normalizedSearch)
    );

    const totalPages = Math.ceil(filteredCharacters.length / CHARACTERS_PER_PAGE);
    const paginatedCharacters = filteredCharacters.slice(
        (currentPage - 1) * CHARACTERS_PER_PAGE,
        currentPage * CHARACTERS_PER_PAGE
    );

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className='max-w-[1440px] mx-auto mt-10 px-2 md:px-4 space-y-4 md:space-y-10'>

            <motion.div
                className="flex flex-col gap-3 border-b border-[#c2a774]/70 pb-4 md:flex-row md:items-end md:justify-between"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl flex items-center gap-2 font-garamond text-[#e5d9a5]">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1b261a] border border-[#c2a77466] shadow-[0_0_18px_#000] text-[#c2a774]">
                            <Users className="w-5 h-5" />
                        </span>
                        Персонажи
                    </h1>
                    <p className="text-base text-[#c7bc98] font-lora max-w-2xl leading-relaxed">
                        Все персонажи вашего мира — их биографии, атрибуты и связи.
                    </p>
                </div>
                <Button
                    onClick={() => setModalOpen(true)}
                    icon={<CirclePlus size={20} className="max-lg:shrink-0" />}
                    className="w-full justify-center gap-2 shadow-[0_4px_20px_rgba(194,167,116,0.2)] md:self-center lg:w-auto"
                >
                    Добавить персонажа
                </Button>
            </motion.div>
            <div className='flex flex-col w-full justify-between gap-3 md:gap-8'>
                <div className="flex items-center gap-2">
                    <div className="relative w-full">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c7bc98]/50 w-5 h-5 pointer-events-none"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="m21 21-4.34-4.34" />
                        <circle cx="11" cy="11" r="8" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Поиск по имени..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-10 pr-4 py-3 rounded-xl w-full bg-[#0e1b12]/80 text-[#e5d9a5] border border-[#3a4a34] placeholder:text-[#c7bc98]/50 focus:outline-none focus:border-[#c2a774] transition font-lora"
                    />
                    </div>
                    <button
                        type="button"
                        onClick={() => setFilterOpen(true)}
                        className="h-[52px] w-[52px] shrink-0 rounded-xl border border-[#3a4a34] bg-[#0e1b12]/90 text-[#c2a774] flex items-center justify-center transition hover:border-[#c2a774] hover:text-[#e5d9a5]"
                        aria-label="Открыть фильтры"
                    >
                        <SlidersHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <AnimatePresence mode="wait">
                {characters.length === 0 && !searchTerm && (
                    <motion.div
                        key="no-characters"
                        className="flex flex-col items-center justify-center text-center text-[#e5d9a5]/80 font-lora gap-4 mt-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                    >
                        <motion.div
                            className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-[#c2a77466] bg-[#151e16] shadow-[0_0_24px_#000]"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                        >
                            <Sparkles className="w-7 h-7 text-[#c2a774]" />
                        </motion.div>
                        <div className="space-y-1">
                            <p className="text-base md:text-lg italic">Персонажей пока нет.</p>
                            <p className="text-xs text-[#c7bc98]">Создайте первого — и мир начнёт обретать лица.</p>
                        </div>
                        <Button
                            icon={<CirclePlus size={20} />}
                            onClick={() => setModalOpen(true)}
                            className="mt-2 w-full max-w-sm justify-center shadow-[0_4px_24px_rgba(194,167,116,0.18)] lg:w-auto"
                        >
                            Добавить первого персонажа
                        </Button>
                    </motion.div>
                )}

                {filteredCharacters.length === 0 && searchTerm && (
                    <motion.div
                        key="no-results"
                        className="flex flex-col items-center justify-center text-center text-[#e5d9a5]/70 font-lora gap-3 mt-8"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <p className="text-base italic">
                            По запросу <span className="text-[#c2a774] not-italic">«{searchTerm}»</span> персонажей не найдено.
                        </p>
                        <p className="text-xs text-[#c7bc98]">Попробуйте изменить запрос или убрать фильтр мира.</p>
                    </motion.div>
                )}

                {paginatedCharacters.length > 0 && (
                    <motion.div
                        key="list"
                        className="flex flex-col gap-4"
                        initial="hidden"
                        animate="visible"
                        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
                    >
                        <AnimatePresence mode="popLayout">
                            {paginatedCharacters.map((char) => (
                                <motion.div
                                    key={char.id}
                                    layout
                                    variants={{
                                        hidden: { opacity: 0, x: -20, scale: 0.97 },
                                        visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.3 } },
                                    }}
                                    exit={{ opacity: 0, x: 20, scale: 0.97, transition: { duration: 0.2 } }}
                                >
                                    <CharacterCard character={char} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-6 font-lora text-[#e5d9a5]">
                    <button
                        type="button"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="min-h-11 min-w-11 touch-manipulation rounded-xl border border-[#c2a774] px-3 py-2 text-lg hover:bg-[#3a4c3a] disabled:opacity-30 lg:min-h-0 lg:min-w-0 lg:rounded lg:py-1"
                    >
                        ⪻
                    </button>
                    {Array.from({ length: totalPages }).map((_, index) => {
                        const isActive = currentPage === index + 1;
                        return (
                            <button
                                type="button"
                                key={index}
                                onClick={() => goToPage(index + 1)}
                                className={`min-h-11 min-w-11 touch-manipulation rounded-xl border font-bold transition lg:min-h-0 lg:min-w-0 lg:rounded lg:px-3 lg:py-1 ${isActive
                                    ? 'bg-[#c2a774] text-[#2D422B] shadow-md'
                                    : 'border-[#c2a774] hover:bg-[#3a4c3a]'
                                    }`}
                            >
                                {index + 1}
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="min-h-11 min-w-11 touch-manipulation rounded-xl border border-[#c2a774] px-3 py-2 text-lg hover:bg-[#3a4c3a] disabled:opacity-30 lg:min-h-0 lg:min-w-0 lg:rounded lg:py-1"
                    >
                        ⪼
                    </button>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
                <CharacterForm onFinish={() => setModalOpen(false)} onSave={handleAdd} />
            </Modal>
            <Modal isOpen={isFilterOpen} onClose={() => setFilterOpen(false)}>
                <div className="space-y-4">
                    <h3 className="text-lg font-garamond text-[#e5d9a5] flex items-center gap-2">
                        <SlidersHorizontal className="w-5 h-5 text-[#c2a774]" />
                        Фильтры персонажей
                    </h3>
                    <WorldSelector />
                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => useWorldSelectionStore.getState().setSelectedWorldId(null)}
                        >
                            Сбросить
                        </Button>
                        <Button className="w-full" onClick={() => setFilterOpen(false)}>
                            Готово
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
