import { Link, useParams } from "react-router-dom";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer
} from 'recharts';
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCharacterStore } from "../../store/useCharacterStore";
import { useRelationshipStore } from "../../store/useRelationshipStore";
import { CharacterGraph } from "../../features/relations/CharacterGraph";
import { useChronicleStore } from "../../store/useChronicleStore";
import {
    BicepsFlexed,
    BookCopy,
    BrainCircuit,
    Dna,
    Dot,
    Earth,
    House,
    LibraryBig,
    Link as LinkIcon,
    Pencil,
    Pin,
    Scroll,
    ShieldUser,
    Smile,
    Sparkle,
    Sparkles,
    VenusAndMars,
    Zap
} from "lucide-react";
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
    const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);
    const { updateCharacter } = useCharacterStore();
    const supabase = useSupabaseClient();
    const { setDraftRelationships } = useDraftRelationshipStore();

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
    }, [character, relationships, setDraftRelationships]);

    if (!character) {
        return (
            <div className="p-8 text-center text-[#e5d9a5] font-lora">
                <h1 className="text-2xl font-bold text-red-400 mb-2">Персонаж не найден</h1>
                <Link
                    to="/"
                    className="text-[#c2a774] underline mt-2 inline-block"
                >
                    ← Вернуться к списку
                </Link>
            </div>
        );
    }

    const radarData = character.attributes ? [
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
                    (r.source_id === character.id && r.target_id === c.id) ||
                    (r.target_id === character.id && r.source_id === c.id) ||
                    c.id === character.id
            )
        );
    }, [allCharacters, relationships, character.id]);

    const relatedRelationships = useMemo(
        () => relationships.filter(
            (r) => r.source_id === character.id || r.target_id === character.id
        ),
        [relationships, character.id]
    );

    const linkedChronicles = useMemo(
        () => chronicles.filter((c) => c.linked_characters.includes(character.id)),
        [chronicles, character.id]
    );

    const handleSelectCharacter = useCallback(() => {
        if (activeTab !== 'info') {
            setActiveTab('info');
        }
    }, [activeTab]);

    const otherCharacters = useMemo(() => allCharacters, [allCharacters]);

    return (
        <div className="text-[#e5d9a5] font-lora mt-6 md:mt-8 px-2">
            <div className="space-y-8">
                <div className="space-y-4">
                    <nav className="max-sm:text-sm text-lg text-[#c7bc98] flex flex-wrap items-center gap-1 mb-2">
                        <Link to="/" className="text-[#c2a774] hover:underline">
                            Главная
                        </Link>
                        <span className="mx-1">
                            <Dot className="w-4 h-4" />
                        </span>
                        <Link to="/characters" className="text-[#c2a774] hover:underline">
                            Персонажи
                        </Link>
                        <span className="mx-1">
                            <Dot className="w-4 h-4" />
                        </span>
                        <span className="text-[#e5d9a5] font-semibold line-clamp-1">
                            {character.name}
                        </span>
                    </nav>

                    <div className="inline-flex rounded-full border border-[#c2a77444] bg-[#0e1b12] p-1 gap-1 max-sm:w-full">
                        <Button
                            onClick={() => setActiveTab('info')}
                            icon={<LibraryBig className="w-4 h-4" />}
                            className={`!px-4 !py-1.5 text-sm rounded-full transition max-sm:flex-1
                                ${activeTab === 'info'
                                    ? 'bg-[#c2a774] text-[#0E1B12] shadow-[0_0_12px_#c2a77466]'
                                    : 'bg-transparent text-[#c2a774] hover:bg-[#2b3a29]'}`}
                        >
                            Информация
                        </Button>
                        <Button
                            onClick={() => setActiveTab('graph')}
                            icon={<LinkIcon className="w-4 h-4" />}
                            className={`!px-4 !py-1.5 text-sm rounded-full transition max-sm:flex-1
                                ${activeTab === 'graph'
                                    ? 'bg-[#c2a774] text-[#0E1B12] shadow-[0_0_12px_#c2a77466]'
                                    : 'bg-transparent text-[#c2a774] hover:bg-[#2b3a29]'}`}
                        >
                            Связи
                        </Button>
                    </div>
                </div>

                {activeTab === 'info' && (
                    <div className="space-y-10 animate-fade-in-down">
                        <section className=" py-6 sm:py-8 flex flex-col gap-6">
                            <div className="flex flex-col md:flex-row md:items-start gap-6">
                                <div className="flex flex-col items-center md:items-start gap-4 shrink-0">
                                    {character.avatar && (
                                        <button
                                            type="button"
                                            onClick={() => setIsAvatarPreviewOpen(true)}
                                            className="relative group rounded-full focus:outline-none focus:ring-2 focus:ring-[#c2a77488]"
                                        >
                                            <img
                                                src={character.avatar}
                                                alt={character.name}
                                                className="
                                                    max-sm:w-[220px] max-sm:h-[220px]
                                                    w-[160px] h-[160px]
                                                    rounded-full object-cover
                                                    border border-[#c2a774] shadow-lg
                                                "
                                            />
                                            <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-xs text-[#f5e9c6]">
                                                Нажмите, чтобы увеличить
                                            </span>
                                        </button>
                                    )}
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h1 className="text-[30px] sm:text-[34px] font-bold text-[#D6C5A2] leading-snug">
                                                {character.name}
                                            </h1>
                                            {character.status && (
                                                <p className="mt-1 flex items-center gap-2 text-sm text-[#c7bc98]">
                                                    <Pin size={16} className="text-[#C2A774]" />
                                                    <span className="font-semibold text-[#C2A774]">
                                                        Статус:
                                                    </span>
                                                    <span>{character.status}</span>
                                                </p>
                                            )}
                                        </div>

                                        <Button
                                            onClick={() => setIsEditing(true)}
                                            icon={<Pencil size={18} />}
                                            className="max-md:hidden text-sm shrink-0"
                                        >
                                            Редактировать
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm sm:text-base">
                                        {character.age && (
                                            <div className="flex items-center gap-2">
                                                <Sparkles size={18} className="text-[#C2A774]" />
                                                <span className="font-semibold text-[#C2A774]">
                                                    Возраст:
                                                </span>
                                                <span>{character.age ?? '—'}</span>
                                            </div>
                                        )}

                                        {character.gender && (
                                            <div className="flex items-center gap-2">
                                                <VenusAndMars
                                                    size={18}
                                                    className="text-[#C2A774]"
                                                />
                                                <span className="font-semibold text-[#C2A774]">
                                                    Пол:
                                                </span>
                                                <span>{character.gender}</span>
                                            </div>
                                        )}

                                        {character.origin?.name && (
                                            <div className="flex items-center gap-2">
                                                <Earth size={18} className="text-[#C2A774]" />
                                                <span className="font-semibold text-[#C2A774]">
                                                    Родина:
                                                </span>
                                                <span>{character.origin.name}</span>
                                            </div>
                                        )}

                                        {character.location?.name && (
                                            <div className="flex items-center gap-2">
                                                <House size={18} className="text-[#C2A774]" />
                                                <span className="font-semibold text-[#C2A774]">
                                                    Жилье:
                                                </span>
                                                <span>{character.location.name}</span>
                                            </div>
                                        )}

                                        {character.species && (
                                            <div className="flex items-start gap-2 md:col-span-2">
                                                <Dna
                                                    size={18}
                                                    className="text-[#C2A774] mt-1 shrink-0"
                                                />
                                                <div>
                                                    <span className="font-semibold text-[#C2A774]">
                                                        Вид:
                                                    </span>
                                                    <ul className="ml-1 list-disc list-inside text-[#e5d9a5]">
                                                        {character.species
                                                            .split(',')
                                                            .map((part, idx) => (
                                                                <li key={idx}>{part.trim()}</li>
                                                            ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {character.bio && (
                            <section className="bg-[#141f16]/95 border border-[#c2a774] rounded-2xl p-5 sm:p-6 shadow-md space-y-3">
                                <h2 className="text-xl md:text-2xl font-bold text-[#e5d9a5] flex items-center gap-2">
                                    <BookCopy size={20} /> Биография
                                </h2>
                                <div
                                    dangerouslySetInnerHTML={{ __html: character.bio }}
                                    className="whitespace-pre-line text-[#c7bc98] text-[15px] sm:text-[17px] leading-relaxed text-justify font-lora"
                                />
                            </section>
                        )}

                        {character.attributes && (
                            <section className="space-y-6 border-t border-[#c2a77455] pt-6">
                                <h2 className="text-xl md:text-2xl w-full flex justify-center mt-4 md:mt-8 mb-8 md:mb-[32px] font-bold pt-8 border-t border-[#c2a774] pb-1">
                                    <span className="flex flex-row items-center gap-2">
                                        <Sparkle />
                                        Атрибуты
                                    </span>
                                </h2>
                                <div className="bg-[#141f16]/95 w-fit mx-auto border border-[#c2a774] rounded-xl p-4 mb-6 shadow-md">
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
                            </section>
                        )}

                        {linkedChronicles.length > 0 && (
                            <section className="space-y-5 border-t border-[#c2a77455] pt-6">
                                <h2 className="text-xl md:text-2xl font-bold flex justify-center">
                                    <span className="inline-flex items-center gap-2">
                                        <BookCopy />
                                        Хроники с участием персонажа
                                    </span>
                                </h2>

                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                                    {linkedChronicles.map((chronicle) => {
                                        const moodEmoji = chronicle.mood?.split(' ')[0] || '';
                                        return (
                                            <li
                                                key={chronicle.id}
                                                className="bg-[#141f16]/95 border border-[#c2a774] rounded-2xl p-4 shadow-md hover:shadow-[0_0_18px_#c2a77455] transition"
                                            >
                                                <Link
                                                    to={`/chronicles/${chronicle.id}`}
                                                    className="text-[#e5d9a5] text-[16px] sm:text-[17px] font-semibold flex items-start gap-2 hover:underline"
                                                >
                                                    <span className="text-xl leading-none">
                                                        {moodEmoji}
                                                    </span>
                                                    <span>
                                                        {chronicle.title}{' '}
                                                        <span className="text-[#c7bc98] font-normal italic text-xs sm:text-sm">
                                                            ({formatEventDate(chronicle.event_date)})
                                                        </span>
                                                    </span>
                                                </Link>
                                                <div
                                                    dangerouslySetInnerHTML={{
                                                        __html: chronicle.content,
                                                    }}
                                                    className="mt-2 text-xs sm:text-sm text-[#c7bc98] italic line-clamp-3"
                                                />
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        )}

                        {character.extra && character.extra.length > 0 && (
                            <section className="bg-[#141f16]/95 rounded-2xl p-4 sm:p-5 border border-[#c2a774] shadow-md space-y-2">
                                <h2 className="text-lg sm:text-xl font-semibold text-[#e5d9a5] flex items-center gap-2">
                                    <Scroll size={20} /> Дополнительно
                                </h2>
                                <ul className="list-disc list-inside text-[#c7bc98] text-sm sm:text-base">
                                    {character.extra.map((field) => (
                                        <li key={field.id}>
                                            <span className="font-semibold text-[#e5d9a5]">
                                                {field.key}:
                                            </span>{' '}
                                            {field.value}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>
                )}

                {activeTab === 'graph' && (
                    <CharacterGraph
                        characters={relatedCharacters}
                        relationships={relatedRelationships}
                        onSelectCharacter={handleSelectCharacter}
                        allCharacters={otherCharacters}
                    />
                )}
            </div>

            <Modal isOpen={isEditing} onClose={() => setIsEditing(false)}>
                <CharacterForm
                    initialCharacter={character}
                    onFinish={() => setIsEditing(false)}
                    onSave={(char) => updateCharacter(char, supabase)}
                />
            </Modal>

            <Modal
                isOpen={isAvatarPreviewOpen}
                onClose={() => setIsAvatarPreviewOpen(false)}
            >
                <img
                    src={character.avatar}
                    alt={character.name}
                    className="max-h-[80vh] w-auto rounded-2xl border border-[#c2a774] shadow-xl mx-auto"
                />
            </Modal>
        </div>
    );
};
