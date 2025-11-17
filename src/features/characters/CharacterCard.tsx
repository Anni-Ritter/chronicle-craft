import { useNavigate } from "react-router-dom";
import type { Character } from "../../types/character";
import { useCharacterStore } from "../../store/useCharacterStore";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { SquarePen, LucideTrash2, MoreVertical } from "lucide-react";
import Dice from "../../assets/icon/dice.svg";
import { Modal } from "../../components/Modal";
import { useEffect, useRef, useState } from "react";
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
    const [menuOpen, setMenuOpen] = useState(false);

    const cardRef = useRef<HTMLDivElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const totalAttributes = Object.values(character.attributes).reduce(
        (sum, val) => sum + val,
        0
    );

    const handleDeleteConfirmed = async () => {
        await removeCharacter(character.id, supabase);
        setIsDeleteModalOpen(false);
    };

    // Закрытие меню по клику вне
    useEffect(() => {
        if (!menuOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node)
            ) {
                setMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen]);

    const plainText = (character.bio || "").replace(/<[^>]+>/g, "");
    const bioPreview =
        plainText.length > 320
            ? plainText.slice(0, 320).trim() + "…"
            : plainText;

    return (
        <>
            <div
                ref={cardRef}
                onClick={() => navigate(`/character/${character.id}`)}
                className="group relative bg-[#141f16]/90 border border-[#3a4a34] rounded-3xl p-4 sm:p-5 
                           flex flex-col gap-4 cursor-pointer shadow-[0_0_28px_#00000070] 
                           hover:shadow-[0_0_34px_#000000c0] hover:border-[#c2a77488] transition"
            >
                <div className="pointer-events-none absolute inset-0 rounded-3xl border border-[#c2a77422]" />

                <div className="flex gap-4 items-start">
                    <div className="flex flex-col items-center gap-3 mr-1">
                        {character.avatar ? (
                            <img
                                src={character.avatar}
                                alt={character.name}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border border-[#c2a774] 
                                           shadow-[0_0_18px_#000]"
                            />
                        ) : (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-[#3a4a34] bg-[#101712] flex items-center justify-center text-xs text-[#c7bc98]">
                                Нет аватара
                            </div>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col gap-2">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="flex flex-col gap-1">
                                <div className="flex flex-row justify-between">
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-garamond font-semibold text-[#e5d9a5] 
                                               group-hover:drop-shadow-[0_0_4px_#e5d9a5aa]">
                                        {character.name}
                                    </h2>
                                    <div ref={menuRef} className="relative md:hidden">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMenuOpen((prev) => !prev);
                                            }}
                                            className="p-1.5 rounded-full border border-[#3a4a34] bg-[#101712]/90 
                                           text-[#e5d9a5] hover:bg-[#2c3c2b] hover:border-[#c2a774aa] 
                                           transition flex items-center justify-center"
                                            aria-label="Меню действий"
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        {menuOpen && (
                                            <div
                                                className="absolute right-0 mt-2 w-44 rounded-xl bg-[#101712] border border-[#3a4a34] 
                                               shadow-[0_0_25px_#000] flex flex-col py-1 z-30"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={() => {
                                                        setMenuOpen(false);
                                                        setIsEditing(true);
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#e5d9a5] 
                                                   hover:bg-[#1c281c] transition text-left"
                                                >
                                                    <SquarePen size={16} />
                                                    Редактировать
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setMenuOpen(false);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#d76f6f] 
                                                   hover:bg-[#3b2626] transition text-left"
                                                >
                                                    <LucideTrash2 size={16} />
                                                    Удалить
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {bioPreview && (
                                    <p className="sm:hidden text-[13px] text-[#c7bc98] font-lora line-clamp-3">
                                        {bioPreview}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full 
                                                bg-[#101712] border border-[#3a4a34] text-[#e5d9a5] text-xs md:text-sm font-lora">
                                    <img
                                        src={Dice}
                                        alt="dice"
                                        className="w-4 h-4 opacity-90"
                                    />
                                    <span className="uppercase tracking-[0.16em] text-[10px] text-[#c7bc98]">
                                        Сумма
                                    </span>
                                    <span className="text-[#f5e9c6] font-semibold">
                                        {totalAttributes}
                                    </span>
                                </div>
                                <div ref={menuRef} className="relative max-sm:hidden">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpen((prev) => !prev);
                                        }}
                                        className="p-1.5 rounded-full border border-[#3a4a34] bg-[#101712]/90 
                                           text-[#e5d9a5] hover:bg-[#2c3c2b] hover:border-[#c2a774aa] 
                                           transition flex items-center justify-center"
                                        aria-label="Меню действий"
                                    >
                                        <MoreVertical size={18} />
                                    </button>

                                    {menuOpen && (
                                        <div
                                            className="absolute right-0 mt-2 w-44 rounded-xl bg-[#101712] border border-[#3a4a34] 
                                               shadow-[0_0_25px_#000] flex flex-col py-1 z-20"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => {
                                                    setMenuOpen(false);
                                                    setIsEditing(true);
                                                }}
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-[#e5d9a5] 
                                                   hover:bg-[#1c281c] transition text-left"
                                            >
                                                <SquarePen size={16} />
                                                Редактировать
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setMenuOpen(false);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-[#d76f6f] 
                                                   hover:bg-[#3b2626] transition text-left"
                                            >
                                                <LucideTrash2 size={16} />
                                                Удалить
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {bioPreview && (
                            <div className="hidden sm:block">
                                <div
                                    className="clamped-html max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100 
                                               transition-all duration-500 text-[#c7bc98] text-[14px] md:text-[15px] font-lora mt-1 
                                               bg-[#00000055] px-3 py-2 rounded-xl backdrop-blur-sm"
                                >
                                    {bioPreview}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal isOpen={isEditing} onClose={() => setIsEditing(false)}>
                <CharacterForm
                    initialCharacter={character}
                    onFinish={() => setIsEditing(false)}
                    onSave={(char) =>
                        useCharacterStore
                            .getState()
                            .updateCharacter(char, supabase)
                    }
                />
            </Modal>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
            >
                <div className="p-6 sm:p-7 text-center text-[#c7bc98] font-lora">
                    <h2 className="text-xl md:text-2xl font-semibold text-[#e5d9a5] mb-4">
                        Удалить персонажа
                    </h2>
                    <p className="mb-6 text-sm md:text-base">
                        Вы уверены, что хотите удалить{" "}
                        <strong className="text-[#f5e9c6]">
                            {character.name}
                        </strong>
                        ? Это действие необратимо.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="text-sm md:text-base"
                        >
                            Отмена
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDeleteConfirmed}
                            className="text-sm md:text-base"
                        >
                            Удалить
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
