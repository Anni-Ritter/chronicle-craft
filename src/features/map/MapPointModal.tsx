import React, { useEffect, useState } from 'react';
import type { MapPoint } from '../../types/mapPoint';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useMapStorePoint } from '../../store/useMapStorePoint';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useChronicleStore } from '../../store/useChronicleStore';
import { Link } from 'react-router-dom';

interface Props {
    point: MapPoint;
    onClose: () => void;
}

export const MapPointModal: React.FC<Props> = ({ point, onClose }) => {
    const { mapPoints } = useMapStorePoint();
    const [editMode, setEditMode] = useState(false);
    const [name, setName] = useState(point.name);
    const [description, setDescription] = useState(point.description || '');
    const [linkedCharacters, setLinkedCharacters] = useState<string[]>(point.linked_characters || []);
    const [linkedChronicles, setLinkedChronicles] = useState<string[]>(point.linked_chronicles || []);
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const current = mapPoints.find((p) => p.id === point.id);

    const supabase = useSupabaseClient();
    const { updateMapPoint, deleteMapPoint } = useMapStorePoint();

    const characters = useCharacterStore((s) => s.characters);
    const chronicles = useChronicleStore((s) => s.chronicles);

    const handleSave = async () => {
        setLoading(true);
        const updated: MapPoint = {
            ...point,
            name: name.trim(),
            description: description.trim(),
            linked_characters: linkedCharacters,
            linked_chronicles: linkedChronicles,
        };

        await updateMapPoint(updated, supabase);
        setLoading(false);
        setEditMode(false);
    };

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        setShowDeleteConfirm(false);
        setLoading(true);
        await deleteMapPoint(point.id, supabase);
        setLoading(false);
        onClose();
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    useEffect(() => {
        if (current) {
            setName(current.name);
            setDescription(current.description || '');
            setLinkedCharacters(current.linked_characters || []);
            setLinkedChronicles(current.linked_chronicles || []);
        }
    }, [current]);

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="relative bg-white rounded shadow-lg p-6 max-w-md w-full">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl font-bold"
                    aria-label="Закрыть"
                >
                    ✖️
                </button>
                {!editMode ? (
                    <>
                        <h2 className="text-xl font-bold mb-2">{current?.name}</h2>
                        <p className="text-sm text-gray-600 mb-4">{current?.description || 'Нет описания'}</p>

                        <div className="mb-2">
                            <strong>Персонажи:</strong>{' '}
                            {linkedCharacters.length > 0 ? (
                                <ul className="ml-5 text-sm">
                                    {linkedCharacters.map((id) => {
                                        const char = characters.find((c) => c.id === id);
                                        return char ? (
                                            <li key={id}>
                                                <Link to={`/character/${id}`} className="text-blue-600 hover:underline">
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
                        <div className="mb-4">
                            <strong>Хроники:</strong>{' '}
                            {linkedChronicles.length > 0 ? (
                                <ul className="ml-5 text-sm">
                                    {linkedChronicles.map((id) => {
                                        const ch = chronicles.find((c) => c.id === id);
                                        return ch ? (
                                            <li key={id}>
                                                <Link to={`/chronicles/${id}`} className="text-purple-700 hover:underline">
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

                        <div className="flex justify-end gap-2">
                            <button
                                className="text-blue-600 hover:underline"
                                onClick={() => setEditMode(true)}
                            >
                                ✏️ Редактировать
                            </button>
                            <button
                                className="text-red-600 hover:underline"
                                onClick={handleDeleteClick}
                            >
                                🗑️ Удалить
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="text-xl font-bold mb-4">Редактирование</h2>
                        <input
                            type="text"
                            className="w-full border px-3 py-2 rounded mb-3"
                            placeholder="Название"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <textarea
                            className="w-full border px-3 py-2 rounded mb-3"
                            placeholder="Описание"
                            value={description}
                            rows={4}
                            onChange={(e) => setDescription(e.target.value)}
                        />

                        <label className="block text-sm font-medium mb-1">Привязанные персонажи</label>
                        <select
                            multiple
                            className="w-full border px-2 py-1 rounded mb-3"
                            value={linkedCharacters}
                            onChange={(e) =>
                                setLinkedCharacters(Array.from(e.target.selectedOptions).map((opt) => opt.value))
                            }
                        >
                            {characters.map((char) => (
                                <option key={char.id} value={char.id}>
                                    {char.name}
                                </option>
                            ))}
                        </select>

                        <label className="block text-sm font-medium mb-1">Привязанные хроники</label>
                        <select
                            multiple
                            className="w-full border px-2 py-1 rounded mb-3"
                            value={linkedChronicles}
                            onChange={(e) =>
                                setLinkedChronicles(Array.from(e.target.selectedOptions).map((opt) => opt.value))
                            }
                        >
                            {chronicles.map((ch) => (
                                <option key={ch.id} value={ch.id}>
                                    {ch.title}
                                </option>
                            ))}
                        </select>

                        <div className="flex justify-end gap-2">
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                disabled={loading}
                                onClick={handleSave}
                            >
                                {loading ? 'Сохранение...' : 'Сохранить'}
                            </button>
                            <button
                                className="text-gray-600 hover:underline"
                                onClick={() => setEditMode(false)}
                            >
                                Отмена
                            </button>
                        </div>
                    </>
                )}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-60 bg-black bg-opacity-60 flex items-center justify-center">
                        <div className="bg-white rounded p-6 max-w-sm w-full shadow-lg">
                            <p className="mb-4 text-lg">Удалить точку «{point.name}»?</p>
                            <div className="flex justify-end gap-4">
                                <button
                                    className="px-4 py-2 rounded border border-gray-400 hover:bg-gray-100"
                                    onClick={handleCancelDelete}
                                    disabled={loading}
                                >
                                    Отмена
                                </button>
                                <button
                                    className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                                    onClick={handleConfirmDelete}
                                    disabled={loading}
                                >
                                    {loading ? 'Удаление...' : 'Удалить'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};
