import { useParams, useNavigate } from "react-router-dom";

import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useCharacterStore } from "../../store/useCharacterStore";
import { CharacterForm } from "../../features/characters/CharacterForm";

export function CharacterEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { characters, updateCharacter } = useCharacterStore();
    const supabase = useSupabaseClient();
    const character = characters.find((c) => c.id === id);

    if (!character) {
        return (
            <div className="p-6">
                <h1 className="text-xl font-bold text-red-600">Персонаж не найден</h1>
            </div>
        );
    }

    const handleUpdate = async (updated: typeof character) => {
        await updateCharacter(updated, supabase);
        navigate(`/character/${id}`);
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold mb-4">Редактировать персонажа</h1>
                <button onClick={() => navigate(`/character/${id}`)} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">← Вернуться к персонажу</button>
            </div>
            <CharacterForm onFinish={() => { }} initialCharacter={character} onSave={handleUpdate} />
        </div>
    );
}
