import React, { useEffect, useState } from 'react';
import type { IconType, MapPoint } from '../../types/mapPoint';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useMapStorePoint } from '../../store/useMapStorePoint';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useChronicleStore } from '../../store/useChronicleStore';
import { Link } from 'react-router-dom';
import { Modal } from '../../components/Modal';
import { Church, Gem, Landmark, MapIcon, Pen, Tent, Trash2 } from 'lucide-react';
import { Button } from '../../components/ChronicleButton';

interface Props {
    point: MapPoint;
    onClose: () => void;
}

export const MapPointModal: React.FC<Props> = ({ point, onClose }) => {
    const { mapPoints, updateMapPoint, deleteMapPoint } = useMapStorePoint();
    const characters = useCharacterStore((s) => s.characters);
    const chronicles = useChronicleStore((s) => s.chronicles);
    const [editMode, setEditMode] = useState(false);
    const [name, setName] = useState(point.name);
    const [description, setDescription] = useState(point.description || '');
    const [linkedCharacters, setLinkedCharacters] = useState<string[]>(point.linked_characters || []);
    const [linkedChronicles, setLinkedChronicles] = useState<string[]>(point.linked_chronicles || []);
    const [iconType, setIconType] = useState<IconType>(point.icon_type ?? 'default');
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const supabase = useSupabaseClient();

    const current = mapPoints.find((p) => p.id === point.id);

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
        setLoading(true);
        const updated: MapPoint = {
            ...point,
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
        onClose();
    };


    return (
        <Modal isOpen onClose={onClose}>
            <div className="w-full bg-[#1e2c22] border border-[#c2a774] rounded-xl p-6 text-[#e5d9a5] font-lora">
                {!editMode ? (
                    <>
                        <h2 className="text-3xl font-garamond mb-2">{current?.name}</h2>
                        <p className="text-base mb-4 text-[#f5e9c6]">
                            {current?.description || 'Нет описания'}
                        </p>

                        <div className="mb-3">
                            <strong className="text-[#c2a774]">Персонажи:</strong>{' '}
                            {linkedCharacters.length > 0 ? (
                                <ul className="ml-4 mt-1 list-disc text-base">
                                    {linkedCharacters.map((id) => {
                                        const char = characters.find((c) => c.id === id);
                                        return char ? (
                                            <li key={id}>
                                                <Link to={`/character/${id}`} className="text-[#e5d9a5] hover:underline">
                                                    {char.name}
                                                </Link>
                                            </li>
                                        ) : null;
                                    })}
                                </ul>
                            ) : (
                                '—'
                            )}
                        </div>

                        <div className="mb-6">
                            <strong className="text-[#c2a774]">Хроники:</strong>{' '}
                            {linkedChronicles.length > 0 ? (
                                <ul className="ml-4 mt-1 list-disc text-base">
                                    {linkedChronicles.map((id) => {
                                        const ch = chronicles.find((c) => c.id === id);
                                        return ch ? (
                                            <li key={id}>
                                                <Link to={`/chronicles/${id}`} className="text-[#e5d9a5] hover:underline">
                                                    {ch.title}
                                                </Link>
                                            </li>
                                        ) : null;
                                    })}
                                </ul>
                            ) : (
                                '—'
                            )}
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button
                                className='text-base'
                                onClick={() => setEditMode(true)}
                                icon={<Pen />}
                            >
                                Редактировать
                            </Button>
                            <Button
                                variant='danger'
                                className='text-base'
                                onClick={() => setShowDeleteConfirm(true)}
                                icon={<Trash2 />}
                            >
                                Удалить
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className='space-y-5'>
                        <h2 className="text-3xl font-garamond mb-4">Редактирование точки</h2>
                        <div className='space-y-2'>
                            <label>Название</label>
                            <input
                                type="text"
                                className="w-full bg-[#0e1b12] border border-[#c2a774] rounded px-3 py-2 mb-3 placeholder:text-[#f5e9c6]/50"
                                placeholder="Название"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className='space-y-2'>
                            <label>Описание</label>
                            <textarea
                                className="w-full bg-[#0e1b12] border border-[#c2a774] rounded px-3 py-2 mb-3 placeholder:text-[#f5e9c6]/50"
                                placeholder="Описание"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className='space-y-2'>
                            <label className="block font-medium mb-1">Привязанные персонажи</label>
                            <div className="bg-[#0e1b12] no-scrollbar border border-[#3d4a38] rounded p-2 space-y-1 max-h-48 overflow-y-auto">
                                {characters.map((char) => {
                                    const selected = linkedCharacters.includes(char.id);
                                    return (
                                        <button
                                            key={char.id}
                                            type="button"
                                            onClick={() => {
                                                setLinkedCharacters((prev) =>
                                                    prev.includes(char.id)
                                                        ? prev.filter((id) => id !== char.id)
                                                        : [...prev, char.id]
                                                );
                                            }}
                                            className={`w-full text-left px-3 py-1 rounded transition font-lora
                                            ${selected ? 'bg-[#3a4c3a] text-[#e5d9a5]' : 'text-[#c2a774] hover:bg-[#2f3e29]'}`}
                                        >
                                            {char.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className='space-y-2'>
                            <label className="block font-medium mb-1">Привязанные хроники</label>
                            <div className="bg-[#0e1b12] no-scrollbar border border-[#3d4a38] rounded p-2 space-y-1 max-h-48 overflow-y-auto">
                                {chronicles.map((ch) => {
                                    const selected = linkedChronicles.includes(ch.id);
                                    return (
                                        <button
                                            key={ch.id}
                                            type="button"
                                            onClick={() => {
                                                setLinkedChronicles((prev) =>
                                                    prev.includes(ch.id)
                                                        ? prev.filter((id) => id !== ch.id)
                                                        : [...prev, ch.id]
                                                );
                                            }}
                                            className={`w-full text-left px-3 py-1 rounded transition font-lora
                                            ${selected ? 'bg-[#3a4c3a] text-[#e5d9a5]' : 'text-[#c2a774] hover:bg-[#2f3e29]'}`}
                                        >
                                            {ch.title}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className='space-y-2'>
                            <label className="block font-medium mb-1">Тип иконки</label>
                            <div className="flex flex-wrap gap-2">
                                {([
                                    { value: 'default', label: 'Пин', icon: <MapIcon /> },
                                    { value: 'camp', label: 'Лагерь', icon: <Tent /> },
                                    { value: 'city', label: 'Город', icon: <Landmark /> },
                                    { value: 'temple', label: 'Храм', icon: <Church /> },
                                    { value: 'treasure', label: 'Сокровище', icon: <Gem /> },
                                ] as { value: IconType; label: string; icon: React.ReactNode }[]).map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={`flex items-center gap-1 px-3 py-2 border rounded transition 
                    ${iconType === option.value
                                                ? 'bg-[#3a4c3a] border-[#c2a774] text-[#e5d9a5]'
                                                : 'bg-[#0e1b12] border-[#3d4a38] text-[#c2a774] hover:bg-[#2f3e29]'}`}
                                        onClick={() => setIconType(option.value)}
                                    >
                                        {option.icon}
                                        <span>{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 rounded bg-[#3d4a38] hover:bg-[#4c5a49] text-[#e5d9a5]"
                                onClick={() => setEditMode(false)}
                            >
                                Отмена
                            </button>
                            <button
                                className="px-4 py-2 rounded bg-[#c2a774] text-[#0e1b12] hover:bg-[#e5d9a5]"
                                disabled={loading || !name.trim()}
                                onClick={handleSave}
                            >
                                {loading ? 'Сохраняем...' : 'Сохранить'}
                            </button>
                        </div>
                    </div>
                )}

                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
                        <div className="bg-[#1e2c22] border border-[#c2a774] rounded-xl p-6 w-full max-w-sm">
                            <p className="mb-4 text-xl font-garamond text-[#e5d9a5]">Удалить точку «{point.name}»?</p>
                            <div className="flex justify-end gap-4">
                                <Button
                                    variant='outline'
                                    className="text-base"
                                    onClick={() => setShowDeleteConfirm(false)}
                                >
                                    Отмена
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={handleDelete}
                                    className='text-base'
                                >
                                    Удалить
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
