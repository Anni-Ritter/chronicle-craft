import { useNavigate } from "react-router-dom";
import type { Character } from "../../types/character";
import { useCharacterStore } from "../../store/useCharacterStore";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { SquarePen, LucideTrash2 } from "lucide-react";
import Dice from "../../assets/icon/dice.svg";
import { Modal } from "../../components/Modal";
import { useState } from "react";
import { CharacterForm } from "./CharacterForm";
import { Button } from "../../components/ChronicleButton";

interface CharacterCardProps {
    character: Character;
}

export const CharacterCard = ({ character }: CharacterCardProps) => {
    const navigate = useNavigate();
    const removeCharacter = useCharacterStore((s) => s.removeCharacter);
    const supabase = useSupabaseClient();
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const totalAttributes = Object.values(character.attributes).reduce((sum, val) => sum + val, 0);

    const handleDeleteConfirmed = async () => {
        await removeCharacter(character.id, supabase);
        setIsDeleteModalOpen(false);
    };

    const plainText = character.bio.replace(/<[^>]+>/g, '');
    const bioPreview =
        plainText.length > 390 ? plainText.slice(0, 390).trim() + '...' : plainText;
    return (
        <>
            <div
                onClick={() => navigate(`/character/${character.id}`)}
                className="group relative bg-[#223120] border border-[#c2a774] flex-col sm:flex-row rounded-2xl p-4 sm:p-5 flex gap-4 items-start sm:items-center justify-between cursor-pointer shadow-md hover:shadow-[0_0_25px_#c2a77480] transition"
            >
                <div className="absolute inset-0 rounded-2xl border border-[#c2a77433] pointer-events-none" />

                <div className="flex flex-row w-full justify-between gap-2">

                    <div className="flex flex-col gap-3 w-full">
                        <div className="flex items-center gap-4 w-full pr-6">
                            {character.avatar && (
                                <img
                                    src={character.avatar}
                                    alt={character.name}
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[#c2a774] shadow-md"
                                />
                            )}
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="flex items-start md:items-center justify-between flex-col sm:flex-row gap-2 sm:gap-4">
                                    <div className="text-xl sm:text-2xl font-semibold text-[#e5d9a5] font-lora group-hover:drop-shadow-[0_0_4px_#e5d9a5aa]">
                                        {character.name}
                                    </div>
                                    <div className="flex items-center gap-1 text-[#e5d9a5] font-lora text-lg sm:text-xl">
                                        <img src={Dice} alt="dice" className="w-5 h-5" />
                                        {totalAttributes}
                                    </div>
                                </div>

                                {character.bio && (
                                    <div className="hidden md:flex flex-col clamped-html overflow-hidden max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100 transition-all duration-500 text-[#c7bc98] text-[16px] font-lora mt-2 bg-[#00000033] px-3 py-2 rounded-xl backdrop-blur-sm">
                                        {bioPreview}
                                    </div>
                                )}
                            </div>

                        </div>
                        <div className="lg:hidden flex flex-col text-sm clamped-html font-lora">
                            {bioPreview}
                        </div>
                    </div>

                    <div className="flex items-center z-10 flex-col gap-3 lg:gap-2 lg:flex-row">
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditing(true);
                            }}
                            icon={<SquarePen size={20} />}
                            title="Редактировать"
                        />

                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsDeleteModalOpen(true);
                            }}
                            icon={<LucideTrash2 size={20} />}
                            title="Удалить"
                            variant="danger"
                        />
                    </div>
                </div>

            </div>
            <Modal isOpen={isEditing} onClose={() => setIsEditing(false)}>
                <CharacterForm
                    initialCharacter={character}
                    onFinish={() => setIsEditing(false)}
                    onSave={(char) => useCharacterStore.getState().updateCharacter(char, supabase)}
                />
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <div className="text-center text-[#c7bc98] font-lora">
                    <h2 className="text-xl font-semibold text-[#e5d9a5] mb-4">Удалить персонажа</h2>
                    <p className="mb-6">
                        Вы уверены, что хотите удалить <strong>{character.name}</strong>? Это действие необратимо.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="text-base"
                        >
                            Отмена
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDeleteConfirmed}
                            className="text-base"
                        >
                            Удалить
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};