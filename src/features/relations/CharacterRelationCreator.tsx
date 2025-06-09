import { useState } from 'react';
import { useRelationshipStore } from '../../store/useRelationshipStore';
import type { Relationship } from '../../types/relationshipType';
import type { Character } from '../../types/character';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

interface CharacterRelationCreatorProps {
    allCharacters: Character[];
    currentCharacter: Character;
}

export const CharacterRelationCreator: React.FC<CharacterRelationCreatorProps> = ({ allCharacters, currentCharacter }) => {
    const [search, setSearch] = useState("");
    const [targetId, setTargetId] = useState<string | null>(null);
    const [label, setLabel] = useState('');
    const [color, setColor] = useState('#4ade80');

    const { addRelationship } = useRelationshipStore();
    const session = useSession();
    const supabase = useSupabaseClient();

    const availableTargets = allCharacters.filter(
        (char) => char.id !== currentCharacter.id && char.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = async () => {
        if (!targetId || !session?.user) return;
        const relationship: Relationship = {
            id: crypto.randomUUID(),
            source_id: currentCharacter.id,
            target_id: targetId,
            type: label.trim(),
            color,
            created_at: new Date().toISOString(),
        };
        await addRelationship(relationship, supabase);
        setSearch("");
        setTargetId(null);
    };

    return (
        <div className="mt-6 border-t pt-20">
            <input
                type="text"
                placeholder="Поиск персонажа..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border px-3 py-1 rounded w-full mb-2"
            />
            <div className="mb-2 max-h-40 overflow-y-auto border rounded">
                {availableTargets.map((char) => (
                    <div
                        key={char.id}
                        onClick={() => setTargetId(char.id)}
                        className={`cursor-pointer px-3 py-1 hover:bg-indigo-100 ${targetId === char.id ? "bg-indigo-200 font-semibold" : ""
                            }`}
                    >
                        {char.name}
                    </div>
                ))}
                {availableTargets.length === 0 && (
                    <div className="px-3 py-2 text-zinc-400 italic">Ничего не найдено</div>
                )}
            </div>
            <input
                type="text"
                placeholder="Название связи"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="border px-3 py-1 rounded w-full"
            />

            <div className="flex items-center gap-2 my-5">
                <label className="text-sm text-gray-600">Цвет:</label>
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 p-0 border cursor-pointer"
                />
            </div>
            <button
                onClick={handleAdd}
                disabled={!targetId}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 w-full disabled:opacity-50"
            >
                Создать связь
            </button>
        </div>
    );
};