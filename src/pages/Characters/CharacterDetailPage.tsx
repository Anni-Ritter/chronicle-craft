import { Link, useParams } from "react-router-dom";

import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import { useCallback, useMemo, useState } from "react";
import { useCharacterStore } from "../../store/useCharacterStore";
import { useRelationshipStore } from "../../store/useRelationshipStore";
import { CharacterGraph } from "../../features/relations/CharacterGraph";
import { CharacterRelationCreator } from "../../features/relations/CharacterRelationCreator";


export function CharacterDetailPage() {
    const { id } = useParams();
    const allCharacters = useCharacterStore((s) => s.characters);
    const relationships = useRelationshipStore((s) => s.relationships);
    const character = allCharacters.find((c) => c.id === id);
    const [activeTab, setActiveTab] = useState<'info' | 'graph'>('info');

    if (!character) {
        return (
            <div className="p-6">
                <h1 className="text-xl font-bold text-red-600">Персонаж не найден</h1>
                <Link to="/" className="text-indigo-600 underline mt-4 block">
                    ← Вернуться к списку
                </Link>
            </div>
        );
    }
    const radarData = character?.attributes ? [
        { attribute: 'Сила', value: character.attributes.strength },
        { attribute: 'Интеллект', value: character.attributes.intelligence },
        { attribute: 'Магия', value: character.attributes.magic },
        { attribute: 'Харизма', value: character.attributes.charisma },
        { attribute: 'Ловкость', value: character.attributes.dexterity },
        { attribute: 'Выносливость', value: character.attributes.endurance },
    ] : [];


    const relatedCharacters = useMemo(() => {
        return allCharacters.filter((c) =>
            relationships.some(
                (r) =>
                    (r.source_id === character?.id && r.target_id === c.id) ||
                    (r.target_id === character?.id && r.source_id === c.id) ||
                    c.id === character?.id
            )
        );
    }, [allCharacters, relationships, character?.id]);

    const relatedRelationships = useMemo(() => {
        return relationships.filter(
            (r) => r.source_id === character?.id || r.target_id === character?.id
        );
    }, [relationships, character?.id]);

    const handleSelectCharacter = useCallback(() => {
        if (activeTab !== 'info') {
            setActiveTab('info');
        }
    }, [activeTab]);

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex space-x-4 mb-6">
                <button
                    className={`px-4 py-2 rounded ${activeTab === 'info' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                    onClick={() => setActiveTab('info')}
                >
                    ℹ️ Информация
                </button>
                <button
                    className={`px-4 py-2 rounded ${activeTab === 'graph' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                    onClick={() => setActiveTab('graph')}
                >
                    🔗 Связи
                </button>
            </div>

            {activeTab === 'info' && (<div>
                {character?.name && (
                    <div className="flex justify-between items-center">
                        {character.avatar && (
                            <img
                                src={character.avatar}
                                alt={character.name}
                                className="w-[200px] h-[200px] rounded-full object-cover"
                            />
                        )}
                        <h1 className="text-3xl font-bold mb-2">{character.name}</h1>
                        <Link
                            to={`/character/edit/${character.id}`}
                            className=" bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm"
                        >
                            ✏️ Редактировать
                        </Link>
                    </div>
                )}
                {character?.bio && <p className="text-zinc-700">{character.bio}</p>}
                {character?.status && (
                    <p className="mt-4">
                        Статус: <span className="font-bold">{character.status}</span>
                    </p>
                )}
                {character?.species && (
                    <p className="mt-2">
                        Вид: <span className="font-bold">{character.species}</span>
                    </p>
                )}
                {character?.gender && (
                    <p className="mt-2">
                        Пол: <span className="font-bold">{character.gender}</span>
                    </p>
                )}
                {character?.origin && (
                    <p className="mt-2">
                        Первоначальное место:{" "}
                        <span className="font-bold">{character.origin.name}</span>
                    </p>
                )}
                {character?.location && (
                    <p className="mt-2">
                        Текущее место:{" "}
                        <span className="font-bold">{character.location.name}</span>
                    </p>
                )}
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-2">Атрибуты</h2>
                    <ul className="list-disc list-inside">
                        {character?.attributes ? (
                            <>
                                <li>Сила: {character.attributes.strength}</li>
                                <li>Интеллект: {character.attributes.intelligence}</li>
                                <li>Магия: {character.attributes.magic}</li>
                                <li>Харизма: {character.attributes.charisma}</li>
                                <li>Ловкость: {character.attributes.dexterity}</li>
                                <li>Выносливость: {character.attributes.endurance}</li>
                            </>
                        ) : (
                            <li className="text-zinc-500">Нет атрибутов</li>
                        )}
                    </ul>
                </div>
                <div className="mt-4 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="attribute" />
                            <PolarRadiusAxis angle={30} domain={[0, 12]} />
                            <Radar name="Атрибуты" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                {character?.episode && character.episode.length > 0 ? (
                    <>
                        <h2 className="text-xl font-semibold mt-6 mb-2">Эпизоды</h2>
                        <ul className="list-disc list-inside">
                            {character.episode.map((e, index) => (
                                <li key={index}>{e}</li>
                            ))}
                        </ul>
                    </>
                ) : (
                    <p className="text-zinc-500 mt-2">Нет эпизодов</p>
                )}
                {character?.extra && character.extra.length > 0 && (
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold mb-2">Дополнительные поля</h2>
                        <ul className="list-disc list-inside">
                            {character.extra.map((field) => (
                                <li key={field.id}>
                                    <span className="font-semibold">{field.key}:</span> {field.value}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            )}
            {activeTab === 'graph' && character && (
                <div>
                    <CharacterGraph
                        characters={relatedCharacters}
                        relationships={relatedRelationships}
                        onSelectCharacter={handleSelectCharacter}
                    />
                    <CharacterRelationCreator
                        allCharacters={allCharacters}
                        currentCharacter={character}
                    />
                </div>
            )}
            <Link to="/" className="inline-block mt-6 text-indigo-600 underline">
                ← Назад
            </Link>
        </div>
    );
}