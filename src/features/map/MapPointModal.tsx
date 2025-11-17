import React, { useEffect, useState, type JSX } from 'react';
import type { IconType, MapPoint } from '../../types/mapPoint';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useMapStorePoint } from '../../store/useMapStorePoint';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useChronicleStore } from '../../store/useChronicleStore';
import { Link } from 'react-router-dom';
import { Modal } from '../../components/Modal';
import {
    Church,
    Gem,
    Landmark,
    MapIcon,
    Pen,
    Tent,
    Trash2,
} from 'lucide-react';
import { Button } from '../../components/ChronicleButton';

interface MapPointModalProps {
    point: MapPoint;
    onClose: () => void;
}

const iconMeta: Record<
    IconType,
    { label: string; icon: JSX.Element; accent: string }
> = {
    default: {
        label: 'Пин',
        icon: <MapIcon className="w-4 h-4" />,
        accent: '#c2a774',
    },
    camp: {
        label: 'Лагерь',
        icon: <Tent className="w-4 h-4" />,
        accent: '#f1a54b',
    },
    city: {
        label: 'Город',
        icon: <Landmark className="w-4 h-4" />,
        accent: '#7ac4ff',
    },
    temple: {
        label: 'Храм',
        icon: <Church className="w-4 h-4" />,
        accent: '#d0b3ff',
    },
    treasure: {
        label: 'Сокровище',
        icon: <Gem className="w-4 h-4" />,
        accent: '#ffd86b',
    },
};

export const MapPointModal = ({ point, onClose }: MapPointModalProps) => {
    const { mapPoints, updateMapPoint, deleteMapPoint } = useMapStorePoint();
    const characters = useCharacterStore((s) => s.characters);
    const chronicles = useChronicleStore((s) => s.chronicles);
    const supabase = useSupabaseClient();

    const current = mapPoints.find((p) => p.id === point.id) || point;

    const [editMode, setEditMode] = useState(false);
    const [name, setName] = useState(current.name);
    const [description, setDescription] = useState(current.description || '');
    const [linkedCharacters, setLinkedCharacters] = useState<string[]>(
        current.linked_characters || []
    );
    const [linkedChronicles, setLinkedChronicles] = useState<string[]>(
        current.linked_chronicles || []
    );
    const [iconType, setIconType] = useState<IconType>(
        current.icon_type ?? 'default'
    );
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (current) {
            setName(current.name);
            setDescription(current.description || '');
            setLinkedCharacters(current.linked_characters || []);
            setLinkedChronicles(current.linked_chronicles || []);
            setIconType(current.icon_type || 'default');
        }
    }, [current]);

    const handleSave = async () => {
        if (!name.trim()) return;
        setLoading(true);
        const updated: MapPoint = {
            ...current,
            name: name.trim(),
            description: description.trim(),
            linked_characters: linkedCharacters,
            linked_chronicles: linkedChronicles,
            icon_type: iconType,
        };
        await updateMapPoint(updated, supabase);
        setLoading(false);
        setEditMode(false);
    };

    const handleDelete = async () => {
        setLoading(true);
        await deleteMapPoint(point.id, supabase);
        setLoading(false);
        setShowDeleteConfirm(false);
        onClose();
    };

    const meta = iconMeta[iconType] ?? iconMeta.default;

    return (
        <>
            <Modal isOpen onClose={onClose}>
                <div className="w-full no-scrollbar overflow-auto py-6 sm:py-8 text-[#e5d9a5] font-lora space-y-6">
                    <header className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b261a] border border-[#c2a77433] text-xs text-[#c7bc98]">
                                <span
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                                    style={{ backgroundColor: `${meta.accent}22` }}
                                >
                                    <span className="text-[#e5d9a5]">{meta.icon}</span>
                                </span>
                                <span className="uppercase tracking-wide text-[11px]">
                                    {meta.label}
                                </span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-garamond leading-snug break-words">
                                {current.name}
                            </h2>
                        </div>

                        {!editMode && (
                            <div className="flex flex-col gap-2 shrink-0">
                                <Button
                                    variant="outline"
                                    icon={<Pen className="w-4 h-4" />}
                                    className="text-xs sm:text-sm px-3 py-1.5"
                                    onClick={() => setEditMode(true)}
                                >
                                    Редактировать
                                </Button>
                                <Button
                                    variant="danger"
                                    icon={<Trash2 className="w-4 h-4" />}
                                    className="text-xs sm:text-sm px-3 py-1.5"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    Удалить
                                </Button>
                            </div>
                        )}
                    </header>

                    {!editMode && (
                        <div className="space-y-6">
                            <section className="bg-[#141f16]/90 rounded-2xl p-4 border border-[#c2a774] shadow-inner">
                                <h3 className="text-sm font-semibold text-[#c2a774] mb-2">
                                    Описание
                                </h3>
                                <p className="text-sm sm:text-base text-[#f5e9c6] whitespace-pre-line">
                                    {current.description || 'Нет описания для этой точки.'}
                                </p>
                            </section>

                            <section className="grid gap-4 sm:grid-cols-2">
                                <div className="bg-[#141f16]/90 rounded-2xl p-4 border border-[#c2a77433]">
                                    <h3 className="text-sm font-semibold text-[#c2a774] mb-2">
                                        Привязанные персонажи
                                    </h3>
                                    {linkedCharacters.length === 0 ? (
                                        <p className="text-sm text-[#c7bc98] italic">
                                            Персонажи не привязаны.
                                        </p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {linkedCharacters.map((id) => {
                                                const char = characters.find((c) => c.id === id);
                                                if (!char) return null;
                                                return (
                                                    <Link
                                                        key={id}
                                                        to={`/character/${id}`}
                                                        className="px-3 py-1 rounded-full bg-[#1a2318] border border-[#c2a77455] text-xs sm:text-sm hover:bg-[#2c3a28] hover:border-[#c2a774]"
                                                    >
                                                        {char.name}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-[#141f16]/90 rounded-2xl p-4 border border-[#c2a77433]">
                                    <h3 className="text-sm font-semibold text-[#c2a774] mb-2">
                                        Привязанные хроники
                                    </h3>
                                    {linkedChronicles.length === 0 ? (
                                        <p className="text-sm text-[#c7bc98] italic">
                                            Хроники не привязаны.
                                        </p>
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            {linkedChronicles.map((id) => {
                                                const ch = chronicles.find((c) => c.id === id);
                                                if (!ch) return null;
                                                return (
                                                    <Link
                                                        key={id}
                                                        to={`/chronicles/${id}`}
                                                        className="text-xs sm:text-sm text-[#e5d9a5] hover:underline"
                                                    >
                                                        {ch.title}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </section>

                            <div className="flex justify-end gap-3 pt-2 sm:hidden">
                                <Button
                                    variant="outline"
                                    icon={<Pen className="w-4 h-4" />}
                                    className="text-sm"
                                    onClick={() => setEditMode(true)}
                                >
                                    Редактировать
                                </Button>
                                <Button
                                    variant="danger"
                                    icon={<Trash2 className="w-4 h-4" />}
                                    className="text-sm"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    Удалить
                                </Button>
                            </div>
                        </div>
                    )}

                    {editMode && (
                        <div className="space-y-6">
                            <section className="bg-[#223120] rounded-2xl p-4 border border-[#c2a774] shadow-inner space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm text-[#c2a774]">Название</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#0e1b12] border border-[#c2a774] rounded-xl px-3 py-2 text-sm sm:text-base placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77466]"
                                        placeholder="Название точки"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm text-[#c2a774]">Описание</label>
                                    <textarea
                                        className="w-full bg-[#0e1b12] border border-[#c2a774] rounded-xl px-3 py-2 text-sm sm:text-base placeholder:text-[#f5e9c6]/50 focus:outline-none focus:ring-2 focus:ring-[#c2a77466] resize-none"
                                        placeholder="Краткая заметка о месте…"
                                        rows={3}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </section>

                            <section className="grid gap-4 sm:grid-cols-2">
                                <div className="bg-[#223120] rounded-2xl p-4 border border-[#c2a77433] space-y-2">
                                    <label className="text-sm font-semibold text-[#c2a774]">
                                        Привязанные персонажи
                                    </label>
                                    <div className="bg-[#0e1b12] no-scrollbar border border-[#3d4a38] rounded-xl p-2 space-y-1 max-h-48 overflow-y-auto">
                                        {characters.length === 0 ? (
                                            <p className="text-xs text-[#c7bc98] italic px-1 py-1.5">
                                                Персонажи ещё не созданы.
                                            </p>
                                        ) : (
                                            characters.map((char) => {
                                                const selected = linkedCharacters.includes(char.id);
                                                return (
                                                    <button
                                                        key={char.id}
                                                        type="button"
                                                        onClick={() =>
                                                            setLinkedCharacters((prev) =>
                                                                prev.includes(char.id)
                                                                    ? prev.filter(
                                                                        (id) => id !== char.id
                                                                    )
                                                                    : [...prev, char.id]
                                                            )
                                                        }
                                                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs sm:text-sm transition ${selected
                                                                ? 'bg-[#3a4c3a] text-[#e5d9a5]'
                                                                : 'text-[#c2a774] hover:bg-[#2f3e29]'
                                                            }`}
                                                    >
                                                        {char.name}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                <div className="bg-[#223120] rounded-2xl p-4 border border-[#c2a77433] space-y-2">
                                    <label className="text-sm font-semibold text-[#c2a774]">
                                        Привязанные хроники
                                    </label>
                                    <div className="bg-[#0e1b12] no-scrollbar border border-[#3d4a38] rounded-xl p-2 space-y-1 max-h-48 overflow-y-auto">
                                        {chronicles.length === 0 ? (
                                            <p className="text-xs text-[#c7bc98] italic px-1 py-1.5">
                                                Хроники ещё не созданы.
                                            </p>
                                        ) : (
                                            chronicles.map((ch) => {
                                                const selected =
                                                    linkedChronicles.includes(ch.id);
                                                return (
                                                    <button
                                                        key={ch.id}
                                                        type="button"
                                                        onClick={() =>
                                                            setLinkedChronicles((prev) =>
                                                                prev.includes(ch.id)
                                                                    ? prev.filter(
                                                                        (id) => id !== ch.id
                                                                    )
                                                                    : [...prev, ch.id]
                                                            )
                                                        }
                                                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs sm:text-sm transition ${selected
                                                                ? 'bg-[#3a4c3a] text-[#e5d9a5]'
                                                                : 'text-[#c2a774] hover:bg-[#2f3e29]'
                                                            }`}
                                                    >
                                                        {ch.title}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="bg-[#223120] rounded-2xl p-4 border border-[#c2a77433] space-y-2">
                                <label className="text-sm font-semibold text-[#c2a774]">
                                    Тип иконки
                                </label>
                                <div className="flex flex-wrap gap-2 sm:gap-3">
                                    {(
                                        [
                                            {
                                                value: 'default',
                                                label: 'Пин',
                                                icon: <MapIcon className="w-4 h-4" />,
                                            },
                                            {
                                                value: 'camp',
                                                label: 'Лагерь',
                                                icon: <Tent className="w-4 h-4" />,
                                            },
                                            {
                                                value: 'city',
                                                label: 'Город',
                                                icon: <Landmark className="w-4 h-4" />,
                                            },
                                            {
                                                value: 'temple',
                                                label: 'Храм',
                                                icon: <Church className="w-4 h-4" />,
                                            },
                                            {
                                                value: 'treasure',
                                                label: 'Сокровище',
                                                icon: <Gem className="w-4 h-4" />,
                                            },
                                        ] satisfies {
                                            value: IconType;
                                            label: string;
                                            icon: React.ReactNode;
                                        }[]
                                    ).map((opt) => {
                                        const active = iconType === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setIconType(opt.value)}
                                                className={[
                                                    'flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs sm:text-sm transition shadow-sm',
                                                    active
                                                        ? 'bg-[#3a4c3a] border-[#c2a774] text-[#f5e9c6] shadow-[0_0_12px_#c2a77455]'
                                                        : 'bg-[#0e1b12] border-[#3d4a38] text-[#c2a774] hover:bg-[#2f3e29]',
                                                ].join(' ')}
                                            >
                                                {opt.icon}
                                                <span>{opt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    type="button"
                                    className="text-sm px-4"
                                    onClick={() => setEditMode(false)}
                                >
                                    Отмена
                                </Button>
                                <Button
                                    type="button"
                                    className="text-sm px-4 disabled:opacity-40 disabled:cursor-not-allowed"
                                    onClick={handleSave}
                                >
                                    {loading ? 'Сохраняем…' : 'Сохранить изменения'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            <Modal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
            >
                <div className="text-[#e5d9a5] font-lora max-w-sm mx-auto space-y-4 p-6 sm:p-7">
                    <h3 className="text-xl font-garamond text-center">
                        Удалить точку?
                    </h3>
                    <p className="text-sm text-center text-[#c7bc98]">
                        Точка <span className="text-[#e5d9a5]">«{current.name}»</span> будет
                        удалена безвозвратно.
                    </p>
                    <div className="flex justify-center gap-4 pt-2">
                        <Button
                            variant="outline"
                            className="text-sm"
                            onClick={() => setShowDeleteConfirm(false)}
                        >
                            Отмена
                        </Button>
                        <Button
                            variant="danger"
                            className="text-sm"
                            onClick={handleDelete}
                        >
                            {loading ? 'Удаляем…' : 'Удалить'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
