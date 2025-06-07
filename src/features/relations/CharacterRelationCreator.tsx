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
    const [type, setType] = useState<Relationship["type"]>("друг");

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
            type,
            created_at: new Date().toISOString(),
        };
        await addRelationship(relationship, supabase);
        setSearch("");
        setTargetId(null);
    };

    return (
        <div className="mt-6 border-t pt-4">
            <h2 className="text-lg font-semibold mb-2">➕ Добавить связь</h2>
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
            <select
                value={type}
                onChange={(e) => setType(e.target.value as Relationship["type"])}
                className="border px-3 py-1 rounded w-full mb-2"
            >
                <option value="друг">🤝 Друг</option>
                <option value="возлюбленные">❤️ Возлюбленные</option>
                <option value="враг">⚔️ Враг</option>
                <option value="родство">👪 Родство</option>
                <option value="союз">🛡️ Союз</option>
                <option value="бывший">💔 Бывший</option>
                <option value="ученик">🎓 Ученик</option>
                <option value="загадка">❓ Загадка</option>
            </select>
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