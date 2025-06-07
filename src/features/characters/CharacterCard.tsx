import { useNavigate } from "react-router-dom";
import type { Character } from "../../types/character";
import { useCharacterStore } from "../../store/useCharacterStore";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

interface CharacterCardProps {
    character: Character;
}

export const CharacterCard = ({ character }: CharacterCardProps) => {
    const navigate = useNavigate();
    const removeCharacter = useCharacterStore((s) => s.removeCharacter);
    const supabase = useSupabaseClient();
    const handleDelete = async () => {
        if (confirm(`Удалить персонажа ${character.name}?`)) {
            await removeCharacter(character.id, supabase);
        }
    };
    return (
        <div
            onClick={() => navigate(`/character/${character.id}`)}
            className="bg-white shadow overflow-hidden sm:rounded-lg flex flex-row justify-between px-4 cursor-pointer hover:bg-gray-100"
        >
            <div className="px-4 py-5 sm:px-6">
                {character.avatar && (
                    <img
                        src={character.avatar}
                        alt={character.name}
                        className="w-16 h-16 rounded-full object-cover"
                    />
                )}
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {character.name}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {character.bio}
                </p>
            </div>
            <div className="flex flex-col gap-2 items-end py-4">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/character/edit/${character.id}`);
                    }}
                    className="text-blue-500 hover:text-blue-700"
                    title="Редактировать"
                >
                    ✏️
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                    }}
                    className="text-red-500 hover:text-red-700"
                    title="Удалить"
                >
                    ❌
                </button>
            </div>
        </div>
    );
};