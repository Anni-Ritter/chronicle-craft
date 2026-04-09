import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Users } from 'lucide-react';
import { CharacterCard } from '../features/characters/CharacterCard';
import type { Character } from '../types/character';
import { normalizeText } from '../lib/NormalizeText';

const CHARACTERS_PER_PAGE = 10;

export const PlayerCharactersPage = () => {
    const { userId } = useParams<{ userId: string }>();
    const supabase = useSupabaseClient();
    const session = useSession();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);
    const [ownerLabel, setOwnerLabel] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const isOwnList = !!(session?.user?.id && userId && session.user.id === userId);

    useEffect(() => {
        if (!userId) {
            setCharacters([]);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);

        void (async () => {
            const [{ data: chars, error: charsError }, profileRes] = await Promise.all([
                supabase.from('characters').select('*').eq('user_id', userId).order('name', { ascending: true }),
                supabase.from('profiles').select('username').eq('id', userId).maybeSingle(),
            ]);

            if (cancelled) return;

            if (!charsError && chars) {
                setCharacters(chars as Character[]);
            } else {
                setCharacters([]);
            }

            setOwnerLabel(profileRes.data?.username?.trim() || null);
            setLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [userId, supabase]);

    const normalizedSearch = normalizeText(searchTerm);
    const filteredCharacters = useMemo(
        () => characters.filter((char) => normalizeText(char.name).includes(normalizedSearch)),
        [characters, normalizedSearch],
    );

    const totalPages = Math.ceil(filteredCharacters.length / CHARACTERS_PER_PAGE) || 1;
    const paginatedCharacters = filteredCharacters.slice(
        (currentPage - 1) * CHARACTERS_PER_PAGE,
        currentPage * CHARACTERS_PER_PAGE,
    );

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    if (!userId) {
        return (
            <div className="mx-auto max-w-lg p-8 text-center font-lora text-[#e5d9a5]">
                <p className="text-[#e7b0b0]">Некорректная ссылка.</p>
                <Link to="/" className="mt-4 inline-block text-[#c2a774] underline">
                    На главную
                </Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center font-lora text-[#c7bc98]">
                Загрузка…
            </div>
        );
    }

    return (
        <div className="mx-auto mt-10 max-w-[1440px] space-y-4 px-2 md:space-y-10 md:px-4">
            <motion.div
                className="flex flex-col gap-3 border-b border-[#c2a774]/70 pb-4 md:flex-row md:items-end md:justify-between"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                <div className="space-y-2">
                    <Link
                        to="/roleplay"
                        className="mb-1 inline-flex items-center gap-2 text-sm text-[#c2a774] hover:underline"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Ролевые
                    </Link>
                    <h1 className="flex flex-wrap items-center gap-2 font-garamond text-4xl text-[#e5d9a5] md:text-5xl">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#c2a77466] bg-[#1b261a] text-[#c2a774] shadow-[0_0_18px_#000]">
                            <Users className="h-5 w-5" />
                        </span>
                        Персонажи
                        {ownerLabel ? (
                            <span className="text-2xl font-normal text-[#c7bc98] md:text-3xl">
                                — {ownerLabel}
                            </span>
                        ) : null}
                    </h1>
                    <p className="max-w-2xl font-lora text-base leading-relaxed text-[#c7bc98]">
                        Карточки персонажей этого игрока. Редактирование доступно только владельцу.
                    </p>
                    {isOwnList ? (
                        <p className="font-lora text-sm text-[#c2a774]">
                            Это ваш список — полное управление в разделе{' '}
                            <Link to="/characters" className="underline underline-offset-2">
                                Персонажи
                            </Link>
                            .
                        </p>
                    ) : null}
                </div>
            </motion.div>

            <div className="flex w-full flex-col justify-between gap-3 md:gap-8">
                <div className="relative w-full">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#c7bc98]/50"
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
                        className="w-full rounded-xl border border-[#3a4a34] bg-[#0e1b12]/80 py-3 pl-10 pr-4 font-lora text-[#e5d9a5] placeholder:text-[#c7bc98]/50 transition focus:border-[#c2a774] focus:outline-none"
                    />
                </div>
            </div>

            <AnimatePresence mode="wait">
                {characters.length === 0 && !searchTerm ? (
                    <motion.div
                        key="empty"
                        className="mt-10 flex flex-col items-center justify-center gap-3 text-center font-lora text-[#e5d9a5]/80"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <p>У этого игрока пока нет персонажей в доступной вам выборке.</p>
                        <p className="text-xs text-[#c7bc98]">
                            Если вы ожидали увидеть карточки, проверьте политики Supabase для таблицы{' '}
                            <code className="text-[#c2a774]">characters</code>.
                        </p>
                    </motion.div>
                ) : null}

                {filteredCharacters.length === 0 && searchTerm ? (
                    <motion.div
                        key="no-results"
                        className="mt-8 text-center font-lora text-[#e5d9a5]/70"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        По запросу «{searchTerm}» ничего не найдено.
                    </motion.div>
                ) : null}

                {paginatedCharacters.length > 0 ? (
                    <motion.div
                        key="list"
                        className="flex flex-col gap-4"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.06 } },
                        }}
                    >
                        {paginatedCharacters.map((char) => (
                            <motion.div
                                key={char.id}
                                layout
                                variants={{
                                    hidden: { opacity: 0, x: -20, scale: 0.97 },
                                    visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.3 } },
                                }}
                            >
                                <CharacterCard character={char} readOnly />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {totalPages > 1 ? (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-6 font-lora text-[#e5d9a5]">
                    <button
                        type="button"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="min-h-11 min-w-11 rounded-xl border border-[#c2a774] px-3 py-2 text-lg hover:bg-[#3a4c3a] disabled:opacity-30"
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
                                className={`min-h-11 min-w-11 rounded-xl border font-bold transition ${
                                    isActive
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
                        className="min-h-11 min-w-11 rounded-xl border border-[#c2a774] px-3 py-2 text-lg hover:bg-[#3a4c3a] disabled:opacity-30"
                    >
                        ⪼
                    </button>
                </div>
            ) : null}
        </div>
    );
};
