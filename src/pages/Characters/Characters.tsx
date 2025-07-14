import { useEffect, useState } from 'react';
import { CharacterCard } from '../../features/characters/CharacterCard';
import { CharacterForm } from '../../features/characters/CharacterForm';
import { useCharacterStore } from '../../store/useCharacterStore';
import { Modal } from '../../components/Modal';
import type { Character } from '../../types/character';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { CirclePlus, Users } from 'lucide-react';
import { Button } from '../../components/ChronicleButton';
import { normalizeText } from '../../lib/NormalizeText';


const CHARACTERS_PER_PAGE = 10;

function CharactersPage() {
    const session = useSession();
    const supabase = useSupabaseClient();
    const { characters, fetchCharacters, addCharacter, clearCharacters } = useCharacterStore();
    const [isModalOpen, setModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (session?.user?.id) {
            fetchCharacters(session.user.id, supabase);
        }
        else {
            clearCharacters();
        }
    }, [session]);

    const handleAdd = async (char: Character) => {
        if (session?.user?.id) {
            await addCharacter(char, supabase);
            setModalOpen(false);
        }
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
        <div className='max-w-[1440px] mx-auto mt-10 px-2 md:px-4 space-y-10'>
            <div className="flex justify-between items-center border-b border-[#c2a774] pb-4">
                <h1 className="text-3xl flex flex-row gap-2 items-center font-garamond text-[#e5d9a5]"><Users /> Персонажи</h1>
                <Button onClick={() => setModalOpen(true)} icon={<CirclePlus size={18} />} className='max-sm:gap-0'><span className='hidden md:block'>Добавить</span></Button>
            </div>
            <div className="relative w-full">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0e1b12]/50 w-5 h-5 pointer-events-none"
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
                    placeholder="Поиск..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="pl-10 pr-4 py-3 rounded-lg w-full bg-[#D6C5A2] text-[#0E1B12] border border-[#0E1B12] placeholder:text-[18px] placeholder:text-[#0e1b12]/50"
                />
            </div>
            <div className="flex flex-col gap-4">
                {paginatedCharacters.map((char) => (
                    <CharacterCard key={char.id} character={char} />
                ))}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-6 font-lora text-[#e5d9a5]">
                    <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded border border-[#c2a774] hover:bg-[#3a4c3a] disabled:opacity-30"
                    >
                        ⪻
                    </button>
                    {Array.from({ length: totalPages }).map((_, index) => {
                        const isActive = currentPage === index + 1;
                        return (
                            <button
                                key={index}
                                onClick={() => goToPage(index + 1)}
                                className={`px-3 py-1 rounded border font-bold transition ${isActive
                                    ? 'bg-[#c2a774] text-[#2D422B] shadow-md'
                                    : 'border-[#c2a774] hover:bg-[#3a4c3a]'
                                    }`}
                            >
                                {index + 1}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded border border-[#c2a774] hover:bg-[#3a4c3a] disabled:opacity-30"
                    >
                        ⪼
                    </button>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
                <CharacterForm onFinish={() => setModalOpen(false)} onSave={handleAdd} />
            </Modal>
        </div>
    );
}

export default CharactersPage;
