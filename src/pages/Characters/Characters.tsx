import { useEffect, useState } from 'react';
import { CharacterCard } from '../../features/characters/CharacterCard';
import { CharacterForm } from '../../features/characters/CharacterForm';
import { useCharacterStore } from '../../store/useCharacterStore';
import { Modal } from '../../components/Modal';
import type { Character } from '../../types/character';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

function CharactersPage() {
    const session = useSession();
    const supabase = useSupabaseClient();
    const { characters, fetchCharacters, addCharacter, clearCharacters } = useCharacterStore();
    const [isModalOpen, setModalOpen] = useState(false);

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
    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold mb-4">📘 Персонажи</h2>
            <button
                onClick={() => setModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
            >
                ➕ Добавить персонажа
            </button>
            <div className="grid gap-4">
                {characters.map((char) => (
                    <CharacterCard key={char.id} character={char} />
                ))}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
                <CharacterForm
                    onFinish={() => setModalOpen(false)}
                    onSave={handleAdd}
                />
            </Modal>
        </div>
    );
}

export default CharactersPage;
