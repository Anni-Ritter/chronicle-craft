import { Link, useParams } from "react-router-dom";
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCharacterStore } from "../../store/useCharacterStore";
import { useRelationshipStore } from "../../store/useRelationshipStore";
import { CharacterGraph } from "../../features/relations/CharacterGraph";
import { useChronicleStore } from "../../store/useChronicleStore";
import { BicepsFlexed, BookCopy, BrainCircuit, Dna, Dot, Earth, House, LibraryBig, Link as LinkIcon, Pencil, Pin, Scroll, ShieldUser, Smile, Sparkle, Sparkles, VenusAndMars, Zap } from "lucide-react";
import { Button } from "../../components/ChronicleButton";
import { Modal } from "../../components/Modal";
import { CharacterForm } from "../../features/characters/CharacterForm";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useDraftRelationshipStore } from "../../store/useDraftRelationshipStore";
import { formatEventDate } from "../../lib/formatEventDate";

export const CharacterDetailPage = () => {
    const { id } = useParams();
    const allCharacters = useCharacterStore((s) => s.characters);
    const relationships = useRelationshipStore((s) => s.relationships);
    const chronicles = useChronicleStore((s) => s.chronicles);
    const character = allCharacters.find((c) => c.id === id);
    const [activeTab, setActiveTab] = useState<'info' | 'graph'>('info');
    const [isEditing, setIsEditing] = useState(false);
    const { updateCharacter } = useCharacterStore();
    const supabase = useSupabaseClient();
    const { setDraftRelationships } = useDraftRelationshipStore();

    if (!character) {
        return (
            <div className="p-6 text-center text-[#e5d9a5]">
                <h1 className="text-2xl font-bold text-red-400">Персонаж не найден</h1>
                <Link to="/" className="text-[#c2a774] underline mt-4 inline-block">
                    ← Вернуться к списку
                </Link>
            </div>
        );
    }

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    useEffect(() => {
        if (character) {
            const filtered = relationships.filter(
                (r) => r.source_id === character.id || r.target_id === character.id
            );
            setDraftRelationships(filtered);
        }
    }, [character, relationships]);

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

    const linkedChronicles = useMemo(() => {
        return chronicles.filter((c) => c.linked_characters.includes(character.id));
    }, [chronicles, character.id]);

    const handleSelectCharacter = useCallback(() => {
        if (activeTab !== 'info') {
            setActiveTab('info');
        }
    }, [activeTab]);

    const otherCharacters = useMemo(() => {
        return allCharacters;
    }, [allCharacters, character.id]);

    return (
        <div className="text-[#e5d9a5] font-lora mt-6 md:mt-8 px-2">
            <div className="flex flex-col">
                <div className="max-sm:text-sm text-lg text-[#c7bc98] flex flex-row items-center mb-6 md:mb-8">
                    <Link to="/" className="text-[#c2a774] hover:underline">Главная</Link>
                    <span className="mx-2"><Dot /></span>
                    <Link to="/characters" className="text-[#c2a774] hover:underline">Персонажи</Link>
                    <span className="mx-2"><Dot /></span>
                    <span className="text-[#e5d9a5] font-semibold">{character.name}</span>
                </div>

                <div className="flex gap-4 mb-6">
                    <Button
                        onClick={() => setActiveTab('info')}
                        icon={<LibraryBig />}
                        className={`font-semibold ${activeTab === 'info' ? 'bg-[#c2a774]' : 'bg-transparent text-[#c2a774] hover:text-[#0E1B12]'}`}
                    >
                        Информация
                    </Button>
                    <Button
                        onClick={() => setActiveTab('graph')}
                        icon={<LinkIcon />}
                        className={`font-semibold ${activeTab === 'graph' ? 'bg-[#c2a774]' : 'bg-transparent text-[#c2a774] hover:text-[#0E1B12]'}`}
                    >
                        Связи
                    </Button>
                </div>
            </div>

            {activeTab === 'info' && (
                <div className="mt-8">
                    <div className="flex flex-row md:items-start w-full justify-between">
                        <div className="flex max-sm:flex-col flex-row items-start gap-8 w-full">
                            <div className="flex flex-col gap-4 justify-center w-full items-center md:w-fit">
                                {character.avatar && (
                                    <img src={character.avatar} alt={character.name} className="max-sm:min-w-[250px] max-sm:max-w-[250px] max-sm:max-h-[250px] max-sm:min-h-[250px] max-w-[150px] max-h-[150px] min-w-[150px] min-h-[150px] rounded-full object-cover border border-[#c2a774]" />
                                )}
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="hidden max-sm:flex flex-row items-center gap-2 text-[#c2a774] hover:underline"
                                >
                                    <Pencil size={16} /> Редактировать
                                </button>
                            </div>
                            <div>
                                <h1 className="text-[32px] font-bold text-[#D6C5A2] mb-2">{character.name}</h1>

                                <div className="flex flex-row items-center gap-1">
                                    <Sparkles size={16} className="text-[#C2A774]" />
                                    <span className="font-semibold text-[#C2A774]">Возраст:</span> {character.age}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 mt-2 gap-4 max-sm:text-sm text-base">
                                    {character.status &&
                                        <div className="flex flex-row items-center gap-1">
                                            <Pin size={16} className="text-[#C2A774]" />
                                            <span className="font-semibold text-[#C2A774]">Статус:</span>
                                            {character.status}
                                        </div>
                                    }

                                    {character.gender &&
                                        <div className="flex flex-row items-center gap-1">
                                            <VenusAndMars size={16} className="text-[#C2A774]" />
                                            <span className="font-semibold text-[#C2A774]">Пол:</span>
                                            {character.gender}
                                        </div>
                                    }
                                    {character.origin?.name &&
                                        <div className="flex flex-row items-center gap-1">
                                            <Earth size={16} className="text-[#C2A774]" />
                                            <span className="font-semibold text-[#C2A774]">Родина:</span>
                                            {character.origin.name}
                                        </div>
                                    }
                                    {character.location?.name &&
                                        <div className="flex flex-row items-center gap-1">
                                            <House size={16} className="text-[#C2A774]" />
                                            <span className="font-semibold text-[#C2A774]">Жилье:</span>
                                            {character.location.name}
                                        </div>
                                    }
                                    {character.species &&
                                        <div className="flex items-start gap-1">
                                            <Dna size={16} className="text-[#C2A774] mt-1" />
                                            <div>
                                                <span className="font-semibold text-[#C2A774]">Вид:</span>
                                                <ul className="ml-1 list-disc list-inside text-[#e5d9a5]">
                                                    {character.species.split(',').map((part, index) => (
                                                        <li key={index}>{part.trim()}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={() => setIsEditing(true)}
                            icon={<Pencil size={20} />}
                            className="max-sm:hidden text-base"
                        >
                            Редактировать
                        </Button>
                    </div>

                    {character.bio && (
                        <section className="bg-[#223120] border border-[#c2a774] rounded-xl p-6 mt-8 shadow-md">
                            <h2 className="text-xl md:text-2xl font-bold text-[#e5d9a5] flex items-center gap-2 mb-4">
                                <BookCopy size={20} /> Биография
                            </h2>
                            <div dangerouslySetInnerHTML={{ __html: character.bio }} className="whitespace-pre-line text-[#c7bc98] text-[17px] leading-relaxed text-justify font-lora">
                            </div>
                        </section>
                    )}

                    <div className="flex flex-col w-full md:items-center">
                        <h2 className="text-xl md:text-2xl w-full flex justify-center mt-4 md:mt-8 mb-8 md:mb-[32px] font-bold pt-8 border-t border-[#c2a774] pb-1">
                            <span className="flex flex-row items-center gap-2">
                                <Sparkle />
                                Атрибуты
                            </span>
                        </h2>
                        <div className="bg-[#223120] border border-[#c2a774] rounded-xl p-4 mb-6 shadow-md">
                            <ul className="grid grid-cols-2 md:grid-cols-3 gap-1 text-lg text-center text-[#e5d9a5]">
                                <li className="flex flex-row items-center gap-1 justify-center">
                                    <span className="font-semibold flex flex-row items-center gap-1 text-[#C2A774]">
                                        <Smile size={16} /> Харизма:
                                    </span>
                                    {character.attributes.charisma}
                                </li>
                                <li className="flex flex-row items-center gap-1 justify-center">
                                    <span className="font-semibold flex flex-row items-center gap-1 text-[#C2A774]">
                                        <BicepsFlexed size={16} />Сила:
                                    </span>
                                    {character.attributes.strength}
                                </li>
                                <li className="flex flex-row items-center gap-1 justify-center">
                                    <span className="font-semibold flex flex-row items-center gap-1 text-[#C2A774]">
                                        <Sparkles size={16} /> Магия:
                                    </span>
                                    {character.attributes.magic}
                                </li>
                                <li className="flex flex-row items-center gap-1 justify-center">
                                    <span className="font-semibold flex flex-row items-center gap-1 text-[#C2A774]">
                                        <BrainCircuit size={16} /> Интеллект:
                                    </span>
                                    {character.attributes.intelligence}
                                </li>
                                <li className="flex flex-row items-center gap-1 justify-center">
                                    <span className="font-semibold flex flex-row items-center gap-1 text-[#C2A774]">
                                        <Zap size={16} />Ловкость:
                                    </span>
                                    {character.attributes.dexterity}
                                </li>
                                <li className="flex flex-row items-center gap-1 justify-center">
                                    <span className="font-semibold flex flex-row items-center gap-1 text-[#C2A774]">
                                        <ShieldUser size={16} />Выносливость:
                                    </span>
                                    {character.attributes.endurance}
                                </li>
                            </ul>
                        </div>

                        <div className="h-[250px] md:h-[450px] w-full mt-4 text-[10px] md:text-[16px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#c2a77466" />
                                    <PolarAngleAxis dataKey="attribute" stroke="#e5d9a5" />
                                    <PolarRadiusAxis angle={30} domain={[0, 12]} stroke="#c2a77466" />
                                    <Radar name="Атрибуты" dataKey="value" stroke="#c2a774" fill="#c2a774" fillOpacity={0.3} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {linkedChronicles.length > 0 && (
                        <div className="flex flex-col w-full md:items-center">
                            <h2 className="text-xl md:text-2xl w-full flex justify-center md:mt-8 mb-8 md:mb-[32px] font-bold pt-8 border-t border-[#c2a774] pb-1">
                                <span className="flex flex-row items-center gap-2">
                                    <BookCopy />
                                    Хроники с участием персонажа
                                </span>
                            </h2>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                {linkedChronicles.map((chronicle) => {
                                    const moodEmoji = chronicle.mood?.split(' ')[0] || '';
                                    return (
                                        <li
                                            key={chronicle.id}
                                            className="bg-[#223120] border border-[#c2a774] rounded-xl p-4 shadow-md hover:shadow-lg transition"
                                        >
                                            <Link
                                                to={`/chronicles/${chronicle.id}`}
                                                className="text-[#e5d9a5] text-[17px] font-semibold flex items-start gap-2 hover:underline"
                                            >
                                                <span className="text-xl leading-none">{moodEmoji}</span>
                                                <span>
                                                    {chronicle.title}{' '}
                                                    <span className="text-[#c7bc98] font-normal italic text-sm">
                                                        ({formatEventDate(chronicle.event_date)})
                                                    </span>
                                                </span>
                                            </Link>
                                            <div
                                                dangerouslySetInnerHTML={{ __html: chronicle.content }}
                                                className="mt-2 text-sm text-[#c7bc98] italic line-clamp-3"
                                            />
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {character?.extra && character?.extra?.length > 0 && (
                        <section className="bg-[#223120] rounded-xl p-4 border border-[#c2a774] mt-12 shadow-md space-y-2">
                            <h2 className="text-lg font-semibold text-[#e5d9a5] flex flex-row gap-2 items-center"><Scroll size={20} /> Дополнительно</h2>
                            <ul className="list-disc list-inside text-[#c7bc98]">
                                {character.extra.map((field) => (
                                    <li key={field.id}>
                                        <span className="font-semibold text-[#e5d9a5]">{field.key}:</span> {field.value}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            )}

            {activeTab === 'graph' && character && (
                <div className="mt-6">
                    <CharacterGraph
                        characters={relatedCharacters}
                        relationships={relatedRelationships}
                        onSelectCharacter={handleSelectCharacter}
                        allCharacters={otherCharacters}
                    />
                </div>
            )}

            <Modal isOpen={isEditing} onClose={() => setIsEditing(false)}>
                <CharacterForm
                    initialCharacter={character}
                    onFinish={() => setIsEditing(false)}
                    onSave={(char) => updateCharacter(char, supabase)}
                />
            </Modal>
        </div>
    );
}