import { Link, useNavigate, useParams } from "react-router-dom";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer
} from 'recharts';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useCharacterStore } from "../../store/useCharacterStore";
import { useRelationshipStore } from "../../store/useRelationshipStore";
import { CharacterGraph } from "../../features/relations/CharacterGraph";
import { useChronicleStore } from "../../store/useChronicleStore";
import {
    ArrowLeft,
    BicepsFlexed,
    BookCopy,
    BrainCircuit,
    Dna,
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
import { CharacterEmotionsManager } from "../../features/characters/CharacterEmotionsManager";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useDraftRelationshipStore } from "../../store/useDraftRelationshipStore";
import { formatEventDate } from "../../lib/formatEventDate";
import { motion } from "framer-motion";
import type { Character } from "../../types/character";

export const CharacterDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const allCharacters = useCharacterStore((s) => s.characters);
    const relationships = useRelationshipStore((s) => s.relationships);
    const chronicles = useChronicleStore((s) => s.chronicles);
    const characterFromStore = allCharacters.find((c) => c.id === id);
    const [remoteCharacter, setRemoteCharacter] = useState<Character | null>(null);
    const [remoteFetchDone, setRemoteFetchDone] = useState(false);
    const character = characterFromStore ?? remoteCharacter;
    const [activeTab, setActiveTab] = useState<'info' | 'graph'>('info');
    const [isEditing, setIsEditing] = useState(false);
    const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);
    const { updateCharacter } = useCharacterStore();
    const supabase = useSupabaseClient();
    const session = useSession();
    const { setDraftRelationships } = useDraftRelationshipStore();
    const isOwner = !!(session?.user?.id && character?.user_id === session.user.id);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    useEffect(() => {
        if (!id) {
            setRemoteCharacter(null);
            setRemoteFetchDone(true);
            return;
        }
        if (characterFromStore) {
            setRemoteCharacter(null);
            setRemoteFetchDone(true);
            return;
        }

        setRemoteFetchDone(false);
        let cancelled = false;
        void supabase
            .from("characters")
            .select("*")
            .eq("id", id)
            .maybeSingle()
            .then(({ data, error }) => {
                if (cancelled) return;
                if (data && !error) setRemoteCharacter(data as Character);
                else setRemoteCharacter(null);
                setRemoteFetchDone(true);
            });
        return () => {
            cancelled = true;
        };
    }, [id, characterFromStore, supabase]);

    useEffect(() => {
        if (!character || !session?.user?.id) return;
        if (character.user_id !== session.user.id) return;
        const filtered = relationships.filter(
            (r) => r.source_id === character.id || r.target_id === character.id
        );
        setDraftRelationships(filtered);
    }, [character, relationships, setDraftRelationships, session?.user?.id]);

    const characterId = character?.id ?? "";

    const radarData = character?.attributes ? [
        { attribute: 'Сила', value: character.attributes.strength },
        { attribute: 'Интеллект', value: character.attributes.intelligence },
        { attribute: 'Магия', value: character.attributes.magic },
        { attribute: 'Харизма', value: character.attributes.charisma },
        { attribute: 'Ловкость', value: character.attributes.dexterity },
        { attribute: 'Выносливость', value: character.attributes.endurance },
    ] : [];

    const relatedCharacters = useMemo(() => {
        if (!character) return [];
        return allCharacters.filter((c) =>
            relationships.some(
                (r) =>
                    (r.source_id === characterId && r.target_id === c.id) ||
                    (r.target_id === characterId && r.source_id === c.id) ||
                    c.id === characterId
            )
        );
    }, [allCharacters, relationships, character, characterId]);

    const relatedRelationships = useMemo(
        () => {
            if (!character) return [];
            return relationships.filter(
                (r) => r.source_id === characterId || r.target_id === characterId
            );
        },
        [relationships, character, characterId]
    );

    const linkedChronicles = useMemo(
        () => chronicles.filter((c) => c.linked_characters.includes(characterId)),
        [chronicles, characterId]
    );

    const handleSelectCharacter = useCallback(() => {
        if (activeTab !== 'info') {
            setActiveTab('info');
        }
    }, [activeTab]);

    const otherCharacters = useMemo(() => allCharacters, [allCharacters]);

    if (!character) {
        if (!remoteFetchDone) {
            return (
                <div className="flex min-h-[40vh] items-center justify-center font-lora text-[#c7bc98]">
                    Загрузка…
                </div>
            );
        }
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

    return (
        <div className="max-w-[1440px] mx-auto px-2 md:px-4 pt-6 md:pt-10 pb-16 font-lora text-[#e5d9a5] overflow-x-hidden">
            <div className="space-y-8">
                <div className="space-y-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="mb-1 inline-flex items-center gap-2 rounded-lg border border-transparent px-1 py-1.5 text-sm text-[#c2a774] transition hover:border-[#c2a77444] hover:bg-[#0e1b12]/80"
                    >
                        <ArrowLeft className="h-4 w-4 shrink-0" />
                        Назад
                    </button>

                    <div className="inline-flex w-full max-w-md gap-1 rounded-full border border-[#c2a77444] bg-[#0e1b12] p-1 lg:max-w-none">
                        <Button
                            onClick={() => setActiveTab('info')}
                            icon={<LibraryBig className="h-4 w-4 shrink-0" />}
                            className={`!min-h-11 flex-1 !rounded-full !py-2.5 text-sm transition touch-manipulation md:!min-h-0 md:!py-1.5
                                ${activeTab === 'info'
                                    ? 'bg-[#c2a774] text-[#0E1B12] shadow-[0_0_12px_#c2a77466]'
                                    : 'bg-transparent text-[#c2a774] hover:bg-[#2b3a29]'}`}
                        >
                            Информация
                        </Button>
                        <Button
                            onClick={() => setActiveTab('graph')}
                            icon={<LinkIcon className="h-4 w-4 shrink-0" />}
                            className={`!min-h-11 flex-1 !rounded-full !py-2.5 text-sm transition touch-manipulation md:!min-h-0 md:!py-1.5
                                ${activeTab === 'graph'
                                    ? 'bg-[#c2a774] text-[#0E1B12] shadow-[0_0_12px_#c2a77466]'
                                    : 'bg-transparent text-[#c2a774] hover:bg-[#2b3a29]'}`}
                        >
                            Связи
                        </Button>
                    </div>
                </div>

                {activeTab === 'info' && (
                    <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                    >
                        {/* Hero card */}
                        <section className="relative overflow-hidden rounded-3xl border border-[#c2a77455] bg-[#111712]/95 shadow-[0_0_45px_#000] px-5 py-6 md:px-8 md:py-8">
                            <div className="pointer-events-none absolute -top-16 -right-10 w-48 h-48 rounded-full bg-[#c2a77418] blur-3xl" />
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#c2a774] to-transparent opacity-50 rounded-t-3xl" />
                            <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-6">
                                <div className="flex flex-col items-center md:items-start gap-4 shrink-0">
                                    {character.avatar ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsAvatarPreviewOpen(true)}
                                            className="relative group rounded-full focus:outline-none focus:ring-2 focus:ring-[#c2a77488]"
                                        >
                                            <img
                                                src={character.avatar}
                                                alt={character.name}
                                                className="w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] rounded-full object-cover border-2 border-[#c2a774] shadow-[0_0_24px_#000]"
                                            />
                                            <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-xs text-[#f5e9c6]">
                                                Увеличить
                                            </span>
                                        </button>
                                    ) : (
                                        <div className="w-[140px] h-[140px] rounded-full border border-dashed border-[#3a4a34] bg-[#0e1b12] flex items-center justify-center text-xs text-[#c7bc98]">
                                            Нет аватара
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#3a4a34] bg-[#141f16]/80 text-[11px] uppercase tracking-[0.22em] text-[#c7bc98]">
                                                <Sparkles className="w-3.5 h-3.5 text-[#c2a774]" />
                                                <span>Персонаж</span>
                                            </div>
                                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-garamond font-bold text-[#e5d9a5] leading-snug">
                                                {character.name}
                                            </h1>
                                            {character.user_id ? (
                                                <Link
                                                    to={`/player/${character.user_id}/characters`}
                                                    className="inline-block text-sm text-[#c2a774] hover:underline"
                                                >
                                                    Персонажи автора
                                                </Link>
                                            ) : null}
                                            {character.status && (
                                                <p className="flex items-center gap-2 text-sm text-[#c7bc98]">
                                                    <Pin size={14} className="text-[#c2a774]" />
                                                    <span>{character.status}</span>
                                                </p>
                                            )}
                                        </div>
                                        {isOwner ? (
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(true)}
                                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center self-start text-[#c7bc98] transition hover:text-[#e5d9a5]"
                                                aria-label="Редактировать"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                        ) : null}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                        {character.age && (
                                            <div className="flex items-center gap-2 text-[#c7bc98]">
                                                <Sparkles size={15} className="text-[#c2a774] shrink-0" />
                                                <span className="font-semibold text-[#c2a774]">Возраст:</span>
                                                <span>{character.age}</span>
                                            </div>
                                        )}
                                        {character.gender && (
                                            <div className="flex items-center gap-2 text-[#c7bc98]">
                                                <VenusAndMars size={15} className="text-[#c2a774] shrink-0" />
                                                <span className="font-semibold text-[#c2a774]">Пол:</span>
                                                <span>{character.gender}</span>
                                            </div>
                                        )}
                                        {character.origin?.name && (
                                            <div className="flex items-center gap-2 text-[#c7bc98]">
                                                <Earth size={15} className="text-[#c2a774] shrink-0" />
                                                <span className="font-semibold text-[#c2a774]">Страна:</span>
                                                <span>{character.origin.name}</span>
                                            </div>
                                        )}
                                        {character.location?.name && (
                                            <div className="flex items-center gap-2 text-[#c7bc98]">
                                                <House size={15} className="text-[#c2a774] shrink-0" />
                                                <span className="font-semibold text-[#c2a774]">Город:</span>
                                                <span>{character.location.name}</span>
                                            </div>
                                        )}
                                        {character.species && (
                                            <div className="flex items-start gap-2 sm:col-span-2 text-[#c7bc98]">
                                                <Dna size={15} className="text-[#c2a774] mt-0.5 shrink-0" />
                                                <span className="font-semibold text-[#c2a774]">Вид:</span>
                                                <span>{character.species}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {character.bio && (
                            <section className="relative rounded-2xl border border-[#3a4a34] bg-[#141f16]/90 shadow-[0_0_24px_#000] p-5 sm:p-6 space-y-3">
                                <h2 className="text-lg md:text-xl font-garamond font-bold text-[#e5d9a5] flex items-center gap-2">
                                    <BookCopy size={18} className="text-[#c2a774]" /> Биография
                                </h2>
                                <div
                                    dangerouslySetInnerHTML={{ __html: character.bio }}
                                    className="whitespace-pre-line text-[#c7bc98] text-sm sm:text-base leading-relaxed font-lora"
                                />
                            </section>
                        )}

                        {character.attributes && (
                            <section className="space-y-5">
                                <h2 className="text-lg md:text-xl font-garamond font-bold text-[#e5d9a5] flex items-center gap-2 border-t border-[#c2a77433] pt-6">
                                    <Sparkle size={18} className="text-[#c2a774]" />
                                    Атрибуты
                                </h2>
                                <div className="rounded-2xl border border-[#3a4a34] bg-[#141f16]/90 shadow-[0_0_24px_#000] p-4 sm:p-5">
                                    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-[#e5d9a5]">
                                        {([
                                            { icon: <Smile size={15} />, label: 'Харизма', value: character.attributes.charisma },
                                            { icon: <BicepsFlexed size={15} />, label: 'Сила', value: character.attributes.strength },
                                            { icon: <Sparkles size={15} />, label: 'Магия', value: character.attributes.magic },
                                            { icon: <BrainCircuit size={15} />, label: 'Интеллект', value: character.attributes.intelligence },
                                            { icon: <Zap size={15} />, label: 'Ловкость', value: character.attributes.dexterity },
                                            { icon: <ShieldUser size={15} />, label: 'Выносливость', value: character.attributes.endurance },
                                        ] as { icon: React.ReactNode; label: string; value: number }[]).map(({ icon, label, value }) => (
                                            <li key={label} className="flex flex-col items-center gap-1 rounded-xl border border-[#3a4a34] bg-[#0e1b12]/60 px-3 py-2">
                                                <span className="flex items-center gap-1 text-[#c2a774] text-xs font-semibold">
                                                    {icon} {label}
                                                </span>
                                                <span className="text-lg font-bold text-[#e5d9a5]">{value}</span>
                                            </li>
                                        ))}
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
                            <section className="space-y-4 border-t border-[#c2a77433] pt-6">
                                <h2 className="text-lg md:text-xl font-garamond font-bold text-[#e5d9a5] flex items-center gap-2">
                                    <BookCopy size={18} className="text-[#c2a774]" />
                                    Хроники с участием
                                </h2>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {linkedChronicles.map((chronicle) => {
                                        const moodEmoji = chronicle.mood?.split(' ')[0] || '📖';
                                        return (
                                            <li
                                                key={chronicle.id}
                                                className="rounded-2xl border border-[#3a4a34] bg-[#141f16]/90 shadow-[0_0_22px_#000] hover:border-[#c2a774bb] hover:shadow-[0_0_28px_#c2a77440] transition-all"
                                            >
                                                <Link
                                                    to={`/chronicles/${chronicle.id}`}
                                                    className="block p-4"
                                                >
                                                    <div className="flex items-start gap-3 mb-2">
                                                        <span className="text-xl leading-none shrink-0">{moodEmoji}</span>
                                                        <div>
                                                            <p className="text-sm font-semibold text-[#e5d9a5] hover:underline line-clamp-2">
                                                                {chronicle.title}
                                                            </p>
                                                            <p className="text-xs text-[#c7bc98] mt-0.5">
                                                                {formatEventDate(chronicle.event_date)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div
                                                        dangerouslySetInnerHTML={{ __html: chronicle.content }}
                                                        className="text-xs text-[#c7bc98] italic line-clamp-2"
                                                    />
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        )}

                        {character.extra && character.extra.length > 0 && (
                            <section className="rounded-2xl border border-[#3a4a34] bg-[#141f16]/90 shadow-[0_0_24px_#000] p-4 sm:p-5 space-y-3 border-t border-t-[#c2a77433] mt-2">
                                <h2 className="text-lg md:text-xl font-garamond font-bold text-[#e5d9a5] flex items-center gap-2">
                                    <Scroll size={18} className="text-[#c2a774]" /> Дополнительно
                                </h2>
                                <ul className="space-y-1.5 text-sm text-[#c7bc98]">
                                    {character.extra.map((field) => (
                                        <li key={field.id} className="flex items-start gap-2">
                                            <span className="font-semibold text-[#e5d9a5] shrink-0">{field.key}:</span>
                                            <span>{field.value}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        <CharacterEmotionsManager characterId={character.id} readOnly={!isOwner} />
                    </motion.div>
                )}

                {activeTab === 'graph' && (
                    <CharacterGraph
                        characters={relatedCharacters}
                        relationships={relatedRelationships}
                        onSelectCharacter={handleSelectCharacter}
                        allCharacters={otherCharacters}
                        readOnly={!isOwner}
                    />
                )}
            </div>

            <Modal isOpen={isOwner && isEditing} onClose={() => setIsEditing(false)}>
                <CharacterForm
                    initialCharacter={character}
                    onFinish={() => setIsEditing(false)}
                    onSave={async (char) => {
                        const { error } = await updateCharacter(char, supabase);
                        if (error) throw error;
                    }}
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
